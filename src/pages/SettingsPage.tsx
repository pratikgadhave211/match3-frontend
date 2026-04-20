interface PreferencesState {
  darkMode: boolean;
  pushNotifications: boolean;
  profileVisibility: boolean;
  synergyAnalytics: boolean;
}

interface SettingsProps {
  preferences: PreferencesState;
  togglePreference: (key: keyof PreferencesState) => void;
  handleAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

function Toggle({
  checked,
  onClick
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-6 ${checked ? "bg-primary" : "bg-white/10"} rounded-full relative p-1 transition-all`}
      type="button"
    >
      <div
        className={`w-4 h-4 ${checked ? "bg-white right-1" : "bg-white/40 left-1"} rounded-full absolute shadow-md transition-all`}
      />
    </button>
  );
}

export default function Settings({ preferences, togglePreference, handleAction }: SettingsProps) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-3xl font-headline font-black text-white mb-2 tracking-tight">Settings</h2>
        <p className="text-on-surface-variant">Manage your profile, account preferences, and privacy.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-headline font-bold text-white mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">person</span>
              Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Full Name</label>
                <input type="text" defaultValue="David Miller" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Email Address</label>
                <input type="email" defaultValue="david@marketeam.ai" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Short Bio</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all h-32 resize-none" defaultValue="Passionate about decentralized systems and AI-driven networking." />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button onClick={(event) => handleAction(event, "Profile updated")} className="px-8 py-4 bg-primary text-on-primary font-headline font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all btn-interact">
                Save Changes
              </button>
            </div>
          </div>

          <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-headline font-bold text-white mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
              Connected Wallet
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">MetaMask Connected</p>
                  <p className="text-lg font-mono text-white tracking-tighter">0x71C...492b</p>
                </div>
              </div>
              <button onClick={(event) => handleAction(event, "Wallet disconnected")} className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <div className="glass-panel p-8 rounded-[2rem] border border-white/5">
            <h3 className="text-lg font-headline font-bold text-white mb-8">Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Dark Mode</p>
                  <p className="text-xs text-white/40">Switch to light theme</p>
                </div>
                <Toggle checked={preferences.darkMode} onClick={() => togglePreference("darkMode")} />
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Push Notifications</p>
                  <p className="text-xs text-white/40">New matches and messages</p>
                </div>
                <Toggle checked={preferences.pushNotifications} onClick={() => togglePreference("pushNotifications")} />
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border border-white/5">
            <h3 className="text-lg font-headline font-bold text-white mb-8">Privacy</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Profile Visibility</p>
                  <p className="text-xs text-white/40">Visible to active matchmakers</p>
                </div>
                <Toggle checked={preferences.profileVisibility} onClick={() => togglePreference("profileVisibility")} />
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Synergy Analytics</p>
                  <p className="text-xs text-white/40">Allow AI to use your data</p>
                </div>
                <Toggle checked={preferences.synergyAnalytics} onClick={() => togglePreference("synergyAnalytics")} />
              </div>
            </div>
          </div>

          <button onClick={(event) => handleAction(event, "Signed out")} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-bold text-white/60 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
