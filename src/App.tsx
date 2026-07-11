import React, { useState } from "react";
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
import { Trophy, Shield, Newspaper, Brain, Activity, Menu, X, Sparkles, Sun, Moon, Zap, MessageSquare, Tv, Volume2, VolumeX, Globe, HardDrive, TrendingUp, DollarSign, Crown, ShoppingCart, Wallet } from "lucide-react";
import { Atmosphere } from "./types";
import { useFirebase } from "./components/FirebaseProvider";

export default function App() {
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = useState<"sim" | "tournament" | "scout" | "advisor" | "news" | "quiz" | "live" | "nexus" | "analytics" | "archive" | "bkash" | "premium" | "wallet" | "roadmap">("sim");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("night");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [syncMode, setSyncMode] = useState<'live' | 'offline'>('live');

  const toggleSyncMode = () => {
    setSyncMode(prev => prev === 'live' ? 'offline' : 'live');
  };

  const atmospheres = [
    { id: "night", label: "NIGHT", icon: <Moon className="w-3.5 h-3.5" />, bg: "bg-[#050811]", text: "text-zinc-100", glow: "bg-amber-500/[0.04]" },
    { id: "day", label: "DAY", icon: <Sun className="w-3.5 h-3.5" />, bg: "bg-sky-50", text: "text-slate-900", glow: "bg-sky-400/[0.1]" },
    { id: "lights", label: "LIGHTS", icon: <Zap className="w-3.5 h-3.5" />, bg: "bg-black", text: "text-zinc-100", glow: "bg-cyan-400/[0.08]" },
  ] as const;

  const currentAtmosphere = atmospheres.find(a => a.id === atmosphere) || atmospheres[0];

  const navItems = [
    { id: "sim", label: "MATCH LIVE SIM", icon: <Activity className="w-4 h-4" /> },
    { id: "live", label: "LIVE TV", icon: <Tv className="w-4 h-4" /> },
    { id: "tournament", label: "TOURNAMENT BOX", icon: <Trophy className="w-4 h-4" /> },
    { id: "scout", label: "SCOUTING DECK", icon: <Shield className="w-4 h-4" /> },
    { id: "advisor", label: "TACTICAL ADVISOR", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "news", label: "NEWS ROOM", icon: <Newspaper className="w-4 h-4" /> },
    { id: "roadmap", label: "ROADMAP", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "nexus", label: "NEXUS", icon: <Globe className="w-4 h-4" /> },
    { id: "quiz", label: "TRIVIA ARENA", icon: <Brain className="w-4 h-4" /> },
    { id: "analytics", label: "ANALYTICS DECK", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "archive", label: "ARCHIVE", icon: <HardDrive className="w-4 h-4" /> },
    { id: "premium", label: "NEXUS STORE", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "bkash", label: "bKASH GATE", icon: <DollarSign className="w-4 h-4" /> },
    { id: "wallet", label: "TON WALLET", icon: <Wallet className="w-4 h-4" /> },
  ] as const;

  const renderActiveModule = () => {
    switch (activeTab) {
      case "sim": return <MatchSim soundEnabled={soundEnabled} />;
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
      <header className={`sticky top-0 z-40 h-20 ${atmosphere === 'day' ? 'bg-white/80' : 'bg-[#050811]/90'} backdrop-blur-md border-b border-white/10 shadow-lg flex items-center transition-colors duration-500`}>
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black tracking-tighter text-amber-500 italic">
              FIFA HUB
            </div>
            <div className="hidden sm:block h-6 w-px bg-white/10" />
            <span className="hidden sm:block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              TACTICAL INSIGHTS CENTER
            </span>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5"
                    : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* User & Live Stream status panel */}
          <div className="hidden lg:flex items-center gap-4">
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
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled 
                  ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm shadow-amber-500/10" 
                  : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className={`flex items-center gap-2 ${atmosphere === 'day' ? 'bg-slate-200 border-slate-300' : 'bg-slate-900/50 border-white/5'} px-4 py-2 rounded-full border text-[10px] font-mono font-bold tracking-tight`}>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span className={atmosphere === 'day' ? 'text-slate-600' : 'text-slate-300'}>2,408,122 WATCHING LIVE</span>
            </div>
            <AuthStatus />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <LiveScoresMarquee />

      {/* Mobile Menu drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden sticky top-20 z-30 bg-[#050811] border-b border-white/10 p-4 space-y-2 animate-slide-down shadow-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-zinc-400 border border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Mobile Atmosphere Switcher */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 px-3">Stadium Atmosphere</span>
            <div className="flex gap-2 px-1">
              {atmospheres.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtmosphere(a.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
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

      {/* Primary Container Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 min-h-[calc(100vh-12rem)]">
        
        {/* Active Module stage with layout animation container */}
        <div className="animate-fade-in duration-300">
          {renderActiveModule()}
        </div>

      </main>

      {/* Universal footer */}
      <footer className="border-t border-white/10 bg-black/50 py-8 text-center text-[10px] font-mono text-slate-500 relative z-10">
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
            <p>© {new Date().getFullYear()} FIFA Hub. Inspired by top live broadcasts.</p>
            <p className="flex items-center justify-center gap-1">
              Formulations structured securely by <strong className="text-slate-400">Gemini Intelligence</strong> systems.
            </p>
          </div>
        </div>
      </footer>
      <SupportChat />
      <QuickActions onNavigate={setActiveTab} />
    </div>
  );
}
