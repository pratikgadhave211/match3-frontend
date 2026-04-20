import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MobileNav from "../components/layout/MobileNav";
import Sidebar from "../components/layout/Sidebar";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";
import { matchCurrentUser, refreshUsers } from "../services/api";
import type { Connection, Match, MatchSort, ProfileModalState, ViewId } from "../types";
import {
  SKILL_SUGGESTIONS
} from "../utils/constants";
import BlogPage from "./BlogPage";
import ConnectionsPage from "./ConnectionsPage";
import HomePage from "./HomePage";
import MatchPage from "./MatchPage";
import PricingPage from "./PricingPage";
import SavedPage from "./SavedPage";
import SettingsPage from "./SettingsPage";
import SolutionsPage from "./SolutionsPage";
import TeamPage from "./TeamPage";

type LocationState = { toast?: string };

type PreferencesState = {
  darkMode: boolean;
  pushNotifications: boolean;
  profileVisibility: boolean;
  synergyAnalytics: boolean;
};

type SavedMatch = {
  name: string;
  role: string;
  score: string;
  avatar: string;
  note: string;
};

function buildIntroText(name: string, role: string, score?: string): string {
  const scorePart = score ? ` (match score ${score})` : "";
  return (
    `Hey ${name} — I saw your work as ${role}${scorePart}. ` +
    "I’m building at this event and would love to connect for a quick chat." 
  );
}

