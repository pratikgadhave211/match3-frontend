import { SIDEBAR_NAV } from "../../utils/constants";
import type { ViewId } from "../../types";

interface MobileNavProps {
  activeView: ViewId;
  showView: (view: ViewId) => void;
}

export default function MobileNav({ activeView, showView }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0b081c]/90 backdrop-blur-lg h-20 flex items-center justify-around px-4 z-50 border-t border-white/5">
      {SIDEBAR_NAV.slice(0, 3).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => showView(item.id)}
          className={[
            "flex flex-col items-center gap-1",
            activeView === item.id ? "text-[#ffffff]" : "text-[#ffffff]/40"
          ].join(" ")}
        >
          <span className="material-symbols-outlined" data-icon={item.icon} style={item.id === "home" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.label.slice(0, 4)}</span>
        </button>
      ))}
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -translate-y-4 shadow-lg text-on-primary">
        <span className="material-symbols-outlined" data-icon="add">
          add
        </span>
      </div>
      {SIDEBAR_NAV.slice(3).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => showView(item.id)}
          className={[
            "flex flex-col items-center gap-1",
            activeView === item.id ? "text-[#ffffff]" : "text-[#ffffff]/40"
          ].join(" ")}
        >
          <span className="material-symbols-outlined" data-icon={item.icon}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.label.slice(0, 4)}</span>
        </button>
      ))}
    </nav>
  );
}
