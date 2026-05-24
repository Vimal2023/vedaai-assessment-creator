"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function GenerationLoadingScreen() {
  const router = useRouter();
  const { id } = useParams(); // Retrieves the newly created assessment ID
  const [status, setStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [errorLog, setErrorLog] = useState("");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/assessments/${id}`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        if (data.status === "completed") {
          setStatus("completed");
          clearInterval(intervalId);
          // Redirect to the precise view route after a short success pause
          setTimeout(() => {
            // FIXED: Path changed from /assignments/ to /assessment/ to match your structure
            router.push(`/assessment/${id}`);
          }, 1500);
        } else if (data.status === "failed") {
          setStatus("failed");
          setErrorLog(data.error || "Generation error inside AI worker execution context.");
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 1.5 seconds
    intervalId = setInterval(checkStatus, 1500);
    // Run an initial check immediately
    checkStatus();

    return () => clearInterval(intervalId);
  }, [id, router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center space-y-6">
      {status === "pending" && (
        <>
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full border-4 border-gray-100 border-t-orange-500 animate-spin"></div>
            <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 shadow-sm animate-pulse">
              {/* Replaced Sparkles with a clean, prominent V for VedaAI branding */}
              <span className="text-2xl font-black font-sans tracking-tight">V</span>
            </div>
          </div>
          <div className="space-y-2">
            {/* FIXED: Re-branded to match your application branding layout exactly */}
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">VedaAI is crafting your exam...</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              VedaAI is structuring your questions, generating choices, and aligning distribution parameters.
            </p>
          </div>
        </>
      )}

      {status === "completed" && (
        <>
          <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm scale-110 transition-transform">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Generation Successful!</h2>
            <p className="text-sm text-emerald-600 font-semibold">
              Redirecting you to your finished examination workspace...
            </p>
          </div>
        </>
      )}

      {status === "failed" && (
        <>
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Generation Failed</h2>
            <p className="text-xs text-red-500 font-medium bg-red-50/50 p-3 rounded-xl border border-red-100">
              {errorLog}
            </p>
          </div>
          <button 
            onClick={() => router.push("/create")} 
            className="text-xs font-bold bg-[#1a1a1a] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-black transition-colors"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}