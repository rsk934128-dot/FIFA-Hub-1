import React, { useState, useEffect, useRef } from "react";
import NewsFeed from "./components/NewsFeed";
import ScoutingTerminal from "./components/ScoutingTerminal";
import MatchSim from "./components/MatchSim";
import TournamentCenter from "./components/TournamentCenter";
import TriviaQuiz from "./components/TriviaQuiz";
import TacticalAdvisor from "./components/TacticalAdvisor";
import LiveTV from "./components/LiveTV";
import NexusView from "./components/NexusView";
import BKashGateway from "./components/BKashGateway";
import { StripeCheckout } from "./components/StripeCheckout";
import { AuthStatus } from "./components/AuthStatus";
import { MyDocs } from "./components/MyDocs";
import { PerformanceAnalytics } from "./components/PerformanceAnalytics";
import { ProjectRoadmap } from "./components/ProjectRoadmap";
import { SupportChat } from "./components/SupportChat";
import { LiveScoresMarquee } from "./components/LiveScoresMarquee";
import { QuickActions } from "./components/QuickActions";
import { SubscriptionStore } from "./components/SubscriptionStore";
import { WalletManager } from "./components/WalletManager";
import { GoogleMiniBrowser, RealLiveMatch } from "./components/GoogleMiniBrowser";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { ProgramLauncherModal, ProgramId, ALL_PROGRAMS } from "./components/ProgramLauncherModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { 
  Trophy, 
  Shield, 
  Newspaper, 
  Brain, 
  Activity, 
  Menu, 
  X, 
  Sparkles, 
  Sun, 
  Moon, 
  Zap, 
  MessageSquare, 
  Tv, 
  Volume2, 
  VolumeX, 
  Globe, 
  HardDrive, 
  TrendingUp, 
  DollarSign, 
  Crown, 
  ShoppingCart, 
  Wallet, 
  Search, 
  ChevronDown,
  Layers,
  Sliders
} from "lucide-react";
import { Atmosphere } from "./types";
import { useFirebase } from "./components/FirebaseProvider";

