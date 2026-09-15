"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchApi } from "@/lib/api";
import { BookOpen, Sparkles, Copy, Check, AlertCircle } from "lucide-react";

export default function OnboardMode() {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchApi<{ markdown: string }>("/api/onboard", { method: "POST" });
      setData(json.markdown);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate onboarding guide.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6 md:p-8 overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-[#2b303b]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#ffffff] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#58A6FF]" />
            New Developer Mode
          </h2>
          <p className="text-[#8b949e] text-sm mt-1">
            Synthesize an onboarding guide, architecture map, and recommended file reading order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0d0f12] hover:bg-[#21262D] border border-[#2b303b] rounded-lg text-xs font-medium text-[#e3e8ee] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2EA043]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          )}
          <button
            className="bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{data ? "Regenerate Guide" : "Generate Guide"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg p-4 mb-6 flex items-center gap-2 text-xs text-[#F85149]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 pb-16">
        {data ? (
          <div className="bg-[#0d0f12] border border-[#2b303b] rounded-xl p-8 shadow-sm">
            <div className="prose prose-invert max-w-none prose-headings:text-[#ffffff] prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-[#2b303b] prose-h2:pb-2 prose-h2:mt-8 prose-h3:text-base prose-p:text-[#e3e8ee] prose-p:leading-relaxed prose-code:text-[#58A6FF] prose-code:bg-[#0D1117] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#2b303b] prose-pre:bg-[#090D13] prose-pre:border prose-pre:border-[#2b303b] prose-ul:text-[#e3e8ee]">
              <ReactMarkdown>{data}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center border border-dashed border-[#2b303b] rounded-xl text-[#8b949e] p-8 text-center bg-[#0d0f12]/30">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#2EA043] border-t-transparent rounded-full animate-spin"></div>
                <h4 className="text-sm font-medium text-[#e3e8ee]">Reading Repository AST & Synthesizing Guide...</h4>
                <p className="text-xs text-[#8b949e] max-w-xs">
                  Analyzing core files, symbol exports, and dependencies to outline the onboarding journey.
                </p>
              </div>
            ) : (
              <div className="max-w-md">
                <BookOpen className="w-12 h-12 text-[#2b303b] mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-[#e3e8ee] mb-1">
                  Onboarding Guide Not Yet Generated
                </h4>
                <p className="text-xs text-[#8b949e] mb-4">
                  Click the button above to automatically assemble architectural overviews, core modules, and first reading recommendations for this repository.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
