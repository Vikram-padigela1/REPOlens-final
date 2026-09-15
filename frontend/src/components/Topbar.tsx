import { GitBranch, RotateCcw, FileCode, Layers } from "lucide-react";

interface TopbarProps {
  repoStatus: string;
  repoUrl: string;
  repoStats?: {
    files?: number;
    functions?: number;
    classes?: number;
    total_units?: number;
  } | null;
  onResetRepo: () => void;
}

export default function Topbar({ repoStatus, repoUrl, repoStats, onResetRepo }: TopbarProps) {
  if (repoStatus === "empty") return null;

  return (
    <div className="h-14 border-b border-[#30363D] bg-[#0E1117] flex items-center px-6 justify-between shrink-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#8B949E]">
          <GitBranch className="w-4 h-4 text-[#58A6FF]" />
          <span className="font-medium text-[#C9D1D9] max-w-xs truncate">{repoUrl || "demo-repo"}</span>
        </div>

        {repoStats && repoStatus === "success" && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[#8B949E]">
              <FileCode className="w-3 h-3 text-[#58A6FF]" />
              <strong className="text-[#C9D1D9]">{repoStats.files ?? 0}</strong> files
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[#8B949E]">
              <Layers className="w-3 h-3 text-[#2EA043]" />
              <strong className="text-[#C9D1D9]">{repoStats.functions ?? 0}</strong> functions
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[#8B949E]">
              <strong className="text-[#C9D1D9]">{repoStats.classes ?? 0}</strong> classes
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {repoStatus === "success" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#2EA043] animate-pulse"></span>
            <span className="text-[#8B949E] font-medium">Indexed</span>
          </div>
        )}

        <button
          onClick={onResetRepo}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8B949E] hover:text-[#C9D1D9] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] rounded-md transition-colors"
          title="Switch or index another repository"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Switch Repo</span>
        </button>
      </div>
    </div>
  );
}
