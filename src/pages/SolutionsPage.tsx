interface SolutionsProps {
  showView: (view: "pricing") => void;
}

export default function Solutions({ showView }: SolutionsProps) {
  const cards = [
    ["psychology", "AI Matching System", "Our neural model ranks connections by genuine compatibility."],
    ["recommend", "Smart Recommendations", "Get proactive suggestions from your extended network."],
    ["edit_note", "Intro Message Generator", "Personalized, context-aware intros in one click."],
    ["account_balance_wallet", "Web3 Identity Layer", "Connect your wallet and verify on-chain reputation."],
    ["event", "Event-Aware Context", "Matches shift dynamically based on schedule and context."],
    ["shield", "Privacy by Design", "Granular controls and self-sovereign identity options."]
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-primary mb-4 block">Platform Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight">Built for the Web3 Era</h2>
          <p className="text-on-surface-variant mt-4 text-lg leading-relaxed">Everything you need to find meaningful connections at AI + Web3 events.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {cards.map(([icon, title, description]) => (
          <div key={title} className="glass-panel rounded-[2rem] p-10 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/5 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold text-white mb-3">{title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-[2.5rem] p-12 border border-primary/20 bg-primary/5 text-center relative overflow-hidden">
        <h3 className="text-3xl font-headline font-black text-white mb-4 relative">Ready to unlock smarter networking?</h3>
        <p className="text-on-surface-variant mb-8 max-w-xl mx-auto relative">Upgrade to Pro and get unlimited AI matches, advanced insights, and priority introductions.</p>
        <button onClick={() => showView("pricing")} className="px-10 py-4 bg-primary text-on-primary font-headline font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-all btn-interact">See Pricing Plans</button>
      </div>
    </div>
  );
}
