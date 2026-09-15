import { Search, Map, Zap, BookOpen } from "lucide-react";

export type ModeId = "ask" | "trace" | "impact" | "onboard";

interface SidebarProps {
  activeMode: ModeId;
  setActiveMode: (m: ModeId) => void;
}

export default function Sidebar({ activeMode, setActiveMode }: SidebarProps) {
  const modes: Array<{ id: ModeId; label: string; icon: typeof Search }> = [
    { id: "ask", label: "Ask", icon: Search },
    { id: "trace", label: "Trace", icon: Map },
    { id: "impact", label: "Impact", icon: Zap },
    { id: "onboard", label: "Onboard", icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-[#010409] border-r border-[#30363D] flex flex-col shrink-0">
      <div className="p-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-[#E6EDF3] tracking-tight">RepoLens</h1>
      </div>

      <div className="px-3 py-2">
        <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2 px-2">Intelligence</div>
        <div className="space-y-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                activeMode === m.id
                  ? "bg-[#1F6FEB] text-white"
                  : "text-[#C9D1D9] hover:bg-[#21262D]"
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
