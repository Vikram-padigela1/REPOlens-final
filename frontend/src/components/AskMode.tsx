"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import CodeViewer from "./code-viewer";
import { Sparkles, HelpCircle, Code2, AlertCircle, ArrowRight } from "lucide-react";

interface SourceEvidence {
  file: string;
  symbol: string;
  start_line: number;
  end_line: number;
  code: string;
}

interface AskResponse {
  answer: string;
  confidence: number;
  confidence_label: string;
  sources: SourceEvidence[];
}

export default function AskMode() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceEvidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setResponse(null);
    setSelectedSource(null);
    try {
      const data = await fetchApi<AskResponse>("/api/ask", {
        method: "POST",
        body: JSON.stringify({ query: q.trim() }),
      });
      setResponse(data);
      if (data.sources && data.sources.length > 0) {
        setSelectedSource(data.sources[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with intelligence engine.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Where is authentication handled?",
    "How does the login flow work?",
    "Where is the database initialized?",
    "How are payments processed?",
  ];

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 md:p-8 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#ffffff] flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-[#58A6FF]" />
          Ask Your Codebase
        </h2>
        <p className="text-[#8b949e] text-sm mt-1">
          Ask questions in natural language. Answers are strictly verified against repository AST evidence.
        </p>
      </div>

      {!response && !loading && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Suggested Questions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleAsk(s)}
                className="px-3.5 py-1.5 bg-[#0d0f12] hover:bg-[#21262D] border border-[#2b303b] hover:border-[#58A6FF]/40 rounded-full text-xs text-[#e3e8ee] transition-all flex items-center gap-1.5"
              >
                <span>{s}</span>
                <ArrowRight className="w-3 h-3 text-[#8b949e]" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2.5 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How does authentication work?"
            className="w-full bg-[#0d0f12] border border-[#2b303b] rounded-lg px-4 py-3 text-sm text-[#ffffff] placeholder-[#8b949e] focus:outline-none focus:border-[#58A6FF] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk(query);
            }}
          />
        </div>
        <button
          className="bg-[#8a53ff] hover:bg-[#7239f2] disabled:bg-[#8a53ff]/50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
          onClick={() => handleAsk(query)}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Thinking...</span>
            </>
          ) : (
            <span>Ask</span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg p-4 mb-6 flex items-start gap-3 text-[#F85149]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Error Querying Repository</h4>
            <p className="text-xs text-[#F85149]/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {response && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 pb-12">
          {/* Answer Column */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="bg-[#0d0f12] border border-[#2b303b] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-[#2b303b] pb-3">
                <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Verified Answer
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b949e]">Evidence Confidence:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      response.confidence_label === "High"
                        ? "bg-[#2EA043]/15 text-[#2EA043] border-[#2EA043]/30"
                        : response.confidence_label === "Medium"
                        ? "bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30"
                        : "bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30"
                    }`}
                  >
                    {Math.round(response.confidence * 100)}% · {response.confidence_label}
                  </span>
                </div>
              </div>

              <div className="text-[#ffffff] text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {response.answer}
              </div>
            </div>

            {/* Evidence List */}
            {response.sources.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#58A6FF]" />
                  Code Evidence ({response.sources.length})
                </h3>
                <div className="grid gap-2.5">
                  {response.sources.map((s, idx) => {
                    const isSelected = selectedSource === s;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSource(s)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#8a53ff]/10 border-[#58A6FF] shadow-md"
                            : "bg-[#0d0f12] border-[#2b303b] hover:border-[#8b949e]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-mono text-[#8b949e] truncate">{s.file}</div>
                            <div className="text-sm font-mono font-semibold text-[#58A6FF] mt-0.5">
                              {s.symbol}()
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-[#8b949e] bg-[#0D1117] px-2 py-0.5 rounded border border-[#2b303b]">
                            L{s.start_line}–{s.end_line}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Code Viewer Column */}
          {selectedSource && (
            <div className="lg:w-[480px] shrink-0 sticky top-4">
              <CodeViewer evidence={selectedSource} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
