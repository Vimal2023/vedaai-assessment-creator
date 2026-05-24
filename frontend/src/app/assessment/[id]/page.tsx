"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Printer, Bell, ChevronDown, Download, RefreshCw } from "lucide-react";

interface Question {
  _id: string;
  type: string;
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface AssessmentData {
  _id: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  createdAt: string;
  questions: Question[];
}

export default function AssessmentViewer({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/assessments/${assessmentId}`);
        if (!response.ok) {
          throw new Error("Could not find the requested assessment profile.");
        }
        const data = await response.json();
        
        // DEBUG LOG: Check this in your browser console (F12)
        console.log("DEBUG_DATA:", data); 
        
        setAssessment(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected network error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [assessmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = async (question: Question) => {
    setRegeneratingId(question._id); 
    
    try {
        const response = await fetch(`http://localhost:5000/api/assessments/${assessmentId}/regenerate-question/${question._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldQuestionText: question.questionText,
                questionType: question.type || 'subjective',
                marks: question.marks,
                context: assessment?.topic || "General Topic"
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.question) {
            setAssessment(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    questions: prev.questions.map(q => q._id === question._id ? data.question : q)
                };
            });
        }
    } catch (error) {
        console.error("Error regenerating question:", error);
    } finally {
        setRegeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 text-gray-800 animate-spin" />
        <p className="text-sm font-medium text-gray-400 font-mono tracking-tight">Compiling generated paper...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-100 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-red-900 uppercase tracking-wide">404 - Paper Not Found</h3>
        <p className="text-sm text-red-600">{error || "This assessment document may have been removed."}</p>
        <Link href="/" className="inline-block bg-white border border-gray-200 px-6 py-2 rounded-xl text-xs font-black text-gray-700 shadow-sm uppercase tracking-tighter">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Defensive calculation: default to 1 mark if undefined
  const totalMarks = assessment.questions?.reduce((sum, q) => sum + (q.marks ?? 1), 0) || 0;

  return (
    <div className="flex flex-col space-y-6 min-h-screen bg-[#F1F5F9] pb-20">
      
      <style jsx global>{`
        @media print {
          .no-print, header, .action-banner, button { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .paper-sheet { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 20mm !important; }
          .printable-block { page-break-inside: avoid; }
        }
      `}</style>

      <header className="flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 no-print">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
          <Link href="/" className="hover:text-black">← Create New</Link>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-gray-400 cursor-pointer" />
          <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">JD</div>
            <span className="text-sm font-bold text-gray-700">John Doe</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 no-print">
        <div className="bg-[#1A1A1A] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
          <p className="text-gray-300 text-sm font-medium">
            Certainly, Lakshya! Here is your customized Question Paper for {assessment.topic}.
          </p>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-black font-black text-xs px-6 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-all shrink-0 uppercase tracking-tight"
          >
            <Download className="h-4 w-4" />
            Download as PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 flex justify-center">
        <div className="paper-sheet bg-white w-full max-w-4xl shadow-2xl border border-gray-200 p-12 sm:p-20 space-y-8 min-h-[1100px]">
          <div className="text-center space-y-2 border-b-2 border-gray-900 pb-8">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Delhi Public School, Sector-4, Bokaro</h1>
            <div className="flex justify-center gap-8 text-sm font-bold text-gray-600">
              <span>Subject: {assessment.topic}</span>
              <span>Class: 12th</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-black text-gray-800">
            <span>Time Allowed: {assessment.timeLimit} minutes</span>
            <span>Maximum Marks: {totalMarks}</span>
          </div>

          <p className="text-xs font-bold text-gray-400 italic">All questions are compulsory unless stated otherwise.</p>

          <div className="grid grid-cols-2 gap-y-6 gap-x-12 py-4">
            <div className="border-b border-black flex gap-2 text-sm font-bold"><span>Name:</span><div className="flex-1"></div></div>
            <div className="border-b border-black flex gap-2 text-sm font-bold"><span>Roll Number:</span><div className="flex-1"></div></div>
            <div className="border-b border-black flex gap-2 text-sm font-bold col-span-2"><span>Class & Section:</span><div className="flex-1"></div></div>
          </div>

          <div className="text-center py-6"><h2 className="text-lg font-black uppercase border-b-4 border-gray-900 inline-block px-10 pb-1">Section A</h2></div>

          <div className="space-y-10">
             {assessment.questions?.map((question, index) => (
              <div key={question._id} className="printable-block space-y-4 group">
                <div className="flex justify-between gap-6">
                  <div className="text-sm font-bold text-gray-900 flex gap-3">
                    <span className="shrink-0">{index + 1}.</span>
                    <p className="leading-relaxed">
                      {question.questionText}
                      <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-widest">{assessment.difficulty}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleRegenerate(question)}
                      disabled={regeneratingId === question._id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity print:hidden p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="Regenerate this specific question"
                    >
                      <RefreshCw size={16} className={regeneratingId === question._id ? "animate-spin text-blue-600" : ""} />
                    </button>
                    <span className="text-sm font-black text-gray-900">[{question.marks ?? 1} Marks]</span>
                  </div>
                </div>
                {question.options && question.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 pl-8">
                    {question.options.map((option, optIdx) => (
                      <div key={optIdx} className="text-sm font-medium text-gray-700 flex gap-3">
                        <span className="font-bold">({String.fromCharCode(97 + optIdx)})</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-10 text-center border-t border-gray-100">
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">End of Question Paper</p>
          </div>

          <div className="mt-20 p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 no-print space-y-6">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Answer Key Reference:</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assessment.questions?.map((q, i) => (
                  <div key={q._id} className="text-xs font-bold text-slate-600">
                    <span className="text-slate-900 mr-2">{i+1}.</span> 
                    {q.correctAnswer || "Check reference materials"}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}