import { SIDEBAR_NAV } from "../../utils/constants";
import type { ViewId } from "../../types";

interface SidebarProps {
  activeView: ViewId;
  showView: (view: ViewId) => void;
}

export default function Sidebar({ activeView, showView }: SidebarProps) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.05)] z-40 hidden lg:flex flex-col p-6 gap-2 font-['Inter'] text-sm tracking-wide focus-transition">
      <div className="mb-6 px-2 pt-4">
        <h2 className="text-lg font-bold text-white">MATCH3</h2>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Specialist Matchmaker</p>
      </div>
      <nav className="flex flex-col gap-1">
        {SIDEBAR_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => showView(item.id)}
            className={[
              "flex items-center gap-3 px-4 py-3 text-left transition-all duration-200",
              activeView === item.id
                ? "bg-[#ffffff]/10 text-[#ffffff] rounded-md font-semibold"
                : "text-[#ffffff]/40 hover:bg-[#ffffff]/5 hover:text-[#ffffff]"
            ].join(" ")}
          >
            <span className="material-symbols-outlined" data-icon={item.icon}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
