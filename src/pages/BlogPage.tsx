interface BlogProps {
  handleAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

export default function Blog({ handleAction }: BlogProps) {
  const articles = [
    ["How LLMs Are Changing the Way We Network", "April 8, 2026 · 6 min"],
    ["Your On-Chain Identity Is Your Best Business Card", "April 5, 2026 · 5 min"],
    ["Finding Your Co-Founder at a Hackathon", "April 1, 2026 · 7 min"],
    ["The Future of DAO Governance", "March 28, 2026 · 9 min"],
    ["DeFi in 2026", "March 22, 2026 · 5 min"],
    ["10 Questions Before Accepting a Connection", "March 15, 2026 · 4 min"]
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-primary mb-2 block">Knowledge Hub</span>
            <h2 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight">Builder's Blog</h2>
            <p className="text-on-surface-variant mt-1">Guides, tips, and insights for the AI + Web3 generation.</p>
          </div>
        </div>
      </section>

      <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-primary/20 bg-primary/5 relative group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
        <div className="p-10 md:p-14 flex flex-col md:flex-row gap-10 items-center relative">
          <div className="flex-1">
            <h3 className="text-3xl font-headline font-black text-white mb-4 leading-tight">The Art of the Cold Intro at Web3 Events</h3>
            <p className="text-on-surface-variant leading-relaxed mb-8 text-lg">This guide gives you 5 AI-powered tactics to break the ice and start memorable conversations.</p>
            <button onClick={(event) => handleAction(event, "Article opened")} className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm btn-interact">Read Article</button>
          </div>
          <div className="w-full md:w-64 h-48 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white/60" style={{ fontSize: "72px", fontVariationSettings: "'FILL' 1" }}>handshake</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {articles.map(([title, meta]) => (
          <div key={title} className="glass-panel rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/5 flex flex-col p-8">
            <h4 className="text-lg font-headline font-bold text-white mb-3 leading-tight">{title}</h4>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-xs text-white/40">{meta}</p>
              <button onClick={(event) => handleAction(event, "Article opened")} className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl btn-interact hover:bg-white/10 transition-all">Read →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
