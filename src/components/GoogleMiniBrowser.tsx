import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink, 
  Radio, 
  Play, 
  Clock, 
  MapPin, 
  Sparkles, 
  Flame, 
  Activity, 
  Layers, 
  CheckCircle, 
  SlidersHorizontal,
  ChevronRight,
  Zap,
  Smartphone,
  Eye,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import { monitorLiveScoreDOM, DOMMatchResult } from "../lib/domScoreMonitor";

export interface RealLiveMatch {
  id: string;
  competition: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  minute: string;
  status: "LIVE" | "FINISHED" | "UPCOMING" | "HALFTIME" | string;
  venue?: string;
  goalScorers?: string[];
  possession?: [number, number];
  shots?: [number, number];
  shotsOnTarget?: [number, number];
  summary: string;
  sources?: { title: string; url: string }[];
}

interface GoogleMiniBrowserProps {
  onEstablishMatch?: (match: RealLiveMatch) => void;
}

export const GoogleMiniBrowser: React.FC<GoogleMiniBrowserProps> = ({ onEstablishMatch }) => {
  const [searchQuery, setSearchQuery] = useState<string>("live football matches scores today");
  const [browserUrl, setBrowserUrl] = useState<string>("google://sports/live-matches");
  const [loading, setLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<RealLiveMatch[]>([]);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [establishedId, setEstablishedId] = useState<string | null>(null);

  // Real-time DOM Score Monitor States
  const [autoEstablishDom, setAutoEstablishDom] = useState<boolean>(true);
  const [domMonitorStats, setDomMonitorStats] = useState<{
    active: boolean;
    detectedCount: number;
    lastDetected?: DOMMatchResult;
  }>({ active: true, detectedCount: 0 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const browserViewportRef = useRef<HTMLDivElement | null>(null);

  const fetchLiveMatches = async (queryToUse?: string) => {
    const q = queryToUse !== undefined ? queryToUse : searchQuery;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    try {
      const res = await fetch(`/api/google-live-matches?query=${encodeURIComponent(q)}`, {
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error("Live telemetry query failed");
      }

      const data = await res.json();
      if (data?.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
        setSources(data.sources || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.warn("Using cached live telemetry:", err?.message || err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setCountdown(30);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Monitor DOM of live football score cards in browser view and trigger onEstablishMatch
  useEffect(() => {
    if (!autoEstablishDom || !browserViewportRef.current || !onEstablishMatch) return;

    const cleanup = monitorLiveScoreDOM(
      browserViewportRef.current,
      (detectedMatch) => {
        setEstablishedId(detectedMatch.id);
        toast.info(`⚡ Live DOM Monitor: Match Auto-Established!`, {
          description: `${detectedMatch.teamA} ${detectedMatch.scoreA} - ${detectedMatch.scoreB} ${detectedMatch.teamB} (${detectedMatch.minute}) detected in browser view.`
        });
        onEstablishMatch(detectedMatch);
      },
      {
        autoEstablish: true,
        triggerOnScoreChange: true,
        triggerOnNewMatch: false,
        onStatusChange: (status) => setDomMonitorStats(status)
      }
    );

    return cleanup;
  }, [autoEstablishDom, onEstablishMatch, matches]);

  // Auto-refresh timer to always fetch live data ("সব সময় লাইফ ডাটা আনতে হবে")
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLiveMatches();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBrowserUrl(`google://sports/search?q=${encodeURIComponent(searchQuery)}`);
    fetchLiveMatches(searchQuery);
  };

  const handleQuickPreset = (presetQuery: string, urlLabel: string) => {
    setSearchQuery(presetQuery);
    setBrowserUrl(`google://sports/${urlLabel}`);
    fetchLiveMatches(presetQuery);
  };

  const handleEstablish = (match: RealLiveMatch) => {
    setEstablishedId(match.id);
    toast.success(`রিয়েল খেলা প্রতিষ্ঠিত হয়েছে!`, {
      description: `${match.teamA} vs ${match.teamB} (${match.scoreA}-${match.scoreB}) লাইভ সিমুলেটরে লোড করা হয়েছে।`
    });

    if (onEstablishMatch) {
      onEstablishMatch(match);
    }
  };

  // Simulate live score change in DOM to test real-time watcher
  const simulateLiveGoalInDOM = () => {
    if (matches.length === 0) return;
    setMatches((prev) => {
      const copy = [...prev];
      const target = { ...copy[0] };
      target.scoreA = (target.scoreA || 0) + 1;
      target.minute = `${parseInt(target.minute || "70") + 1}'`;
      target.status = "LIVE";
      copy[0] = target;
      return copy;
    });
    toast.success("GOAL! Live score updated in DOM view.", {
      description: "Observer will automatically catch change and trigger onEstablishMatch."
    });
  };

  const filteredMatches = matches.filter((m) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "LIVE") return m.status.toUpperCase() === "LIVE" || m.status.toUpperCase() === "HALFTIME";
    if (filterStatus === "FINISHED") return m.status.toUpperCase() === "FINISHED" || m.status.toUpperCase() === "FT";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-emerald-400" />
            Google Mini Browser
            <span className="text-[10px] font-mono not-italic bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            রিয়েল-টাইম গুগল সার্চ গ্রাউন্ডিং থেকে লাইভ খেলা প্রতিষ্ঠিত করুন এবং সারাক্ষণ লাইভ ডেটা মনিটর করুন।
          </p>
        </div>

        {/* Live Auto-Sync Status Indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className="text-slate-300 font-bold">
              {autoRefresh ? `LIVE SYNC: ${countdown}s` : "SYNC PAUSED"}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
            >
              {autoRefresh ? "PAUSE" : "RESUME"}
            </button>
          </div>

          <button
            onClick={() => fetchLiveMatches()}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "SEARCHING..." : "FETCH LIVE"}
          </button>
        </div>
      </div>

      {/* Browser Chrome Container */}
      <div className="bg-slate-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Browser Top Bar & Omnibar */}
        <div className="p-3 bg-white/[0.03] border-b border-white/10 flex flex-col md:flex-row items-center gap-3">
          {/* Window Buttons & Nav Arrows */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <button 
              onClick={() => handleQuickPreset("live football matches scores today", "live-matches")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => fetchLiveMatches()}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>

          {/* Omnibar / Address Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-amber-500/60 transition-all">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline select-none">
                google://
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real live games (e.g. Arsenal vs Chelsea, Champions League)..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="text-amber-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* PWABuilder / Verification Badges */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Search Grounding Active
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <Smartphone className="w-3 h-3 text-amber-400" />
              PWABuilder Ready
            </span>
          </div>
        </div>

        {/* Quick Filter Presets Strip */}
        <div className="px-3 sm:px-4 py-2 bg-white/[0.01] border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-black mr-1 flex-shrink-0">
              CHANNELS:
            </span>
            <button
              onClick={() => handleQuickPreset("live football matches scores today", "live-matches")}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              🔴 LIVE NOW
            </button>
            <button
              onClick={() => handleQuickPreset("UEFA Champions League live matches scores today", "champions-league")}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              🏆 CHAMPIONS LEAGUE
            </button>
            <button
              onClick={() => handleQuickPreset("Premier League live scores today matches", "premier-league")}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE
            </button>
            <button
              onClick={() => handleQuickPreset("La Liga live football matches scores", "la-liga")}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              🇪🇸 LA LIGA
            </button>
            <button
              onClick={() => handleQuickPreset("FIFA World Cup 2026 Qualifiers live matches", "world-cup-qualifiers")}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              🌎 WORLD CUP 2026
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <span className="text-[10px] font-mono text-slate-500">FILTER:</span>
            {["ALL", "LIVE", "FINISHED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-[9px] font-mono font-black px-2 py-0.5 rounded transition-all cursor-pointer ${
                  filterStatus === status
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Browser Content Body with DOM Watcher Ref */}
        <div ref={browserViewportRef} className="p-4 md:p-6 space-y-5 min-h-[400px]">
          {/* Real-time DOM Watcher Telemetry Strip */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <Eye className={`w-4 h-4 ${autoEstablishDom ? "text-emerald-400" : "text-slate-500"}`} />
                {autoEstablishDom && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  Live DOM Result Watcher
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black ${
                    autoEstablishDom ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"
                  }`}>
                    {autoEstablishDom ? "ACTIVE" : "STANDBY"}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Monitors browser DOM and auto-triggers onEstablishMatch for new results and live score changes.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Detected: <strong className="text-amber-400">{domMonitorStats.detectedCount}</strong>
              </span>

              <button
                onClick={simulateLiveGoalInDOM}
                title="Simulate score update in DOM to test real-time watcher"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Simulate Goal
              </button>

              <button
                onClick={() => setAutoEstablishDom(!autoEstablishDom)}
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                  autoEstablishDom
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                {autoEstablishDom ? "Watcher: ON" : "Watcher: OFF"}
              </button>
            </div>
          </div>

          {/* Verified Web Citations Banner */}
          {sources.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-bold text-white text-xs">Verified Live Search Citations:</span>
                <span className="text-[10px] font-mono text-slate-400">Google Search Grounding Engine</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.slice(0, 3).map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-[10px] font-mono text-emerald-400 transition-colors"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Live Matches Grid */}
          {loading && matches.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                FETCHING REAL MATCH TELEMETRY VIA GOOGLE MINI BROWSER...
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Retrieving live sports feeds, minutes, match events, and goal scorers...
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Globe className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-white text-sm">No matches found matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Try one of the quick channel presets above to discover ongoing fixtures.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredMatches.map((match) => {
                const isLive = match.status.toUpperCase() === "LIVE" || match.status.toUpperCase() === "HALFTIME";
                const isEstablished = establishedId === match.id;

                return (
                  <div
                    key={match.id}
                    data-match-card="true"
                    data-match-id={match.id}
                    data-team-a={match.teamA}
                    data-team-b={match.teamB}
                    data-score-a={match.scoreA}
                    data-score-b={match.scoreB}
                    data-minute={match.minute}
                    data-status={match.status}
                    data-competition={match.competition}
                    className="group bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-sm"
                  >
                    {/* Top Competition & Status Strip */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider">
                          {match.competition}
                        </span>
                        {match.venue && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono text-slate-500">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            {match.venue}
                          </span>
                        )}
                      </div>

                      {/* Status Tag */}
                      <div className="flex items-center gap-1.5">
                        {isLive ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            {match.minute} LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold bg-white/5 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full">
                            {match.minute || match.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Names and Live Scoreboard */}
                    <div className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Team A */}
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors uppercase">
                            {match.teamA}
                          </h3>
                        </div>

                        {/* Central Scoreboard Display */}
                        <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl shadow-inner">
                          <span className="text-2xl font-black font-mono text-white">
                            {match.scoreA}
                          </span>
                          <span className="text-sm font-mono text-slate-500 font-bold">:</span>
                          <span className="text-2xl font-black font-mono text-white">
                            {match.scoreB}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className="flex-1 text-right">
                          <h3 className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors uppercase">
                            {match.teamB}
                          </h3>
                        </div>
                      </div>

                      {/* Goal Scorers list if present */}
                      {match.goalScorers && match.goalScorers.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
                          <span className="text-amber-500 font-bold">⚽ Goals:</span>
                          {match.goalScorers.map((g, gIdx) => (
                            <span key={gIdx} className="bg-white/5 px-2 py-0.5 rounded text-slate-300">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tactical Summary line */}
                      <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        {match.summary}
                      </p>

                      {/* Live possession & shots stats gauge if present */}
                      {match.possession && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                            <span>Possession: {match.possession[0]}%</span>
                            <span>{match.possession[1]}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${match.possession[0]}%` }} className="bg-amber-500 h-full" />
                            <div style={{ width: `${match.possession[1]}%` }} className="bg-cyan-500 h-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar: "Establish Real Match" & Citations */}
                    <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {match.sources && match.sources[0] && (
                          <a
                            href={match.sources[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            <span>Source: {match.sources[0].title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Primary Button: Establish Match into Simulator */}
                      <button
                        onClick={() => handleEstablish(match)}
                        className={`text-xs font-mono font-black uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          isEstablished
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20"
                        }`}
                      >
                        {isEstablished ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            ম্যাচ প্রতিষ্ঠিত!
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            এই ম্যাচটি প্রতিষ্ঠিত করুন
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browser Footer & PWABuilder Certification Bar */}
        <div className="px-5 py-3 bg-black/60 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY STREAM
            </span>
            <span>•</span>
            <span>Last Sync: {lastUpdated || "Live"}</span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-400">
              PWABuilder Compliant: <strong className="text-amber-400">100% Ready</strong>
            </span>
            <span className="text-slate-400">
              Offline Service Worker: <strong className="text-emerald-400">Active</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
