import type { Connection } from "../types";

interface ConnectionsProps {
  connections: Connection[];
  totalConnections: number;
  query: string;
  setQuery: (query: string) => void;
  removeConnection: (name: string) => void;
  openProfileModal: (name: string, role: string, score?: string) => void;
  addOrEditNote: (name: string) => void;
  sendMessage: (name: string) => void;
  showView: (view: "matches") => void;
}

export default function Connections({
  connections,
  totalConnections,
  query,
  setQuery,
  removeConnection,
  openProfileModal,
  addOrEditNote,
  sendMessage,
  showView
}: ConnectionsProps) {
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-3xl font-headline font-black text-white mb-1 tracking-tight">My Connections</h2>
          <p className="text-on-surface-variant text-sm">People you've connected with</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Total Connections</div>
            <div id="connection-count" className="text-2xl font-headline font-black text-primary">
              {totalConnections}
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">
              search
            </span>
            <input
              type="text"
              value={query}
              placeholder="Search by name..."
              onChange={(event) => setQuery(event.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-white/40 font-bold mb-6">
        {connections.length} connection{connections.length !== 1 ? "s" : ""}
      </p>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-white/30">people</span>
          </div>
          <h3 className="text-2xl font-headline font-bold text-white mb-2">No connections yet</h3>
          <p className="text-on-surface-variant text-center max-w-md mb-6">
            Start connecting with people from Matches to build your network!
          </p>
          <button
            onClick={() => showView("matches")}
            className="px-8 py-3 bg-primary text-on-primary font-headline font-bold rounded-xl hover:scale-105 transition-all btn-interact"
          >
            Browse Matches
          </button>
        </div>
      ) : null}

      <div id="connections-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[200px]">
        {connections.map((connection) => (
          <div
            key={connection.name}
            className="connection-card glass-panel rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col p-6 border border-white/5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/5">
                  <img src={connection.avatar} alt={connection.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-headline font-bold text-white">{connection.name}</h3>
                  <p className="text-xs text-white/60 font-semibold">{connection.role}</p>
                </div>
              </div>
              <button
                onClick={() => removeConnection(connection.name)}
                className="text-white/40 hover:text-red-400 transition-colors"
                title="Remove connection"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {connection.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 rounded-lg bg-white/5 text-white/70 text-[9px] font-bold uppercase border border-white/10"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mb-4 pb-4 border-b border-white/5">
              <p className="text-xs text-white/50">Connected {connection.connectedDate}</p>
            </div>

            {connection.notes ? (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-white/70">
                  <span className="text-primary font-bold">Note:</span> {connection.notes}
                </p>
              </div>
            ) : null}

            <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
              <button
                onClick={() => openProfileModal(connection.name, connection.role)}
                className="py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all btn-interact flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">person</span> Profile
              </button>
              <button
                onClick={() => addOrEditNote(connection.name)}
                className="py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all btn-interact flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">note</span> Note
              </button>
              <button
                onClick={() => sendMessage(connection.name)}
                className="py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all btn-interact flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">mail</span> Msg
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
