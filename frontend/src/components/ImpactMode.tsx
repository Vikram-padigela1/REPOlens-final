"use client";

import { useState } from "react";
import { ReactFlow, Controls, Background, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fetchApi } from "@/lib/api";
import { Zap, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

interface ImpactNodePayload {
  id: string;
  label: string;
  file?: string;
  type?: string;
}

interface ImpactEdgePayload {
  source: string;
  target: string;
}

interface ImpactResponse {
  summary: string;
  level: "HIGH" | "MEDIUM" | "LOW" | string;
  affected_files_count: number;
  nodes: ImpactNodePayload[];
  edges: ImpactEdgePayload[];
}

export default function ImpactMode() {
  const [symbol, setSymbol] = useState("AuthService.authenticate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ info: ImpactResponse; nodes: Node[]; edges: Edge[] } | null>(null);

  const handleImpact = async (sym?: string) => {
    const target = sym || symbol;
    if (!target.trim()) return;
    if (sym) setSymbol(sym);
    setLoading(true);
    setError(null);
    try {
      const json = await fetchApi<ImpactResponse>("/api/impact", {
        method: "POST",
        body: JSON.stringify({ symbol: target.trim() }),
      });

      const nodes: Node[] = (json.nodes || []).map((n: ImpactNodePayload, i: number) => {
        const isTarget = n.label === target || n.id === target || n.id?.endsWith(target);
        return {
          id: n.id,
          position: {
            x: isTarget ? 300 : (i % 2 === 0 ? 120 : 480),
            y: isTarget ? 50 : Math.floor(i / 2) * 110 + 160,
          },
          data: {
            label: (
              <div className="text-left font-mono">
                <div className={`text-xs font-semibold ${isTarget ? "text-white" : "text-[#58A6FF]"}`}>
                  {n.label}
                </div>
                {n.file && (
                  <div className="text-[10px] text-[#8b949e] truncate max-w-[180px] mt-0.5">
                    {n.file}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: isTarget ? "#238636" : "#0d0f12",
            color: "#fff",
            border: isTarget ? "2px solid #2EA043" : "1px solid #2b303b",
            borderRadius: "8px",
            padding: "10px 14px",
            boxShadow: isTarget ? "0 0 20px rgba(46, 160, 67, 0.4)" : "0 4px 10px rgba(0,0,0,0.3)",
            minWidth: "160px",
          },
        };
      });

      const edges: Edge[] = (json.edges || []).map((e: ImpactEdgePayload, i: number) => ({
        id: `impact-e${i}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#F85149", strokeWidth: 2 },
      }));

      setData({ info: json, nodes, edges });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze impact.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "AuthService",
    "login",
    "Database",
    "processPayment",
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 md:p-8 pb-4 shrink-0 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold tracking-tight text-[#ffffff] flex items-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-[#D29922]" />
          Change Impact & Blast Radius Explorer
        </h2>
        <p className="text-[#8b949e] text-sm mb-4">
          Simulate modifications to understand downstream effects across functions and modules before altering code.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleImpact(s)}
              className="px-3 py-1 bg-[#0d0f12] hover:bg-[#21262D] border border-[#2b303b] hover:border-[#D29922]/40 rounded-full text-xs text-[#e3e8ee] transition-all flex items-center gap-1.5"
            >
              <span>{s}</span>
              <ArrowRight className="w-3 h-3 text-[#8b949e]" />
            </button>
          ))}
        </div>

        <div className="flex gap-2.5 mb-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. AuthService or login"
            className="flex-1 bg-[#0d0f12] border border-[#2b303b] rounded-lg px-4 py-2.5 font-mono text-sm text-[#ffffff] focus:outline-none focus:border-[#58A6FF] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleImpact();
            }}
          />
          <button
            className="bg-[#8a53ff] hover:bg-[#7239f2] disabled:bg-[#8a53ff]/50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 flex items-center gap-2"
            onClick={() => handleImpact()}
            disabled={loading || !symbol.trim()}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze Blast Radius</span>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-xs text-[#F85149]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="bg-[#0d0f12] border border-[#2b303b] rounded-xl p-5 mb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs text-[#8b949e] uppercase font-semibold tracking-wider">
                  Risk Assessment:
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    data.info.level === "HIGH"
                      ? "bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30"
                      : data.info.level === "MEDIUM"
                      ? "bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30"
                      : "bg-[#2EA043]/15 text-[#2EA043] border-[#2EA043]/30"
                  }`}
                >
                  {data.info.level} RISK
                </span>
              </div>
              <p className="text-[#e3e8ee] text-xs leading-relaxed">{data.info.summary}</p>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#2b303b] pt-3 md:pt-0 md:pl-6 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#ffffff]">
                  {data.info.affected_files_count || data.nodes.length}
                </div>
                <div className="text-[11px] text-[#8b949e] uppercase tracking-wider">
                  Potentially Impacted
                </div>
              </div>
            </div>
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
                <div className="w-6 h-6 border-2 border-[#D29922] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Calculating dependency graph and impact propagation...</span>
              </div>
            ) : (
              <div className="max-w-sm">
                <ShieldAlert className="w-10 h-10 text-[#2b303b] mx-auto mb-3" />
                <h4 className="text-sm font-medium text-[#e3e8ee] mb-1">Blast Radius Visualizer</h4>
                <p className="text-xs text-[#8b949e]">
                  Select or input a symbol above to map callers, dependencies, and risk level.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
