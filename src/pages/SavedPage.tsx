interface SavedProps {
  savedMatches: Array<{ name: string; role: string; score: string; avatar: string; note: string }>;
  removeSavedMatch: (name: string) => void;
  openProfileModal: (name: string, role: string, score: string) => void;
  showView: (view: "matches") => void;
}

export default function Saved({ savedMatches, removeSavedMatch, openProfileModal, showView }: SavedProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-headline font-black text-white mb-2 tracking-tight">Saved People</h2>
        <p className="text-on-surface-variant">Review and manage the connections you've bookmarked.</p>
      </section>

      {savedMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {savedMatches.map((savedMatch) => (
            <div key={savedMatch.name} className="glass-panel rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/5">
                    <img src={savedMatch.avatar} alt={savedMatch.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-white">{savedMatch.name}</h3>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest">{savedMatch.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{savedMatch.score}</div>
                  <div className="text-[10px] font-bold text-primary uppercase">Match</div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl mb-8 border border-white/5 italic">
                <p className="text-sm text-white/40">"{savedMatch.note}"</p>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3">
                <button onClick={() => openProfileModal(savedMatch.name, savedMatch.role, savedMatch.score)} className="py-3 bg-primary text-on-primary font-bold rounded-xl text-xs btn-interact">
                  View Profile
                </button>
                <button onClick={() => removeSavedMatch(savedMatch.name)} className="py-3 bg-white/5 text-white border border-white/10 rounded-xl text-xs font-bold hover:bg-red-500/20 hover:text-red-500 transition-all">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-6">
            <span className="material-symbols-outlined text-4xl">bookmark_border</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No saved matches yet</h3>
          <p className="text-on-surface-variant max-w-xs">Save people from live match results to review them here.</p>
          <button onClick={() => showView("matches")} className="mt-8 px-6 py-3 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-sm btn-interact">
            Find Matches
          </button>
        </div>
      )}
    </div>
  );
}