export default function DashboardPage() {
  const location = useLocation();
  const lastToastKey = useRef<string | null>(null);

  const [activeView, setActiveView] = useState<ViewId>("home");

  const [toastMessage, setToastMessage] = useState("");
  const [modal, setModal] = useState<ProfileModalState>({ open: false, name: "", role: "" });
  const [introText, setIntroText] = useState("");

  const [synergyScore] = useState(92);

  const [sort, setSort] = useState<MatchSort>("high");
  const [filterOpen, setFilterOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [connectionQuery, setConnectionQuery] = useState("");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);

  const [preferences, setPreferences] = useState<PreferencesState>({
    darkMode: true,
    pushNotifications: true,
    profileVisibility: true,
    synergyAnalytics: true
  });

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (!state?.toast) return;

    if (lastToastKey.current === location.key) return;
    lastToastKey.current = location.key;
    setToastMessage(state.toast);
  }, [location.key, location.state]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapLiveMatches = async () => {
      try {
        const rawProfile = window.localStorage.getItem("currentUserProfile");
        if (!rawProfile) return;

        const parsedProfile = JSON.parse(rawProfile) as {
          wallet?: string;
          name?: string;
          interests?: string[];
          goals?: string[];
        };

        const wallet = parsedProfile.wallet?.trim();
        const name = parsedProfile.name?.trim();
        if (!wallet && !name) return;

        await refreshUsers();
        const response = await matchCurrentUser({
          wallet: wallet || undefined,
          name: name || undefined
        });
        if (isCancelled) return;

        setLiveMatches(
          (response.matches ?? []).map((match) => ({
            name: match.name,
            role: "RAG Match",
            category: "Developer",
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(match.name)}`,
            skills: [],
            goal: "Networking",
            matchScore: match.score ?? 0,
            aiReason: match.reason ?? "No explanation provided"
          }))
        );
      } catch {
        // Avoid blocking dashboard rendering if backend is temporarily unavailable.
      }
    };

    void bootstrapLiveMatches();

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleConnections = useMemo(() => {
    const query = connectionQuery.trim().toLowerCase();
    if (!query) return connections;
    return connections.filter((connection) => connection.name.toLowerCase().includes(query));
  }, [connections, connectionQuery]);

  const topMatches = useMemo(
    () =>
      [...liveMatches]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3)
        .map((match) => ({
          name: match.name,
          score: match.matchScore,
          avatar: match.avatar
        })),
    [liveMatches]
  );

  const totalConnections = connections.length;

  const handleAction = (event: React.MouseEvent<HTMLElement>, action: string) => {
    event.preventDefault();
    event.stopPropagation();
    setToastMessage(action);
  };

  const showView = (view: ViewId) => {
    setFilterOpen(false);
    setActiveView(view);
  };

  const openProfileModal = (name: string, role: string, score?: string) => {
    setModal({ open: true, name, role, score });
    setIntroText(buildIntroText(name, role, score));
  };

  const closeProfileModal = () => {
    setModal({ open: false, name: "", role: "" });
  };

  const regenerateIntro = () => {
    setIntroText(buildIntroText(modal.name, modal.role, modal.score));
  };

  const copyIntro = async () => {
    try {
      await navigator.clipboard.writeText(introText);
      setToastMessage("Intro copied");
    } catch {
      setToastMessage("Copy failed");
    }
  };

  const addSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev : [...prev, skill]));
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((item) => item !== skill));
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedGoals([]);
    setSelectedRoles([]);
    setSkillInput("");
  };

  const connectAndNotify = (match: Match) => {
    const existing = connections.some((connection) => connection.name === match.name);
    if (!existing) {
      const newConnection: Connection = {
        ...match,
        connectedDate: "today",
        notes: ""
      };
      setConnections((prev) => [newConnection, ...prev]);
    }

    setToastMessage("Connection request sent");
  };

  const saveMatch = (match: Match) => {
    setSavedMatches((prev) => {
      if (prev.some((savedMatch) => savedMatch.name === match.name)) {
        return prev;
      }

      return [
        {
          name: match.name,
          role: match.role,
          score: `${match.matchScore}%`,
          avatar: match.avatar,
          note: match.aiReason
        },
        ...prev
      ];
    });
  };

  const removeSavedMatch = (name: string) => {
    setSavedMatches((prev) => prev.filter((savedMatch) => savedMatch.name !== name));
    setToastMessage("Profile removed");
  };

  const removeConnection = (name: string) => {
    setConnections((prev) => prev.filter((connection) => connection.name !== name));
    setToastMessage("Connection removed");
  };

  const addOrEditNote = (name: string) => {
    setToastMessage(`Note updated for ${name}`);
  };

  const sendMessage = (name: string) => {
    setToastMessage(`Message sent to ${name}`);
  };

  const onSearchEnter = (query: string) => {
    setSkillInput(query);
    setActiveView("matches");
  };

  const togglePreference = (key: keyof PreferencesState) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const viewContent = () => {
    switch (activeView) {
      case "home":
        return (
          <HomePage
            synergyScore={synergyScore}
            topMatches={topMatches}
            showView={showView}
            onSearchEnter={onSearchEnter}
          />
        );
      case "matches":
        return (
          <MatchPage
            skillSuggestions={SKILL_SUGGESTIONS}
            selectedSkills={selectedSkills}
            selectedGoals={selectedGoals}
            selectedRoles={selectedRoles}
            sort={sort}
            filterOpen={filterOpen}
            skillInput={skillInput}
            setFilterOpen={setFilterOpen}
            setSort={setSort}
            setSkillInput={setSkillInput}
            addSkill={addSkill}
            removeSkill={removeSkill}
            toggleGoal={toggleGoal}
            toggleRole={toggleRole}
            clearFilters={clearFilters}
            openProfileModal={openProfileModal}
            connectAndNotify={connectAndNotify}
            saveMatch={saveMatch}
            onLiveMatchesChange={setLiveMatches}
            handleAction={handleAction}
          />
        );
      case "connections":
        return (
          <ConnectionsPage
            connections={visibleConnections}
            totalConnections={totalConnections}
            query={connectionQuery}
            setQuery={setConnectionQuery}
            removeConnection={removeConnection}
            openProfileModal={openProfileModal}
            addOrEditNote={addOrEditNote}
            sendMessage={sendMessage}
            showView={showView}
          />
        );
      case "saved":
        return (
          <SavedPage
            savedMatches={savedMatches}
            removeSavedMatch={removeSavedMatch}
            openProfileModal={openProfileModal}
            showView={showView}
          />
        );
      case "settings":
        return <SettingsPage preferences={preferences} togglePreference={togglePreference} handleAction={handleAction} />;
      case "team":
        return (
          <TeamPage
            members={connections.map((connection) => ({
              name: connection.name,
              role: connection.role,
              score: `${connection.matchScore}%`,
              avatar: connection.avatar
            }))}
            showView={showView}
            openProfileModal={openProfileModal}
            handleAction={handleAction}
          />
        );
      case "solutions":
        return <SolutionsPage showView={showView} />;
      case "blog":
        return <BlogPage handleAction={handleAction} />;
      case "pricing":
        return <PricingPage handleAction={handleAction} />;
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10 lg:px-12">
      <div className="gradient-orb gradient-orb--one" />
      <div className="gradient-orb gradient-orb--two" />

      <Sidebar activeView={activeView} showView={showView} />
      <MobileNav activeView={activeView} showView={showView} />

      <div className="relative mx-auto w-full max-w-7xl lg:pl-64 pb-24 md:pb-10">
        <section className="glass-panel rounded-3xl border border-white/10 p-6 md:p-10">
          {viewContent()}
        </section>
      </div>

      <Modal
        modal={modal}
        introText={introText}
        onClose={closeProfileModal}
        onRegenerate={regenerateIntro}
        onCopy={copyIntro}
        onAction={handleAction}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </main>
  );
}
