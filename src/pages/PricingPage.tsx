interface PricingProps {
  handleAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

export default function Pricing({ handleAction }: PricingProps) {
  return (
    <div className="space-y-12">
      <section className="space-y-4 text-center max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-primary block">Simple & Transparent</span>
        <h2 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight">Choose Your Plan</h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">Start free and upgrade when you're ready to unlock the full power of AI-driven networking.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col gap-8 border border-white/5">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40 mb-3">Free</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-6xl font-headline font-black text-white">$0</span>
              <span className="text-white/40 mb-2">/ month</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">Perfect for exploring the platform and making your first meaningful connections.</p>
          </div>
          <button onClick={(event) => handleAction(event, "Free plan selected")} className="w-full py-4 bg-white/5 border border-white/10 text-white font-headline font-black rounded-2xl hover:bg-white/10 transition-all btn-interact">
            Get Started Free
          </button>
        </div>

        <div className="relative rounded-[2.5rem] p-1 bg-gradient-to-br from-primary/60 via-secondary/40 to-primary/30 shadow-2xl shadow-primary/20">
          <div className="bg-[#0d0b1e] rounded-[2.3rem] p-10 flex flex-col gap-8 h-full relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-primary mb-3">Pro</p>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-6xl font-headline font-black text-white">$19</span>
                  <span className="text-white/40 mb-2">/ month</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">For serious builders who want every advantage in finding the right people.</p>
              </div>
              <span className="px-3 py-1.5 bg-primary text-on-primary text-[10px] font-black uppercase rounded-lg shrink-0">Most Popular</span>
            </div>
            <button onClick={(event) => handleAction(event, "Pro upgrade started")} className="w-full py-4 bg-primary text-on-primary font-headline font-black rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-all btn-interact relative">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-10 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto w-full">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Enterprise</p>
          <h4 className="text-2xl font-headline font-bold text-white mb-2">Running a large event or community?</h4>
          <p className="text-on-surface-variant">Custom AI matching for 500+ attendees, white-label options, and dedicated support.</p>
        </div>
        <button onClick={(event) => handleAction(event, "Enterprise enquiry sent")} className="shrink-0 px-8 py-4 bg-white/5 border border-white/10 text-white font-headline font-bold rounded-2xl hover:bg-white/10 transition-all btn-interact">
          Contact Sales
        </button>
      </div>
    </div>
  );
}
