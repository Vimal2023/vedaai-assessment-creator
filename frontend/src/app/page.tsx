"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, SlidersHorizontal, MoreVertical, Plus, FileCheck2, Loader2, LayoutGrid, Calendar, Trash2, Edit3, Download, AlertTriangle } from "lucide-react";

interface Assessment {
  _id: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // UI Dropdown/Modal States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // Inline Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const response = await fetch("http://localhost:5000/api/assessments");
        if (response.ok) {
          const data = await response.json();
          setAssessments(data);
        }
      } catch (error) {
        console.error("Failed fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();

    const closeAllMenus = () => setActiveMenuId(null);
    window.addEventListener("click", closeAllMenus);
    return () => window.removeEventListener("click", closeAllMenus);
  }, []);

  // Auto-focus inline text input field when edit mode activates
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // 1. ACTION: Confirmed Database Deletion
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/assessments/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAssessments(assessments.filter((a) => a._id !== deleteTargetId));
      } else {
        alert("Failed to delete from server database.");
      }
    } catch (err) {
      console.error("Deletion failure:", err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  // 2. ACTION: Inline Rename Save Handler
  const saveInlineRename = async (id: string) => {
    if (!editTitleValue.trim()) {
      setEditingId(null);
      return;
    }

    const initialAssessment = assessments.find(a => a._id === id);
    if (initialAssessment && initialAssessment.title === editTitleValue.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });
      if (res.ok) {
        setAssessments(assessments.map((a) => (a._id === id ? { ...a, title: editTitleValue.trim() } : a)));
      } else {
        alert("Failed to update title.");
      }
    } catch (err) {
      console.error("Rename error:", err);
    } finally {
      setEditingId(null);
    }
  };

  // 3. ACTION: Target the specific layout route inside an off-screen iframe to trigger print download operation
  const handleQuickExport = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null); // Close dropdown immediately

    // Create a temporary iframe pointed directly to your page's preview URL
    const iframe = document.createElement("iframe");
    
    // Passing flag parameters ensures your page knows it's being exported and preserves the answer key block
    iframe.src = `http://localhost:3000/assessment/${id}?print=true&includeAnswers=true`;
    
    // Position it safely off-screen so user doesn't see it layout rendering
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "1024px";
    iframe.style.height = "768px";
    
    document.body.appendChild(iframe);

    // Once the page route loads fully inside the iframe, trigger the print dialog window
    iframe.onload = () => {
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      }, 1200); // Gives it 1.2 seconds to completely mount questions and styling configurations smoothly
    };

    // Clean up frame safely from DOM hierarchy threshold limits after a brief delay
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  };

  const filteredAssessments = assessments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 relative min-h-[85vh]">
      {/* Header Row Bar */}
      <header className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
          <span className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => router.back()}>←</span>
          <LayoutGrid className="h-4 w-4 text-gray-400" strokeWidth={2.5} />
          <span className="text-gray-900 font-semibold">Assignment</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-black" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-orange-500 rounded-full"></span>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 cursor-pointer group">
            <div className="h-8 w-8 rounded-full bg-orange-100 font-bold text-orange-700 text-xs flex items-center justify-center">JD</div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-black">John Doe</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Main Row Section Titles */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and create assignments for your classes.</p>
        </div>
        
        {!loading && assessments.length > 0 && (
          <button 
            onClick={() => router.push("/create")}
            className="bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> New Assignment
          </button>
        )}
      </div>

      {/* Filter and Search Layout Controls */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 border border-gray-200 bg-white text-sm text-gray-500 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" /> Filter By
        </button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Main Grid View Processing States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="h-7 w-7 text-gray-800 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Reading secure cluster files...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-16 max-w-2xl mx-auto mt-6">
          <div className="h-24 w-24 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm relative mb-6">
            <FileCheck2 className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No assignments found</h3>
          <p className="text-xs text-gray-400 max-w-xs">Get started by generating your first AI-powered structural assessment paper.</p>
          <button 
            onClick={() => router.push("/create")}
            className="bg-[#1a1a1a] hover:bg-black text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all mt-5 cursor-pointer"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((assessment) => (
            <div 
              key={assessment._id} 
              onClick={() => {
                if (editingId !== assessment._id) {
                  router.push(`/assessment/${assessment._id}`);
                }
              }}
              className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-44 group relative hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer ${
                activeMenuId === assessment._id ? "z-30" : "hover:z-10"
              }`}
            >
              
              {/* 3-Dot Dropdown Trigger Menu */}
              <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === assessment._id ? null : assessment._id);
                  }}
                  className="text-gray-400 hover:text-gray-900 p-1 rounded-lg transition-colors bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100 shadow-sm cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {activeMenuId === assessment._id && (
                  <div className="absolute right-0 top-8 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(assessment._id);
                        setEditTitleValue(assessment.title);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-gray-400" /> Rename / Edit Title
                    </button>
                    
                    <button 
                      onClick={(e) => handleQuickExport(assessment._id, assessment.title, e)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-400" /> Quick Export File
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(assessment._id);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Assignment
                    </button>
                  </div>
                )}
              </div>

              {/* Card Main Information - Swaps to an interactive input if active editing id triggers */}
              <div className="relative z-10 pr-8 flex-1">
                {editingId === assessment._id ? (
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={() => saveInlineRename(assessment._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveInlineRename(assessment._id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full text-base font-bold text-gray-900 border border-orange-400 rounded-lg px-2 py-0.5 bg-orange-50/30 outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 ml-2 font-medium">Press Enter to save, Esc to cancel</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-orange-600 transition-colors duration-200 line-clamp-2">
                      {assessment.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium line-clamp-1">
                      {assessment.topic}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Section INDICATORS */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] font-semibold text-gray-500 relative z-10">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Assigned: <span className="text-gray-700 font-bold">{new Date(assessment.createdAt).toLocaleDateString("en-GB")}</span>
                  </span>
                </div>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-extrabold tracking-wider border shadow-sm ${
                  assessment.status === 'completed' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : assessment.status === 'failed' 
                      ? 'bg-red-50 border-red-100 text-red-700' 
                      : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                }`}>
                  {assessment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOM CONFIRMATION DELETE DIALOG MODAL LAYOUT OVERLAY */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Delete Assignment?</h3>
            </div>         
            
            <p className="text-xs text-gray-500 leading-relaxed mb-4 pl-1">
              Are you sure? This action is permanent and cannot be undone.
            </p>
            
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}