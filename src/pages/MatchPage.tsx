import { useEffect, useMemo, useState } from "react";
import Toast from "../components/ui/Toast";
import { generateIntro, matchCurrentUser, type UserResponse } from "../services/api";
import { getCurrentAccount } from "../services/wallet";
import type { Match, MatchSort } from "../types";

interface MatchesProps {
  skillSuggestions: string[];
  selectedSkills: string[];
  selectedGoals: string[];
  selectedRoles: string[];
  sort: MatchSort;
  filterOpen: boolean;
  skillInput: string;
  setFilterOpen: (open: boolean) => void;
  setSort: (sort: MatchSort) => void;
  setSkillInput: (value: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  toggleGoal: (goal: string) => void;
  toggleRole: (role: string) => void;
  clearFilters: () => void;
  openProfileModal: (name: string, role: string, score: string) => void;
  connectAndNotify: (match: Match) => void;
  saveMatch: (match: Match) => void;
  onLiveMatchesChange: (matches: Match[]) => void;
  handleAction: (event: React.MouseEvent<HTMLElement>, action: string) => void;
}

interface ApiMatch {
  name: string;
  score?: number;
  reason?: string;
}

function resolveRawError(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }

  if (typeof raw === "object" && raw !== null) {
    const record = raw as Record<string, unknown>;

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail.trim();
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
  }

  return "";
}

