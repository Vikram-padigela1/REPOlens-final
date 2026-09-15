"use client";

import { useState } from "react";
import CodeViewer from "./code-viewer";
import { fetchApi } from "@/lib/api";

interface EvidenceSource {
  file: string;
  symbol: string;
  start_line: number;
  end_line: number;
  code: string;
}

interface ChatResponse {
  answer: string;
  confidence: number;
  confidence_label: string;
  sources: EvidenceSource[];
}

export default function Chat() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceSource | null>(null);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setResponse(null);
    setActiveEvidence(null);
    try {
      const data = await fetchApi<ChatResponse>("/api/ask", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      setResponse(data);
    } catch {
      setResponse({ answer: "Failed to get an answer.", confidence: 0, confidence_label: "Low", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Ask Your Codebase</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Where is authentication handled?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Asking..." : "Ask Codebase"}
          </button>
        </div>
      </div>

      {response && (
        <div className="flex gap-6 w-full items-start">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-2">Answer</h4>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{response.answer}</p>
            
            <hr className="my-4 border-gray-200" />
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Retrieval confidence</h4>
              <p className="text-gray-800 font-medium">
                {Math.round(response.confidence * 100)}% · <span className={response.confidence_label === "High" ? "text-green-600" : response.confidence_label === "Medium" ? "text-yellow-600" : "text-red-600"}>{response.confidence_label}</span>
              </p>
            </div>

            <hr className="my-4 border-gray-200" />
            
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Evidence</h4>
              {response.sources && response.sources.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {response.sources.map((source: EvidenceSource, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveEvidence(source)}
                      className={`p-3 rounded border cursor-pointer hover:bg-gray-50 transition ${activeEvidence === source ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <p className="font-medium text-blue-600">{source.file}</p>
                      <p className="text-sm font-mono text-gray-600">{source.symbol}()</p>
                      <p className="text-xs text-gray-500 mt-1">Lines {source.start_line}–{source.end_line}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No evidence provided.</p>
              )}
            </div>
          </div>
          
          {activeEvidence && (
            <div className="flex-1 sticky top-4">
              <CodeViewer evidence={activeEvidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
