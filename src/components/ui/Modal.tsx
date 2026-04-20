import type { ProfileModalState } from "../../types";

interface ModalProps {
  modal: ProfileModalState;
  introText: string;
  onClose: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

export default function Modal({
  modal,
  introText,
  onClose,
  onRegenerate,
  onCopy,
  onAction
}: ModalProps) {
  if (!modal.open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#0a0a1a]/50 backdrop-blur-xl"
      id="profile-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl bg-[#0a0a0c] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(176,127,241,0.15)] border border-white/10 modal-animate flex flex-col max-h-[95vh] relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/20">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }}
            />
            <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-[#0a0a0c] p-1 shadow-2xl">
                <img
                  id="modal-profile-img"
                  src={`https://i.pravatar.cc/300?u=${encodeURIComponent(modal.name || "profile")}`}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-[2.2rem]"
                />
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 md:px-12 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-3xl md:text-4xl font-headline font-black text-white">
                    {modal.name}
                  </h3>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/30">
                    Verified Builder
                  </span>
                </div>
                <p className="text-lg md:text-xl text-primary font-bold mb-2">{modal.role}</p>
                <div className="flex flex-wrap items-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">location_on</span> San
                    Francisco, CA
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-secondary">
                    <span className="material-symbols-outlined text-sm">group</span> 500+
                    connections
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(event) => onAction(event, "Connection request sent")}
                  className="px-8 py-3 bg-primary text-on-primary font-headline font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all btn-interact"
                  type="button"
                >
                  Connect
                </button>
                <button
                  onClick={(event) => onAction(event, "Profile saved")}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined">bookmark</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
              <div className="lg:col-span-8 space-y-12">
                <div className="glass-panel p-8 rounded-[2rem] border-2 border-primary/20 bg-primary/5 relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                  <h4 className="text-lg font-headline font-black text-white mb-6 flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    AI Synergy Insight
                  </h4>
                  <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 mb-6">
                    <p id="modal-intro-text" className="text-lg text-white/80 leading-relaxed italic">
                      {introText}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onCopy}
                      className="px-6 py-2.5 bg-white text-black text-xs font-black rounded-lg hover:bg-white/80 transition-all flex items-center gap-2"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copy Intro
                    </button>
                    <button
                      onClick={onRegenerate}
                      className="px-6 py-2.5 bg-white/5 text-white/60 text-xs font-black rounded-lg border border-white/10 hover:text-white transition-all"
                      type="button"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-headline font-bold text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">info</span>
                    About
                  </h4>
                  <p className="text-on-surface-variant leading-relaxed text-lg">
                    Passionate protocol engineer with 6+ years of experience in distributed
                    systems. Currently obsessed with building the next generation of cross-chain
                    communication layers.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <h4 className="text-sm font-black text-white/40 uppercase tracking-widest px-1">
                  Top Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["Protocol Design", "Rust / Wasm", "ZK-Proofs", "Solidity", "AI Agents"].map(
                    (skill) => (
                      <span
                        key={skill}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
                {modal.score ? (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25">
                    <p className="text-xs text-primary uppercase font-black tracking-wider">
                      Match Score
                    </p>
                    <p className="text-3xl text-white font-black">{modal.score}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent h-20 pointer-events-none md:hidden" />
      </div>
    </div>
  );
}