function toUiMatch(match: ApiMatch): Match {
  return {
    name: match.name,
    role: "RAG Match",
    category: "Developer",
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(match.name)}`,
    skills: [],
    goal: "Networking",
    matchScore: match.score ?? 0,
    aiReason: match.reason ?? "No explanation provided"
  };
}

export default function Matches({
  skillSuggestions,
  selectedSkills,
  selectedGoals,
  selectedRoles,
  sort,
  filterOpen,
  skillInput,
  setFilterOpen,
  setSort,
  setSkillInput,
  addSkill,
  removeSkill,
  toggleGoal,
  toggleRole,
  clearFilters,
  openProfileModal,
  connectAndNotify,
  saveMatch,
  onLiveMatchesChange,
  handleAction
}: MatchesProps) {
  const [apiMatches, setApiMatches] = useState<ApiMatch[]>([]);
  const [introResult, setIntroResult] = useState<Record<string, string>>({});
  const [isMatching, setIsMatching] = useState(false);
  const [isGeneratingIntroFor, setIsGeneratingIntroFor] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  const liveMatches = useMemo(
    () => apiMatches.map((match) => toUiMatch(match)),
    [apiMatches]
  );

  const topMatch = useMemo(
    () =>
      liveMatches.reduce<Match | null>(
        (best, current) => (!best || current.matchScore > best.matchScore ? current : best),
        null
      ),
    [liveMatches]
  );

  useEffect(() => {
    let isCancelled = false;

    const hydrateCurrentUser = async () => {
      let walletFromProvider = "";
      let cachedName = "";
      let cachedWallet = "";
      let cachedInterests: string[] = [];
      let cachedGoals: string[] = [];

      try {
        walletFromProvider = (await getCurrentAccount()) ?? "";
      } catch {
        // Non-blocking: wallet might not be connected yet.
      }

      try {
        const raw = window.localStorage.getItem("currentUserProfile");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            wallet?: string;
            name?: string;
            interests?: string[];
            goals?: string[];
          };

          cachedName = String(parsed.name || "");
          cachedWallet = String(parsed.wallet || "");
          cachedInterests = Array.isArray(parsed.interests) ? parsed.interests : [];
          cachedGoals = Array.isArray(parsed.goals) ? parsed.goals : [];
        }
      } catch {
        // Ignore malformed local profile cache.
      }

      if (isCancelled) {
        return;
      }

      if (cachedName) {
        setCurrentUser({
          wallet: walletFromProvider || cachedWallet,
          name: cachedName,
          interests: cachedInterests,
          goals: cachedGoals
        });
      }
    };

    void hydrateCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  const activeCount = selectedSkills.length + selectedGoals.length + selectedRoles.length;
  const suggestedSkills = skillSuggestions.filter(
    (skill) =>
      skill.toLowerCase().includes(skillInput.trim().toLowerCase()) &&
      !selectedSkills.includes(skill)
  );

  const handleMatch = async () => {
    setApiError("");
    setIsMatching(true);

    try {
      let walletFromSession = "";
      let nameFromSession = "";

      try {
        walletFromSession = (await getCurrentAccount()) ?? "";
      } catch {
        // Keep matching fallback logic working even if wallet is unavailable.
      }

      try {
        const rawProfile = window.localStorage.getItem("currentUserProfile");
        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile) as { wallet?: string; name?: string };
          walletFromSession = walletFromSession || String(parsedProfile.wallet || "");
          nameFromSession = String(parsedProfile.name || "");
        }
      } catch {
        // Ignore malformed local cache and continue.
      }

      if (!walletFromSession && !nameFromSession) {
        throw new Error("Current user is not resolved. Connect wallet or register once, then run match.");
      }

      const response = await matchCurrentUser({
        wallet: walletFromSession || undefined,
        name: nameFromSession || undefined
      });

      const resolvedMatches = [...(response.matches ?? [])].sort((left, right) => (right.score ?? -1) - (left.score ?? -1));
      if (resolvedMatches.length === 0) {
        const rawError = resolveRawError(response.raw);
        throw new Error(rawError || "RAG returned 0 matches. Backend did not return usable results.");
      }

      if (response.current_user) {
        const resolvedUser = response.current_user;
        setCurrentUser(resolvedUser);

        window.localStorage.setItem(
          "currentUserProfile",
          JSON.stringify({
            wallet: resolvedUser.wallet ?? "",
            name: resolvedUser.name,
            interests: resolvedUser.interests,
            goals: resolvedUser.goals
          })
        );
      }

      setApiMatches(resolvedMatches);
      onLiveMatchesChange(resolvedMatches.map((match) => toUiMatch(match)));
      setToastMessage("Current user matching completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run matching.";
      setApiError(message);
      setToastMessage(message);
      setApiMatches([]);
      onLiveMatchesChange([]);
    } finally {
      setIsMatching(false);
    }
  };

  const handleGenerateIntro = async (match: ApiMatch) => {
    setApiError("");
    setIsGeneratingIntroFor(match.name);

    try {
      if (!currentUser?.name) {
        throw new Error("Run Match first to resolve current user profile.");
      }

      const response = await generateIntro({
        userA: {
          name: currentUser.name,
          interests: currentUser.interests,
          goals: currentUser.goals
        },
        userB: {
          name: match.name,
          interests: [],
          goals: []
        }
      });

      setIntroResult((prev) => ({ ...prev, [match.name]: response.message }));
      setToastMessage("Intro generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate intro.";
      setApiError(message);
      setToastMessage(message);
    } finally {
      setIsGeneratingIntroFor(null);
    }
  };

  return (
    <div className="space-y-12">
      <section>
        <div className="glass-panel p-1 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(176,127,241,0.3)] bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 relative group">
          <div className="relative p-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="relative">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
                <img
                  src={topMatch?.avatar ?? "https://i.pravatar.cc/300?u=match-placeholder"}
                  alt={topMatch?.name ?? "Top Match"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wider flex items-center gap-2">
                  <span className="text-lg">🔥</span> BEST MATCH TODAY
                </span>
                <span className="bg-white/10 text-white/80 px-4 py-1.5 rounded-full text-sm font-bold border border-white/10">
                  {topMatch ? `${topMatch.matchScore}% SYNERGY` : "No RAG match yet"}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-black text-white mb-4 tracking-tighter">
                {topMatch?.name ?? "Run matching to see your top result"}
              </h2>
              <p className="text-xl text-primary font-bold mb-4">{topMatch?.role ?? "RAG-powered ranking"}</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button
                  onClick={() => {
                    if (!topMatch) return;
                    handleGenerateIntro({
                      name: topMatch.name,
                      score: topMatch.matchScore,
                      reason: topMatch.aiReason
                    });
                  }}
                  disabled={!topMatch}
                  className="px-10 py-4 bg-primary text-on-primary font-headline font-black rounded-full shadow-xl shadow-primary/30 hover:scale-105 transition-all btn-interact"
                >
                  Generate Intro
                </button>
                <button
                  onClick={() => {
                    if (!topMatch) return;
                    openProfileModal(topMatch.name, topMatch.role, `${topMatch.matchScore}%`);
                  }}
                  disabled={!topMatch}
                  className="px-8 py-4 bg-surface/50 text-white border border-white/10 backdrop-blur-md rounded-full font-headline font-bold hover:bg-white/10 transition-all btn-interact"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="matches-filter-section" className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <div>
            <h2 className="text-3xl font-headline font-black text-white mb-1 tracking-tight">Your Matches</h2>
            <p className="text-on-surface-variant text-sm">AI-curated based on your interests and activity</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary border border-primary/25 rounded-full text-xs font-bold"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>×</button>
                </span>
              ))}
              {selectedGoals.map((goal) => (
                <span
                  key={goal}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary border border-primary/25 rounded-full text-xs font-bold"
                >
                  Goal: {goal}
                  <button type="button" onClick={() => toggleGoal(goal)}>×</button>
                </span>
              ))}
              {selectedRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary border border-primary/25 rounded-full text-xs font-bold"
                >
                  Role: {role}
                  <button type="button" onClick={() => toggleRole(role)}>×</button>
                </span>
              ))}
            </div>

            <div className="relative">
              <button
                id="filter-panel-toggle"
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all relative"
              >
                <span className="material-symbols-outlined text-xl">tune</span>
                {activeCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full text-[9px] text-white font-black flex items-center justify-center leading-none">
                    {activeCount}
                  </span>
                ) : null}
              </button>

              {filterOpen ? (
                <div
                  id="filter-dropdown"
                  className="absolute right-0 top-14 w-80 bg-[#0f0d1e] border border-white/10 rounded-[1.5rem] shadow-2xl shadow-black/50 z-50 overflow-hidden filter-panel-animate filter-panel-visible"
                >
                  <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Sort By</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer">
                          <input
                            type="radio"
                            name="match-sort"
                            checked={sort === "high"}
                            onChange={() => setSort("high")}
                            className="accent-[#b07ff1] w-4 h-4"
                          />
                          <span className="text-sm text-white font-medium">Match Score: High to Low</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer">
                          <input
                            type="radio"
                            name="match-sort"
                            checked={sort === "low"}
                            onChange={() => setSort("low")}
                            className="accent-[#b07ff1] w-4 h-4"
                          />
                          <span className="text-sm text-white font-medium">Match Score: Low to High</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-white/5" />

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Skills</p>
                      <div className="flex flex-wrap gap-2 mb-3 min-h-[8px]">
                        {selectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold"
                          >
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          value={skillInput}
                          onChange={(event) => setSkillInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && skillInput.trim()) {
                              addSkill(skillInput.trim());
                              setSkillInput("");
                            }
                            if (event.key === "Escape") setSkillInput("");
                          }}
                          type="text"
                          placeholder="Add skills…"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        {skillInput.trim() && suggestedSkills.length > 0 ? (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1730] border border-white/10 rounded-xl overflow-hidden z-10 shadow-xl">
                            {suggestedSkills.map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => {
                                  addSkill(skill);
                                  setSkillInput("");
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-primary/20 hover:text-primary transition-all font-medium"
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="border-t border-white/5" />

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Goals</p>
                      {(["Startup", "Networking"] as const).map((goal) => (
                        <label key={goal} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={goal}
                            checked={selectedGoals.includes(goal)}
                            onChange={() => toggleGoal(goal)}
                            className="accent-[#b07ff1] w-4 h-4 rounded"
                          />
                          <span className="text-sm text-white font-medium">{goal}</span>
                        </label>
                      ))}
                    </div>

                    <div className="border-t border-white/5" />

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Role / Category</p>
                      {(["Developer", "Founder", "Designer"] as const).map((role) => (
                        <label key={role} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            value={role}
                            checked={selectedRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                            className="accent-[#b07ff1] w-4 h-4 rounded"
                          />
                          <span className="text-sm text-white font-medium">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-white/40 font-bold hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">filter_alt_off</span>
                      Clear All
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="px-5 py-2.5 bg-primary text-on-primary text-sm font-black rounded-xl btn-interact hover:scale-105 transition-all"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

        </div>

        <div className="glass-panel rounded-2xl p-5 mb-6 border border-white/10">
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleMatch}
              disabled={isMatching}
              className="px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-black btn-interact disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isMatching ? "Matching..." : "Run Match"}
            </button>

            {apiError ? (
              <div className="w-full rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 whitespace-pre-wrap">
                RAG Error: {apiError}
              </div>
            ) : null}
          </div>
        </div>

        {apiMatches.length > 0 ? (
          <div className="glass-panel rounded-2xl p-5 mb-6 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white">RAG Matches</h3>

            {apiMatches.map((match) => (
              <div key={`api-${match.name}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-white font-semibold">{match.name}</p>
                <p className="text-white/75 text-sm mt-1">Score: {match.score ?? "-"}</p>
                <p className="text-white/75 text-sm mt-1">Reason: {match.reason ?? "-"}</p>

                <button
                  type="button"
                  onClick={() => handleGenerateIntro(match)}
                  disabled={isGeneratingIntroFor === match.name}
                  className="mt-3 px-4 py-2 rounded-lg border border-primary/30 bg-primary/15 text-primary text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingIntroFor === match.name ? "Generating intro..." : "Generate Intro"}
                </button>

                {introResult[match.name] ? (
                  <p className="mt-3 text-xs text-white/80">{introResult[match.name]}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <p className="text-sm text-white/40 font-bold mb-6">
          {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} found
        </p>

        <div id="matches-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[200px]">
          {liveMatches.map((match) => (
            <div
              key={match.name}
              className="match-card glass-panel rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/5">
                      <img src={match.avatar} alt={match.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-bold text-white">{match.name}</h3>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{match.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{match.matchScore}%</div>
                    <div className="text-[10px] font-bold text-primary uppercase">Match</div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl mb-8 border border-white/5">
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    <span className="font-bold text-primary">AI Reason:</span> {match.aiReason}
                  </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button
                    onClick={() => connectAndNotify(match)}
                    className="py-3 bg-primary text-on-primary font-bold rounded-xl text-xs btn-interact"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => openProfileModal(match.name, match.role, `${match.matchScore}%`)}
                    className="py-3 bg-white/5 text-white border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all btn-interact"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={(event) => {
                      saveMatch(match);
                      handleAction(event, "Profile saved");
                    }}
                    className="col-span-2 py-3 bg-transparent text-white/60 border border-white/5 rounded-xl text-xs font-bold hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark</span>
                    Save for Later
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {liveMatches.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-6">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
            <p className="text-on-surface-variant max-w-xs mb-8">
              Try adjusting or clearing your filters to see more results.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-sm btn-interact"
            >
              Clear All Filters
            </button>
          </div>
        ) : null}
      </section>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
}
