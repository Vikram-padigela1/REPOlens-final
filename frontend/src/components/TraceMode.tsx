"use client";

import { useState } from "react";
import { ReactFlow, Controls, Background, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchApi } from "@/lib/api";
import { GitCommit, ArrowRight, AlertCircle, Layers } from "lucide-react";

interface TraceNodePayload {
  id: string;
  label: string;
  file?: string;
  type?: string;
}

interface TraceEdgePayload {
  source: string;
  target: string;
  label?: string;
}

interface TraceResponse {
  nodes: TraceNodePayload[];
  edges: TraceEdgePayload[];
}

export default function TraceMode() {
  const [query, setQuery] = useState("Trace the login flow");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const handleTrace = async (q?: string) => {
    const targetQuery = q || query;
    if (!targetQuery.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const json = await fetchApi<TraceResponse>("/api/trace", {
        method: "POST",
        body: JSON.stringify({ query: targetQuery.trim() }),
      });

      if (!json.nodes || json.nodes.length === 0) {
        setError("No execution flow could be inferred from the repository context.");
        setData(null);
        setLoading(false);
        return;
      }

      // Format nodes nicely for React Flow with staggering layout
      const nodes: Node[] = json.nodes.map((n: TraceNodePayload, i: number) => {
        const fileLabel = n.file ? n.file.split("/").slice(-2).join("/") : "";
        return {
          id: n.id,
          position: { x: 180 + (i % 2) * 60, y: i * 110 + 40 },
          data: {
            label: (
              <div className="text-left select-none font-sans">
                <div className="font-semibold text-xs text-[#58A6FF] font-mono flex items-center gap-1">
                  <GitCommit className="w-3.5 h-3.5" />
                  {n.label || n.id}
                </div>
                {fileLabel && (
                  <div className="text-[10px] text-[#8b949e] font-mono mt-0.5 truncate max-w-[200px]">
                    {fileLabel}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: "#0d0f12",
            border: "1px solid #2b303b",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            minWidth: "180px",
          },
        };
      });

      const edges: Edge[] = (json.edges || []).map((e: TraceEdgePayload, i: number) => ({
        id: `e-${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        label: e.label || "calls",
        animated: true,
        style: { stroke: "#58A6FF", strokeWidth: 2 },
        labelStyle: { fill: "#8b949e", fontSize: 10, fontFamily: "monospace" },
        labelBgStyle: { fill: "#0D1117", fillOpacity: 0.8 },
      }));

      setData({ nodes, edges });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate execution trace.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Trace the login flow",
    "Trace payment processing",
    "Trace route registration",
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 md:p-8 pb-4 shrink-0 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#ffffff] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#58A6FF]" />
              Flow Trace Engine
            </h2>
            <p className="text-[#8b949e] text-sm mt-1">
              Visualize how requests and function calls traverse through your codebase modules.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleTrace(s)}
              className="px-3 py-1 bg-[#0d0f12] hover:bg-[#21262D] border border-[#2b303b] hover:border-[#58A6FF]/40 rounded-full text-xs text-[#e3e8ee] transition-all flex items-center gap-1.5"
            >
              <span>{s}</span>
              <ArrowRight className="w-3 h-3 text-[#8b949e]" />
            </button>
          ))}
        </div>

        <div className="flex gap-2.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Trace the login flow"
            className="flex-1 bg-[#0d0f12] border border-[#2b303b] rounded-lg px-4 py-2.5 text-sm text-[#ffffff] focus:outline-none focus:border-[#58A6FF] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTrace();
            }}
          />
          <button
            className="bg-[#8a53ff] hover:bg-[#7239f2] disabled:bg-[#8a53ff]/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2"
            onClick={() => handleTrace()}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Tracing...</span>
              </>
            ) : (
              <span>Trace Flow</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg p-3 flex items-center gap-2 text-xs text-[#F85149]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex-1 w-full border-t border-[#2b303b] relative bg-[#090D13]">
        {data && data.nodes.length > 0 ? (
          <ReactFlow
            nodes={data.nodes}
            edges={data.edges}
            fitView
            colorMode="dark"
          >
            <Controls className="!bg-[#0d0f12] !border-[#2b303b] !text-[#e3e8ee]" />
            <Background color="#21262D" gap={20} />
          </ReactFlow>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#8b949e] p-6 text-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Synthesizing execution flow diagram...</span>
              </div>
            ) : (
              <div className="max-w-sm">
                <Layers className="w-10 h-10 text-[#2b303b] mx-auto mb-3" />
                <h4 className="text-sm font-medium text-[#e3e8ee] mb-1">Interactive Call Flow</h4>
                <p className="text-xs text-[#8b949e]">
                  Enter a workflow query above or click a suggestion to render an interactive call graph.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
