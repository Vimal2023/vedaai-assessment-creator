import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import fs from 'fs';
import officeParser from 'officeparser';
// @ts-ignore
import pdfParse from 'pdf-parse-fork';
import Groq from 'groq-sdk';
import { Assessment } from './models/Assessment';
import { Question } from './models/Question';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Helper function to wrap officeparser into an async Promise block
const parseOfficeFile = (filePath: string): Promise<string> => {
  return new Promise((resolve) => {
    // @ts-ignore - Bypassing strict type mismatch for the callback
    officeParser.parseOffice(filePath, (data: any, err: any) => {
      if (err) {
        console.error("OfficeParser extraction error:", err);
        resolve("");
      } else {
        resolve(data || "");
      }
    });
  });
};

export const startWorker = () => {
  console.log("BullMQ Worker initialization listener started...");

  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assessmentId, difficulty, questionConfigs, file, additionalInfo } = job.data;
      console.log(`\n==================================================`);
      console.log(`[Job ${job.id}] Started processing for Assessment ID: ${assessmentId}`);
      console.log(`Teacher Notes / Instructions: "${additionalInfo || 'None provided'}"`);

      try {
        console.log("Checkpoint 1: Parsing configurations...");
        
        let extractedSourceContent = "";

        // Extract raw underlying content if a document layout cache is present
        if (file && file.path && fs.existsSync(file.path)) {
          const fileMime = file.mimetype.toLowerCase();
          const fileExtension = file.originalname.toLowerCase().split('.').pop();

          if (fileMime === 'application/pdf') {
            console.log(`Extracting text content from uploaded PDF: ${file.originalname}`);
            const dataBuffer = fs.readFileSync(file.path);
            const pdfData = await pdfParse(dataBuffer);
            extractedSourceContent = pdfData.text;
            console.log(`PDF text extraction completed (${extractedSourceContent.length} characters extracted).`);
          }
          else if (fileExtension === 'docx' || fileExtension === 'pptx' || fileMime.includes('wordprocessingml') || fileMime.includes('presentationml')) {
            console.log(`Extracting text content from uploaded Office file: ${file.originalname}`);
            extractedSourceContent = await parseOfficeFile(file.path);
          }
          else if (fileMime.includes('image/') || fileMime.includes('jpeg') || fileMime.includes('png')) {
             console.log(`Image upload detected. Groq standard models are text-only, skipping image vision ingestion.`);
          }
        }

        const configurations = questionConfigs && questionConfigs.length > 0 ? questionConfigs : [];

        const configPrompt = configurations.map((c: any) => 
          `- ${c.count} x "${c.type}" (worth ${c.marks} marks each)`
        ).join('\n');

        const fileContext = file ? `Reference File Name Provided: ${file.originalname}.` : '';

        // PROMPT ENGINEERING for Groq
        const prompt = `
          You are an expert academic examiner building an official exam paper.
          
          Context & Source Material:
          ${fileContext}
          ${extractedSourceContent ? `--- BEGIN SOURCE DOCUMENT TEXT ---\n${extractedSourceContent}\n--- END SOURCE DOCUMENT TEXT ---` : ''}
          
          CRITICAL TEACHER INSTRUCTIONS:
          "${additionalInfo || 'Generate standard textbook concept questions on the general topic of the document.'}"
          
          Target Difficulty Level: ${difficulty}
          
          You MUST generate a JSON object matching this structural request distribution:
          ${configPrompt}
          
          CRITICAL GENERATION INSTRUCTIONS:
          1. Auto-generate a clean, concise, professional academic title (3-5 words max) for the key "assessmentTitle".
          2. Return ONLY a valid JSON object.
          3. The output MUST STRICTLY follow this exact structure:
          {
            "assessmentTitle": "Your Title Here",
            "questions": [
              {
                "questionText": "The actual question",
                "options": [], 
                "correctAnswer": "MANDATORY: You MUST provide the correct answer/solution here for ALL question types (MCQ, Subjective, Numerical, etc). Do not skip this.",
                "explanation": "Brief explanation of the answer",
                "questionType": "Type of the question",
                "marks": 5
              }
            ]
          }
        `;

        console.log("Checkpoint 2: Calling Groq AI API model engine...");
        
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant", 
          response_format: { type: "json_object" }, 
        });

        console.log("Checkpoint 3: Groq responded successfully. Parsing text string...");
        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        
        const data = JSON.parse(responseText);
        const aiQuestions = data.questions;
        const generatedTitle = data.assessmentTitle || "Untitled AI Assessment";

        console.log(`AI Generated Title: "${generatedTitle}"`);

        if (!aiQuestions || !Array.isArray(aiQuestions)) {
          throw new Error("Parsed JSON does not contain a valid 'questions' array object.");
        }

console.log(`Checkpoint 4: Mapping ${aiQuestions.length} parsed AI questions to MongoDB documents...`);
        
        const mapToDatabaseEnum = (typeStr: any): 'mcq' | 'subjective' | 'coding' | 'diagram' => {
          if (!typeStr || typeof typeStr !== 'string') return 'subjective'; 
          const cleaned = typeStr.toLowerCase().trim();
          if (cleaned.includes('choice') || cleaned.includes('mcq')) return 'mcq'; 
          if (cleaned.includes('coding') || cleaned.includes('program')) return 'coding';
          return 'subjective'; 
        };

        const safeString = (val: any): string => {
          if (!val) return "";
          if (typeof val === 'string') return val;
          if (typeof val === 'object') {
            if (val.content) return String(val.content);
            if (val.text) return String(val.text);
            return JSON.stringify(val); 
          }
          return String(val);
        };

const questionDocs = aiQuestions.map((q: any) => {
          const extractedAnswer = q.correctAnswer || q.answer || q.solution || q.correct_answer || q.Answer;
          const extractedExplanation = q.explanation || q.reason || q.desc || q.description;
          const extractedQuestion = q.questionText || q.question || q.text;

          return {
            assessmentId,
            questionText: safeString(extractedQuestion) || "Sample Question Description Entry",
            options: mapToDatabaseEnum(q.questionType) === 'mcq' && Array.isArray(q.options) 
                        ? q.options.map(safeString) 
                        : [],
            correctAnswer: safeString(extractedAnswer) || "Answer not provided by AI.",
            explanation: safeString(extractedExplanation) || "No clarification provided.",
            questionType: mapToDatabaseEnum(q.questionType), 
            marks: Number(q.marks) || 1,
            sectionName: safeString(q.questionType) || 'Core Concepts',
          };
        });

        const savedQuestions = await Question.insertMany(questionDocs);
        const questionIds = savedQuestions.map((doc: any) => doc._id);

        console.log("Checkpoint 5: Updating Assessment status and setting title to completed...");
        
        await Assessment.findByIdAndUpdate(assessmentId, {
          title: generatedTitle,
          topic: generatedTitle,
          questions: questionIds,
          status: 'completed',
        });

        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        console.log(`Success! Worker finished processing job ${job.id}`);
        console.log(`==================================================`);

      } catch (err: any) {
        console.error(`\nWORKER CRASHED AT A CHECKPOINT! Job ID ${job.id} failed.`);
        console.error(`Error Message:`, err.message);
        
        await Assessment.findByIdAndUpdate(assessmentId, { status: 'failed' });
        throw err;
      }
    },
    { connection: redisConnection }
  );

  worker.on('completed', (job) => console.log(`Job ${job.id} finalized event emitted.`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed terminal execution event:`, err.message));
};