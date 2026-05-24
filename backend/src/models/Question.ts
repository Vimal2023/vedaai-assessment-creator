import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  assessmentId: Types.ObjectId;
  sectionName: string; // e.g., "Section A: Core Fundamentals"
  questionText: string;
  questionType: 'mcq' | 'subjective' | 'coding';
  options?: string[]; // Only used if questionType is MCQ
  correctAnswer: string; // The correct option index, or an ideal code/answer outline
  explanation?: string; // AI-generated reasoning
  marks: number;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    sectionName: { type: String, required: true },
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['mcq', 'subjective', 'coding'], required: true },
    options: { type: [String], default: undefined },
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    marks: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

export const Question = model<IQuestion>('Question', QuestionSchema);