interface HomeProps {
  synergyScore: number;
  topMatches: Array<{ name: string; score: number; avatar: string }>;
  showView: (view: "matches") => void;
  onSearchEnter: (query: string) => void;
}

export default function Home({ synergyScore, topMatches, showView, onSearchEnter }: HomeProps) {
  return (
    <div className="space-y-12">
      <section className="space-y-6 -mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-4xl md:text-6xl font-headline font-black text-white tracking-tighter mb-1">
              MATCH3
            </p>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-white tracking-tighter mb-3">
              Find Your Perfect Match
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
              AI matched you with <span className="text-primary font-bold">{topMatches.length} new people</span>
              based on your startup goals.
            </p>
          </div>
          <button
            onClick={() => showView("matches")}
            className="px-8 py-4 bg-primary text-on-primary font-headline font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-all btn-interact shrink-0"
          >
            Find Matches
          </button>
        </div>

        <div className="relative w-full max-w-3xl group">
          <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors text-2xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search people, skills, or interests..."
            onKeyUp={(event) => {
              if (event.key === "Enter") onSearchEnter(event.currentTarget.value);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-8 text-lg text-white focus:outline-none focus:ring-4 focus:ring-primary/20 focus:bg-white/10 transition-all shadow-2xl"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between min-h-[200px] border border-primary/20 bg-primary/5">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">
            Synergy Score
          </span>
          <div className="text-7xl font-headline font-black text-white mb-4" id="synergy-score">
            {synergyScore}%
          </div>
          <p className="text-xs text-on-surface-variant">
            Top 5% of active matchmakers this month.
          </p>
        </div>
        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between min-h-[200px]">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 block">
            Connections Pulse
          </span>
          <div className="text-4xl font-headline font-black text-white mb-4">Steady Growth</div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-2/3" />
          </div>
        </div>
        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between min-h-[200px]">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">
            Recent Activity
          </span>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-sm text-white">
                {topMatches[0] ? `Matched with ${topMatches[0].name}` : "Run a match to see activity"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <p className="text-sm text-white/60">Profile viewed by Alex</p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight">
            Your Next 3 Matches
          </h2>
          <button
            onClick={() => showView("matches")}
            className="text-sm font-bold text-primary hover:underline"
          >
            View All Matches
          </button>
        </div>
        {topMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topMatches.slice(0, 3).map((match) => (
              <button
                type="button"
                key={match.name}
                onClick={() => showView("matches")}
                className="glass-panel p-6 rounded-2xl flex items-center gap-4 card-interact text-left"
              >
                <img src={match.avatar} className="w-12 h-12 rounded-xl" alt={match.name} />
                <div>
                  <p className="font-bold text-white">{match.name}</p>
                  <p className="text-xs text-primary">{match.score}% Match</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center border border-white/10">
            <p className="text-white/80">No live matches yet. Open Matches and run matching.</p>
            <button
              onClick={() => showView("matches")}
              className="mt-4 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl btn-interact"
            >
              Open Matches
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
