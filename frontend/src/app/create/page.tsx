"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Bell, ChevronDown, UploadCloud, Calendar, Plus, X, Mic, Loader2 } from "lucide-react";

interface QuestionRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export default function CreateAssignment() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State Trackers bound back to the original Figma layout
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState(""); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [rows, setRows] = useState<QuestionRow[]>([
    { id: "1", type: "Multiple Choice Questions", count: 4, marks: 1 },
    { id: "2", type: "Short Questions", count: 3, marks: 2 },
    { id: "3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
    { id: "4", type: "Numerical Problems", count: 5, marks: 5 },
  ]);

  const questionTypes = [
    "Multiple Choice Questions", 
    "Short Questions", 
    "Diagram/Graph-Based Questions", 
    "Numerical Problems", 
    "Long Essay Questions"
  ];

  const updateRow = (id: string, field: "count" | "marks", val: number) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: Math.max(1, r[field] + val) } : r));
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), type: "Multiple Choice Questions", count: 1, marks: 1 }]);
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) setRows(rows.filter(r => r.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const totalQuestions = rows.reduce((sum, r) => sum + r.count, 0);
  const totalMarks = rows.reduce((sum, r) => sum + (r.count * r.marks), 0);

  // GUARDRAIL: Form validation logic to protect backend context ingestion pipelines
  const isFormValid = selectedFile !== null || additionalInfo.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return; // Halt execution if requirements are bypassed

    const extractedTopic = additionalInfo.trim() || "Uploaded Document Assessment";

    setLoading(true);
    const formData = new FormData();
    
    formData.append("title", extractedTopic); 
    formData.append("topic", extractedTopic);
    formData.append("difficulty", "Medium");
    formData.append("questionConfigs", JSON.stringify(rows));
    formData.append("additionalInfo", additionalInfo);
    
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch("http://localhost:5000/api/assessments", {
        withCredentials: true,
        method: "POST",
        body: formData,
      } as any);
      if (response.ok) {
        const savedAssessment = await response.json();
        const assessmentId = savedAssessment._id || savedAssessment.id;
        
        if (assessmentId) {
          router.push(`/create/loading/${assessmentId}`);
        } else {
          router.push("/");
        }
      } else {
        const errData = await response.json();
        alert(`Generation Error: ${errData.error || 'Check server logs'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the generation backend service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
          <button type="button" onClick={() => router.back()} className="cursor-pointer hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <LayoutGrid className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
          <span className="text-gray-400 font-semibold cursor-pointer">Assignment</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-orange-500 rounded-full"></span>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <div className="h-8 w-8 rounded-full bg-orange-100 font-bold text-orange-700 text-xs flex items-center justify-center">JD</div>
            <span className="text-sm font-semibold text-gray-700">John Doe</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Header Banner Section */}
      <div className="space-y-4 mt-2">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center h-5 w-5 bg-emerald-100 rounded-full shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">Create Assignment</h1>
            <p className="text-xs text-gray-400 mt-1.5">Set up a new assignment for your students</p>
          </div>
        </div>
        <div className="relative w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-gray-500 rounded-full"></div>
        </div>
      </div>

      {/* Workspace Settings Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6 mt-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Assignment Details</h3>
          <p className="text-xs text-gray-400 mt-0.5">Basic information about your assignment</p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          className="hidden" 
          accept="image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
        />

        {/* Drag & Drop Frame */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            selectedFile ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50/80'
          }`}
        >
          <UploadCloud className={`h-5 w-5 mb-2 ${selectedFile ? 'text-emerald-500' : 'text-gray-400'}`} />
          {selectedFile ? (
            <div>
              <p className="text-sm font-bold text-emerald-800">File Selected Successfully</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-700">Choose a file or drag & drop it here</p>
              <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, PDF, DOCX, PPTX up to 10MB</p>
            </div>
          )}
          <button type="button" className="text-xs font-bold text-gray-600 underline mt-4 hover:text-black">
            {selectedFile ? 'Change File' : 'Browse Files'}
          </button>
        </div>

        <p className="text-center text-[11px] font-medium text-gray-400 -mt-2">Upload images or core text materials of your preferred curriculum data</p>

        {/* Due Date */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-800 block">Due Date</label>
          <div className="relative max-w-sm">
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white font-medium text-gray-700 focus:outline-none shadow-sm cursor-pointer" 
            />
          </div>
        </div>

        {/* Table Configurator */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-12 text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            <div className="col-span-6">Question Type</div>
            <div className="col-span-3 text-center">No. of Questions</div>
            <div className="col-span-3 text-center">Marks</div>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative flex-1">
                    <select 
                      value={row.type} 
                      onChange={(e) => setRows(rows.map(r => r.id === row.id ? { ...r, type: e.target.value } : r))} 
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none font-medium text-gray-800 shadow-sm"
                    >
                      {questionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => deleteRow(row.id)} 
                    disabled={rows.length === 1} 
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="col-span-3 flex items-center justify-center">
                  <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-xl p-1.5 w-full max-w-[130px]">
                    <button type="button" onClick={() => updateRow(row.id, "count", -1)} className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-500">-</button>
                    <span className="flex-1 text-center font-bold text-sm text-gray-800">{row.count}</span>
                    <button type="button" onClick={() => updateRow(row.id, "count", 1)} className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-500">+</button>
                  </div>
                </div>

                <div className="col-span-3 flex items-center justify-center">
                  <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-xl p-1.5 w-full max-w-[130px]">
                    <button type="button" onClick={() => updateRow(row.id, "marks", -1)} className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-500">-</button>
                    <span className="flex-1 text-center font-bold text-sm text-gray-800">{row.marks}</span>
                    <button type="button" onClick={() => updateRow(row.id, "marks", 1)} className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-500">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow} className="flex items-center gap-2 text-xs font-bold text-white bg-[#1a1a1a] hover:bg-black rounded-xl px-4 py-2.5 shadow-sm mt-2">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Add Question Type
          </button>
        </div>

        {/* Counter Summary Panel */}
        <div className="flex flex-col items-end gap-1.5 text-xs font-bold text-gray-400 pr-4 pt-2 border-t border-gray-100">
          <div>Total Questions : <span className="text-gray-800 text-sm font-extrabold ml-1">{totalQuestions}</span></div>
          <div>Total Marks : <span className="text-gray-800 text-sm font-extrabold ml-1">{totalMarks}</span></div>
        </div>

        {/* Additional Input Box */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-gray-800 block">Additional Information (For better output)</label>
          <div className="relative">
            <textarea 
              rows={3} 
              placeholder="Provide a prompt topic or context overview here to begin..." 
              value={additionalInfo} 
              onChange={(e) => setAdditionalInfo(e.target.value)} 
              className="w-full p-4 pr-12 border border-gray-200 rounded-2xl text-sm focus:outline-none resize-none text-gray-800 font-medium bg-gray-50/30 focus:bg-white placeholder-gray-300 transition-all shadow-sm" 
            />
            <button type="button" className="absolute right-4 bottom-4 h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900">
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Row */}
      <div className="flex items-center justify-between px-2 pt-2">
        <button type="button" onClick={() => router.back()} className="border border-gray-200 bg-white px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">
          ← Previous
        </button>
        <div className="relative group">
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={loading || !isFormValid} 
            className={`text-sm font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all duration-200 ${
              isFormValid 
                ? "bg-[#1a1a1a] hover:bg-black text-white cursor-pointer" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <>Next →</>}
          </button>
          {!isFormValid && (
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-[10px] py-1 px-2.5 rounded-md whitespace-nowrap shadow-md font-medium z-10">
              Please upload a document or provide text context to generate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}