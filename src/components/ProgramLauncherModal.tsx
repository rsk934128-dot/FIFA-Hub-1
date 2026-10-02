import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Globe, 
  Tv, 
  Trophy, 
  Shield, 
  MessageSquare, 
  Newspaper, 
  Brain, 
  TrendingUp, 
  HardDrive, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Search, 
  X, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Layers,
  Radio,
  Cpu
} from "lucide-react";

export type ProgramId = 
  | "sim" 
  | "browser" 
  | "live" 
  | "tournament" 
  | "scout" 
  | "advisor" 
  | "news" 
  | "quiz" 
  | "nexus" 
  | "analytics" 
  | "archive" 
  | "bkash" 
  | "premium" 
  | "wallet" 
  | "roadmap";

export interface ProgramInfo {
  id: ProgramId;
  label: string;
  shortLabel: string;
  category: "match" | "tactics" | "strategy" | "finance";
  categoryLabel: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const ALL_PROGRAMS: ProgramInfo[] = [
  // 1. Match & Broadcast
  {
    id: "sim",
    label: "Match Live Simulator",
    shortLabel: "Match Sim",
    category: "match",
    categoryLabel: "Match & Broadcast",
    description: "Autonomous real-time match engine with tactical radar & commentary.",
    icon: <Activity className="w-5 h-5 text-amber-400" />,
    badge: "Core Node",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "browser",
    label: "Google Mini Browser",
    shortLabel: "Mini Browser",
    category: "match",
    categoryLabel: "Match & Broadcast",
    description: "Live search-grounded fixtures, DOM watcher & instant match establishment.",
    icon: <Globe className="w-5 h-5 text-emerald-400" />,
    badge: "Live Telemetry",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "live",
    label: "Live TV Broadcast",
    shortLabel: "Live TV",
    category: "match",
    categoryLabel: "Match & Broadcast",
    description: "Multi-channel ultra-low latency streams & real-time CDN telemetry.",
    icon: <Tv className="w-5 h-5 text-rose-400" />,
    badge: "60 FPS Stream",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  },
  {
    id: "tournament",
    label: "Tournament Center",
    shortLabel: "Tournaments",
    category: "match",
    categoryLabel: "Match & Broadcast",
    description: "World Cup 2026 bracket simulator, group stages & trophy coronation.",
    icon: <Trophy className="w-5 h-5 text-yellow-400" />,
    badge: "Coronation",
    badgeColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  },

  // 2. AI & Tactical Intelligence
  {
    id: "scout",
    label: "Scouting Deck",
    shortLabel: "Scouting",
    category: "tactics",
    categoryLabel: "AI & Tactics",
    description: "AI-driven player radar, attribute telemetry & transfer projections.",
    icon: <Shield className="w-5 h-5 text-cyan-400" />,
    badge: "AI Powered",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  },
  {
    id: "advisor",
    label: "Tactical Advisor",
    shortLabel: "Advisor",
    category: "tactics",
    categoryLabel: "AI & Tactics",
    description: "Interactive Gemini football tactician & formation optimizer.",
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
    badge: "Gemini Intel",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  },
  {
    id: "news",
    label: "Global News Room",
    shortLabel: "News Feed",
    category: "tactics",
    categoryLabel: "AI & Tactics",
    description: "Grounded sports news, Unsplash journalist profiles & transfer scoops.",
    icon: <Newspaper className="w-5 h-5 text-sky-400" />,
    badge: "Verified Feeds",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20"
  },
  {
    id: "quiz",
    label: "Trivia Arena",
    shortLabel: "Trivia Quiz",
    category: "tactics",
    categoryLabel: "AI & Tactics",
    description: "Competitive World Cup trivia, tactical puzzles & leaderboard rewards.",
    icon: <Brain className="w-5 h-5 text-pink-400" />,
    badge: "Skill Arena",
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  },

  // 3. Strategy & Analytics
  {
    id: "analytics",
    label: "Performance Analytics",
    shortLabel: "Analytics",
    category: "strategy",
    categoryLabel: "Strategy & Data",
    description: "Historical metrics, possession charts, xG curves & tactical telemetry.",
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    badge: "Data Telemetry",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "roadmap",
    label: "Project Roadmap",
    shortLabel: "Roadmap",
    category: "strategy",
    categoryLabel: "Strategy & Data",
    description: "FIFA Hub development trajectory, milestone tracking & system releases.",
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    badge: "System Vision",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: "nexus",
    label: "Nexus Global Hub",
    shortLabel: "Nexus Hub",
    category: "strategy",
    categoryLabel: "Strategy & Data",
    description: "Decentralized stadium nodes, global federation network & live pulses.",
    icon: <Globe className="w-5 h-5 text-teal-400" />,
    badge: "Global Grid",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
  },
  {
    id: "archive",
    label: "Tactical Archive",
    shortLabel: "Documents",
    category: "strategy",
    categoryLabel: "Strategy & Data",
    description: "Saved scouting dossiers, match telemetry logs & PDF exports.",
    icon: <HardDrive className="w-5 h-5 text-blue-400" />,
    badge: "Cloud Vault",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },

  // 4. Finance & Economy
  {
    id: "premium",
    label: "Nexus Store & Passes",
    shortLabel: "Store",
    category: "finance",
    categoryLabel: "Finance & Economy",
    description: "Pro VIP season passes, tactical unlocks & stadium privileges.",
    icon: <ShoppingCart className="w-5 h-5 text-amber-400" />,
    badge: "VIP Passes",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "bkash",
    label: "bKash Payment Gateway",
    shortLabel: "bKash",
    category: "finance",
    categoryLabel: "Finance & Economy",
    description: "Instant mobile payment settlement in BDT for South Asian supporters.",
    icon: <DollarSign className="w-5 h-5 text-pink-400" />,
    badge: "Instant BDT",
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  },
  {
    id: "wallet",
    label: "TON Custodial Wallet",
    shortLabel: "TON Wallet",
    category: "finance",
    categoryLabel: "Finance & Economy",
    description: "Web3 match-prediction rewards, token balances & tactical NFTs.",
    icon: <Wallet className="w-5 h-5 text-cyan-400" />,
    badge: "Web3 TON",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  }
];

interface ProgramLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProgramId: ProgramId;
  onSelectProgram: (id: ProgramId) => void;
}

