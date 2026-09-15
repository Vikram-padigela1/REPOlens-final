"use client";

import { FileCode, Hash, X } from "lucide-react";

interface CodeViewerProps {
  evidence: {
    file: string;
    symbol: string;
    start_line: number;
    end_line: number;
    code: string;
  };
  onClose?: () => void;
}

export default function CodeViewer({ evidence, onClose }: CodeViewerProps) {
  const codeLines = evidence.code.split("\n");

  return (
    <div className="bg-[#0D1117] rounded-lg border border-[#2b303b] overflow-hidden shadow-2xl flex flex-col w-full h-full max-h-[550px]">
      <div className="bg-[#0d0f12] px-4 py-3 border-b border-[#2b303b] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileCode className="w-4 h-4 text-[#58A6FF] shrink-0" />
          <span className="font-mono text-xs text-[#e3e8ee] truncate font-medium">{evidence.file}</span>
          <span className="text-[#8b949e] text-xs">::</span>
          <span className="font-mono text-xs text-[#58A6FF] font-semibold">{evidence.symbol}()</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e] font-mono bg-[#0D1117] px-2 py-0.5 rounded border border-[#2b303b]">
            <Hash className="w-3 h-3" />
            L{evidence.start_line}–{evidence.end_line}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#8b949e] hover:text-[#e3e8ee] p-1 rounded hover:bg-[#21262D]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-5 select-text bg-[#090D13]">
        <table className="w-full border-collapse">
          <tbody>
            {codeLines.map((line, idx) => {
              const lineNum = evidence.start_line + idx;
              return (
                <tr key={idx} className="hover:bg-[#0d0f12]/60">
                  <td className="w-10 pr-4 text-right text-[#484F58] select-none align-top">
                    {lineNum}
                  </td>
                  <td className="text-[#ffffff] whitespace-pre font-mono break-all align-top">
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
