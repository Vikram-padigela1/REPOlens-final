"use client";

import { useState } from "react";
import AskMode from "@/components/AskMode";
import TraceMode from "@/components/TraceMode";
import ImpactMode from "@/components/ImpactMode";
import OnboardMode from "@/components/OnboardMode";
import { Search, Code2, Sparkles, GitCompare, Boxes, LayoutTemplate, Terminal } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface IngestResponse {
  status: string;
  repo_url: string;
  files: number;
  functions: number;
  classes: number;
  total_units: number;
}

export default function Home() {
  const [repoStatus, setRepoStatus] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [activeMode, setActiveMode] = useState<"ask" | "trace" | "impact" | "onboard">("ask");
  const [repoUrl, setRepoUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [repoStats, setRepoStats] = useState<IngestResponse | null>(null);

  const analyzeRepo = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setRepoUrl(trimmed);
    setRepoStatus("loading");
    try {
      const data = await fetchApi<IngestResponse>("/api/ingest", {
        method: "POST",
        body: JSON.stringify({ repo_url: trimmed })
      });
      setRepoStats(data);
      setRepoStatus("success");
    } catch {
      setRepoStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-[#e3e8ee] font-sans selection:bg-[#4a34b2] selection:text-white">
      {/* SOURCEGRAPH STYLE TOP NAVIGATION */}
      <header className="h-14 border-b border-[#2b303b] bg-[#000000] flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight cursor-pointer" onClick={() => setRepoStatus("empty")}>
            <div className="w-6 h-6 bg-gradient-to-br from-[#8a53ff] to-[#4b32c3] rounded-md flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            RepoLens
          </div>
          
          {repoStatus === "success" && (
            <nav className="flex items-center gap-1 text-sm font-medium">
              <button onClick={() => setActiveMode("ask")} className={`px-3 py-1.5 rounded-md transition-colors ${activeMode === 'ask' ? 'bg-[#2b303b] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1a1e24]'}`}>Ask Q&A</button>
              <button onClick={() => setActiveMode("trace")} className={`px-3 py-1.5 rounded-md transition-colors ${activeMode === 'trace' ? 'bg-[#2b303b] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1a1e24]'}`}>Trace Flow</button>
              <button onClick={() => setActiveMode("impact")} className={`px-3 py-1.5 rounded-md transition-colors ${activeMode === 'impact' ? 'bg-[#2b303b] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1a1e24]'}`}>Impact</button>
              <button onClick={() => setActiveMode("onboard")} className={`px-3 py-1.5 rounded-md transition-colors ${activeMode === 'onboard' ? 'bg-[#2b303b] text-white' : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1a1e24]'}`}>Onboard</button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          {repoStatus === "success" && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#8b949e] bg-[#1a1e24] px-3 py-1 rounded-full border border-[#2b303b]">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span>{repoUrl || "demo-repo"}</span>
              </div>
              {repoStats && (
                <div className="hidden sm:flex items-center gap-2 text-[#8b949e]">
                  <span>{repoStats.files} files</span>
                  <span>•</span>
                  <span>{repoStats.functions} functions</span>
                  <span>•</span>
                  <span>{repoStats.classes} classes</span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setRepoStatus("empty");
              setInputUrl("");
            }}
            className="text-[#8b949e] hover:text-white transition-colors text-xs border border-[#2b303b] px-2.5 py-1 rounded-md hover:bg-[#1a1e24]"
          >
            Switch Repo
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {repoStatus === "empty" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a153a] via-[#000000] to-[#000000]">
            
            <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 bg-gradient-to-br from-[#8a53ff] to-[#4b32c3] rounded-xl flex items-center justify-center shadow-lg shadow-[#8a53ff]/20">
                  <Code2 className="w-7 h-7 text-white" />
               </div>
               <h1 className="text-5xl font-bold tracking-tight text-white">RepoLens</h1>
            </div>

            <p className="text-[#8b949e] mb-12 text-xl max-w-2xl text-center font-light">
              Understand where code lives, how it works, and what could break. Search, trace, and analyze any repository.
            </p>
            
            <div className="w-full max-w-3xl relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#8a53ff] to-[#4b32c3] rounded-xl blur opacity-25"></div>
              <div className="relative bg-[#0d0f12] border border-[#2b303b] rounded-xl p-2 flex items-center shadow-2xl focus-within:border-[#8a53ff] focus-within:ring-1 focus-within:ring-[#8a53ff] transition-all">
                <Search className="w-6 h-6 text-[#8b949e] ml-3 mr-2" />
                <input 
                  type="text" 
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste GitHub URL to ingest (e.g. https://github.com/org/repo)" 
                  className="flex-1 bg-transparent text-lg text-white placeholder-[#6b7280] focus:outline-none py-4 px-2"
                  onKeyDown={(e) => { if (e.key === 'Enter') analyzeRepo(inputUrl) }}
                />
                <button 
                  className="bg-[#8a53ff] hover:bg-[#7239f2] text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-colors ml-2 flex items-center gap-2"
                  onClick={() => analyzeRepo(inputUrl)}
                  disabled={!inputUrl.trim()}
                >
                  <Sparkles className="w-5 h-5" /> Analyze
                </button>
              </div>
            </div>

            <div className="mt-12 flex gap-4 text-sm text-[#8b949e]">
              <span className="flex items-center gap-1.5"><LayoutTemplate className="w-4 h-4"/> Context-aware AI</span>
              <span className="px-2">•</span>
              <span className="flex items-center gap-1.5"><GitCompare className="w-4 h-4"/> Blast Radius</span>
              <span className="px-2">•</span>
              <span className="flex items-center gap-1.5"><Boxes className="w-4 h-4"/> Trace Flow</span>
            </div>

            <button className="mt-16 text-[#8a53ff] hover:text-[#a77bff] hover:underline font-medium text-sm flex items-center gap-2" onClick={() => analyzeRepo("demo-repo")}>
               <Terminal className="w-4 h-4" /> Try with Demo Repository
            </button>
          </div>
        )}

        {repoStatus === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#000000]">
            <div className="w-80 bg-[#0d0f12] border border-[#2b303b] rounded-xl p-8 shadow-2xl">
              <h2 className="text-xl font-medium mb-6 text-white flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#8a53ff] border-t-transparent rounded-full animate-spin"></div>
                Analyzing codebase
              </h2>
              <div className="space-y-4 text-sm text-[#8b949e] font-mono">
                <div className="flex items-center gap-3 text-[#10b981]"><span>[OK]</span> Cloning repository...</div>
                <div className="flex items-center gap-3 text-[#10b981]"><span>[OK]</span> Parsing AST syntax trees...</div>
                <div className="flex items-center gap-3 animate-pulse text-[#e3e8ee]"><span>[...]</span> Generating embeddings...</div>
                <div className="flex items-center gap-3 text-[#4b5563]"><span>[  ]</span> Indexing vector database...</div>
              </div>
            </div>
          </div>
        )}

        {repoStatus === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center text-[#ef4444]">
            <h2 className="text-2xl font-medium mb-3">Unable to analyze repository.</h2>
            <p className="text-[#8b949e]">Please verify the repository URL and try again.</p>
            <button className="mt-8 bg-[#1a1e24] border border-[#2b303b] hover:bg-[#2b303b] text-white px-6 py-2 rounded-md font-medium" onClick={() => setRepoStatus("empty")}>
              Return Home
            </button>
          </div>
        )}

        {repoStatus === "success" && (
          <div className="flex-1 overflow-hidden">
            {activeMode === "ask" && <AskMode />}
            {activeMode === "trace" && <TraceMode />}
            {activeMode === "impact" && <ImpactMode />}
            {activeMode === "onboard" && <OnboardMode />}
          </div>
        )}
      </main>
    </div>
  );
}
