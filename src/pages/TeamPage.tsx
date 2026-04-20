interface TeamProps {
  members: Array<{ name: string; role: string; score: string; avatar: string }>;
  showView: (view: "matches") => void;
  openProfileModal: (name: string, role: string, score: string) => void;
  handleAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

export default function Team({ members, showView, openProfileModal, handleAction }: TeamProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight">Your Team</h2>
            <p className="text-on-surface-variant mt-1">People in your network who have accepted your connection.</p>
          </div>
          <button onClick={() => showView("matches")} className="shrink-0 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all btn-interact text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span> Find More
          </button>
        </div>
      </section>

      {members.length === 0 ? (
        <div className="py-16 text-center glass-panel rounded-[2rem] border border-white/10">
          <h3 className="text-xl font-bold text-white mb-2">No team members yet</h3>
          <p className="text-on-surface-variant">Connect with people from your live matches to build your team.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {members.map((member) => (
          <div key={member.name} className="glass-panel rounded-[2rem] p-8 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-white/5">
            <div className="flex items-center gap-4">
              <img src={member.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={member.name} />
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-white text-lg truncate">{member.name}</p>
                <p className="text-xs text-primary font-bold uppercase tracking-widest truncate">{member.role}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-white">{member.score}</p>
                <p className="text-[10px] text-primary font-bold uppercase">Match</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button onClick={() => openProfileModal(member.name, member.role, member.score)} className="py-3 bg-primary text-on-primary font-bold rounded-xl text-xs btn-interact">
                View Profile
              </button>
              <button onClick={(event) => handleAction(event, "Message sent")} className="py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-xs btn-interact hover:bg-white/10 transition-all">
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