export default function App() {
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = useState<ProgramId>("sim");
  const [establishedMatch, setEstablishedMatch] = useState<RealLiveMatch | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [tacticsDropdownOpen, setTacticsDropdownOpen] = useState<boolean>(false);
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState<boolean>(false);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("night");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [syncMode, setSyncMode] = useState<'live' | 'offline'>('live');

  const tacticsMenuRef = useRef<HTMLDivElement>(null);
  const strategyMenuRef = useRef<HTMLDivElement>(null);

  // Global shortcut: Cmd/Ctrl + K opens Program Launcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsLauncherOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tacticsMenuRef.current && !tacticsMenuRef.current.contains(e.target as Node)) {
        setTacticsDropdownOpen(false);
      }
      if (strategyMenuRef.current && !strategyMenuRef.current.contains(e.target as Node)) {
        setStrategyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSyncMode = () => {
    setSyncMode(prev => prev === 'live' ? 'offline' : 'live');
  };

  const handleEstablishMatch = (match: RealLiveMatch) => {
    setEstablishedMatch(match);
    setActiveTab("sim");
  };

  const atmospheres = [
    { id: "night", label: "NIGHT", icon: <Moon className="w-3.5 h-3.5" />, bg: "bg-[#050811]", text: "text-zinc-100", glow: "bg-amber-500/[0.04]" },
    { id: "day", label: "DAY", icon: <Sun className="w-3.5 h-3.5" />, bg: "bg-sky-50", text: "text-slate-900", glow: "bg-sky-400/[0.1]" },
    { id: "lights", label: "LIGHTS", icon: <Zap className="w-3.5 h-3.5" />, bg: "bg-black", text: "text-zinc-100", glow: "bg-cyan-400/[0.08]" },
  ] as const;

  const currentAtmosphere = atmospheres.find(a => a.id === atmosphere) || atmospheres[0];

  // Core navigation items displayed directly in desktop top bar
  const coreNavItems = [
    { id: "sim" as const, label: "MATCH SIM", icon: <Activity className="w-4 h-4" /> },
    { id: "browser" as const, label: "GOOGLE BROWSER", icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { id: "live" as const, label: "LIVE TV", icon: <Tv className="w-4 h-4" /> },
    { id: "news" as const, label: "NEWS ROOM", icon: <Newspaper className="w-4 h-4" /> },
  ];

  // Tactics & AI group
  const tacticsItems = [
    { id: "scout" as const, label: "Scouting Deck", icon: <Shield className="w-4 h-4 text-cyan-400" />, desc: "AI-driven player radar & telemetry" },
    { id: "advisor" as const, label: "Tactical Advisor", icon: <MessageSquare className="w-4 h-4 text-purple-400" />, desc: "Gemini football assistant" },
    { id: "tournament" as const, label: "Tournament Center", icon: <Trophy className="w-4 h-4 text-yellow-400" />, desc: "World Cup bracket simulator" },
    { id: "quiz" as const, label: "Trivia Arena", icon: <Brain className="w-4 h-4 text-pink-400" />, desc: "Competitive football IQ quiz" },
  ];

  // Strategy & Economy group
  const strategyItems = [
    { id: "analytics" as const, label: "Analytics Deck", icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, desc: "Performance & xG telemetry" },
    { id: "roadmap" as const, label: "Project Roadmap", icon: <Layers className="w-4 h-4 text-indigo-400" />, desc: "Feature timeline & system status" },
    { id: "nexus" as const, label: "Nexus Hub", icon: <Globe className="w-4 h-4 text-teal-400" />, desc: "Global federation stadium grid" },
    { id: "archive" as const, label: "Tactical Archive", icon: <HardDrive className="w-4 h-4 text-blue-400" />, desc: "Saved dossiers & match history" },
    { id: "premium" as const, label: "Nexus Store", icon: <ShoppingCart className="w-4 h-4 text-amber-400" />, desc: "Pro season passes & VIP perks" },
    { id: "bkash" as const, label: "bKash Gateway", icon: <DollarSign className="w-4 h-4 text-pink-400" />, desc: "Instant mobile payment in BDT" },
    { id: "wallet" as const, label: "TON Wallet", icon: <Wallet className="w-4 h-4 text-cyan-400" />, desc: "Web3 match prediction balance" },
  ];

  const isTacticsActive = tacticsItems.some(i => i.id === activeTab);
  const isStrategyActive = strategyItems.some(i => i.id === activeTab);

  const renderActiveModule = () => {
    switch (activeTab) {
      case "sim": return <MatchSim soundEnabled={soundEnabled} initialMatch={establishedMatch} />;
      case "browser": return <GoogleMiniBrowser onEstablishMatch={handleEstablishMatch} />;
      case "live": return <LiveTV />;
      case "tournament": return <TournamentCenter />;
      case "scout": return <ScoutingTerminal syncMode={syncMode} />;
      case "advisor": return <TacticalAdvisor />;
      case "news": return <NewsFeed />;
      case "roadmap": return <ProjectRoadmap />;
      case "quiz": return <TriviaQuiz />;
      case "nexus": return <NexusView />;
      case "analytics": return <PerformanceAnalytics />;
      case "archive": return <MyDocs />;
      case "bkash": return <BKashGateway />;
      case "premium": return <SubscriptionStore />;
      case "wallet": return (
        <div className="max-w-2xl mx-auto py-12">
          {user ? (
            <WalletManager userId={user.uid} />
          ) : (
            <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <Wallet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Wallet Access Restricted</h2>
              <p className="text-slate-400 mb-6">Please login with Google to access your custodial TON wallet.</p>
              <AuthStatus />
            </div>
          )}
        </div>
      );
      default: return <MatchSim />;
    }
  };

  return (
    <div className={`min-h-screen ${currentAtmosphere.bg} ${currentAtmosphere.text} font-sans antialiased relative transition-colors duration-700`}>
      {/* Dynamic Ambient Stadium Lights */}
      <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] ${currentAtmosphere.glow} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`} />
      <div className={`absolute top-1/3 right-1/4 w-[600px] h-[600px] ${currentAtmosphere.glow} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`} />
      {atmosphere === "lights" && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.05)_0%,transparent_50%)] pointer-events-none" />
      )}

      {/* Primary Header Rail */}
      <header className={`sticky top-0 z-40 h-16 sm:h-20 ${atmosphere === 'day' ? 'bg-white/85' : 'bg-[#050811]/90'} backdrop-blur-xl border-b border-white/10 shadow-lg flex items-center transition-colors duration-500`}>
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("sim")}
              className="text-xl sm:text-2xl font-black tracking-tighter text-amber-500 italic hover:text-amber-400 transition-colors cursor-pointer"
            >
              FIFA HUB
            </button>
            <div className="hidden sm:block h-6 w-px bg-white/10" />
            <span className="hidden sm:block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              TACTICAL CENTER
            </span>
          </div>

          {/* Desktop Tab Navigation (Clean, Non-wrapping, Categorized) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            {coreNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === item.id
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5"
                    : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* Tactics & AI Dropdown */}
            <div className="relative" ref={tacticsMenuRef}>
              <button
                onClick={() => {
                  setTacticsDropdownOpen(!tacticsDropdownOpen);
                  setStrategyDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all cursor-pointer whitespace-nowrap ${
                  isTacticsActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI & TACTICS</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${tacticsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {tacticsDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up space-y-1">
                  <div className="px-3 py-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                    Tactical Intelligence
                  </div>
                  {tacticsItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setTacticsDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        activeTab === item.id
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="p-1 rounded-lg bg-white/5 mt-0.5">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight uppercase font-mono">{item.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight truncate">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Strategy & Economy Dropdown */}
            <div className="relative" ref={strategyMenuRef}>
              <button
                onClick={() => {
                  setStrategyDropdownOpen(!strategyDropdownOpen);
                  setTacticsDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all cursor-pointer whitespace-nowrap ${
                  isStrategyActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>MORE</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${strategyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {strategyDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-scale-up space-y-1 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">
                    Strategy & Web3 Economy
                  </div>
                  {strategyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setStrategyDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        activeTab === item.id
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="p-1 rounded-lg bg-white/5 mt-0.5">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight uppercase font-mono">{item.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight truncate">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Program Launcher Button */}
            <button
              onClick={() => setIsLauncherOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-bold tracking-wide uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap ml-1"
              title="Browse all 15 operational programs (Cmd+K)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PROGRAMS (15)</span>
              <kbd className="hidden xl:inline-block ml-1 px-1 py-0.2 rounded bg-black/40 text-[9px] text-amber-300 border border-amber-500/30 font-mono">
                ⌘K
              </kbd>
            </button>
          </nav>

          {/* User & Live Stream status panel */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Programs Button for Medium/Small Screens */}
            <button
              onClick={() => setIsLauncherOpen(true)}
              className="lg:hidden flex items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 transition-colors cursor-pointer"
              title="Search all programs"
            >
              <Search className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline">PROGRAMS</span>
            </button>

            {/* Atmosphere Switcher */}
            <div className={`flex items-center gap-1 p-1 rounded-full border ${atmosphere === 'day' ? 'bg-slate-200 border-slate-300' : 'bg-white/5 border-white/10'}`}>
              {atmospheres.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtmosphere(a.id)}
                  title={`Switch to ${a.label} atmosphere`}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    atmosphere === a.id
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {a.icon}
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Disable immersive soundscapes" : "Enable immersive soundscapes"}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled 
                  ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm shadow-amber-500/10" 
                  : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Live viewer count */}
            <div className={`hidden xl:flex items-center gap-2 ${atmosphere === 'day' ? 'bg-slate-200 border-slate-300' : 'bg-slate-900/50 border-white/5'} px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-tight`}>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span className={atmosphere === 'day' ? 'text-slate-600' : 'text-slate-300'}>2.4M LIVE</span>
            </div>

            <AuthStatus />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <LiveScoresMarquee />

      {/* Mobile Menu drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden sticky top-16 sm:top-20 z-30 bg-[#050811]/98 backdrop-blur-2xl border-b border-white/10 p-4 space-y-3 animate-slide-down shadow-2xl max-h-[80vh] overflow-y-auto">
          {/* Quick Launcher Banner */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLauncherOpen(true);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>OPEN FULL PROGRAM LAUNCHER</span>
            </div>
            <span className="bg-amber-500 text-black text-[9px] px-2 py-0.5 rounded-full font-black">
              15 APPS
            </span>
          </button>

          {/* Categorized Mobile Modules List */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black px-2 block">
              Match & Broadcast
            </span>
            {coreNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black px-2 block">
              AI, Tactics & Strategy
            </span>
            {[...tacticsItems, ...strategyItems].slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Atmosphere Switcher */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 px-2">Stadium Atmosphere</span>
            <div className="flex gap-2">
              {atmospheres.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtmosphere(a.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    atmosphere === a.id
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-white/5 text-slate-400 border-white/5"
                  }`}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Container Stage with responsive padding */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 relative z-10 min-h-[calc(100vh-12rem)]">
        
        {/* Active Module stage with layout animation container */}
        <div className="animate-fade-in duration-300">
          {renderActiveModule()}
        </div>

      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileBottomNav 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenLauncher={() => setIsLauncherOpen(true)}
      />

      {/* Universal Programs Launcher Modal (Full Catalog with Live Search) */}
      <ProgramLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        activeProgramId={activeTab}
        onSelectProgram={(id) => setActiveTab(id)}
      />

      {/* Universal footer */}
      <footer className="border-t border-white/10 bg-black/50 py-8 text-center text-[10px] font-mono text-slate-500 relative z-10 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          
          {/* Sync Status Toggle */}
          <div className="flex items-center gap-4 border border-white/5 bg-white/[0.02] px-4 py-2 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${syncMode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
              <span className="font-black uppercase tracking-widest text-[9px]">Status: {syncMode === 'live' ? 'Synchronized' : 'Offline Mode'}</span>
            </div>
            
            <div className="w-[1px] h-4 bg-white/10" />

            <button 
              onClick={toggleSyncMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 font-black uppercase tracking-tighter text-[9px] cursor-pointer border ${
                syncMode === 'live' 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
              }`}
            >
              {syncMode === 'live' ? <Activity className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              {syncMode === 'live' ? 'Switch to Offline' : 'Go Live'}
            </button>
          </div>

          <div className="space-y-1">
            <p>© {new Date().getFullYear()} FIFA Hub. Multi-Device Responsive Tactical Architecture.</p>
            <p className="flex items-center justify-center gap-1">
              Optimized for Desktop, Tablets & Mobile Handheld Displays.
            </p>
          </div>
        </div>
      </footer>
      <SupportChat />
      <QuickActions onNavigate={setActiveTab} />
      <PWAInstallPrompt />
    </div>
  );
}