export const ProgramLauncherModal: React.FC<ProgramLauncherModalProps> = ({
  isOpen,
  onClose,
  activeProgramId,
  onSelectProgram
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter programs based on query and category
  const filteredPrograms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_PROGRAMS.filter((prog) => {
      const matchesCategory = selectedCategory === "all" || prog.category === selectedCategory;
      const matchesQuery = 
        !query ||
        prog.label.toLowerCase().includes(query) ||
        prog.shortLabel.toLowerCase().includes(query) ||
        prog.description.toLowerCase().includes(query) ||
        prog.categoryLabel.toLowerCase().includes(query) ||
        (prog.badge && prog.badge.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark frosted backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Launcher Dialog */}
      <div className="relative w-full max-w-4xl bg-[#090d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scale-up">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tight">
                  FIFA HUB PROGRAMS
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  15 MODULES
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Select any operational module to switch instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
            aria-label="Close launcher"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Strip */}
        <div className="p-4 bg-white/[0.01] border-b border-white/5 space-y-3">
          {/* Search Omnibar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs (e.g. simulator, google browser, live tv, scout, wallet, quiz)..."
              className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
            {[
              { id: "all", label: "ALL PROGRAMS" },
              { id: "match", label: "MATCH & BROADCAST" },
              { id: "tactics", label: "AI & TACTICS" },
              { id: "strategy", label: "STRATEGY & DATA" },
              { id: "finance", label: "FINANCE & STORE" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-[10px] ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredPrograms.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No program found for "{searchQuery}"</p>
              <p className="text-xs text-slate-500 font-mono">
                Try searching for "match", "browser", "tv", "tactics", "quiz", or "wallet"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPrograms.map((prog) => {
                const isActive = activeProgramId === prog.id;
                return (
                  <button
                    key={prog.id}
                    onClick={() => {
                      onSelectProgram(prog.id);
                      onClose();
                    }}
                    className={`group p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] font-mono font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-full shadow-sm">
                          CURRENTLY OPEN
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {prog.icon}
                        </div>
                        <div className="min-w-0 pr-12">
                          <h4 className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight group-hover:text-amber-400 transition-colors truncate">
                            {prog.label}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                            {prog.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      {prog.badge ? (
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${prog.badgeColor}`}>
                          {prog.badge}
                        </span>
                      ) : (
                        <span />
                      )}

                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400 transition-colors flex items-center gap-1 font-bold">
                        LAUNCH <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational Mode: Optimized for Desktop & Mobile displays</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold border border-white/10">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
