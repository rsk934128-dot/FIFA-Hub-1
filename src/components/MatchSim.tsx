import React, { useState, useEffect, useRef } from "react";
import { SimulationResult, MatchEvent } from "../types";
import { Play, RotateCcw, Award, Clock, Activity, Sliders, AlertCircle, Sparkles, ChevronRight, Star, User, Zap, Globe, ShieldCheck, Gauge, Wifi, RefreshCw } from "lucide-react";
import { audioManager } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";

const NATIONS = [
  { name: "Argentina", rating: 92 },
  { name: "France", rating: 93 },
  { name: "Brazil", rating: 91 },
  { name: "England", rating: 90 },
  { name: "Spain", rating: 92 },
  { name: "Germany", rating: 89 },
  { name: "Portugal", rating: 88 },
  { name: "Japan", rating: 81 },
  { name: "Morocco", rating: 83 },
  { name: "Bangladesh", rating: 55 }
];

interface MatchSimProps {
  soundEnabled?: boolean;
}

export default function MatchSim({ soundEnabled = false }: MatchSimProps) {
  const [teamA, setTeamA] = useState<string>("Argentina");
  const [teamB, setTeamB] = useState<string>("Brazil");
  const [loading, setLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  
  // Real-time ticking engine states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [visibleEvents, setVisibleEvents] = useState<MatchEvent[]>([]);
  const [possessionSide, setPossessionSide] = useState<'A' | 'B' | 'none'>('none');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [crowdIntensity, setCrowdIntensity] = useState<number>(30); // 0-100

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync audio manager state
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleKickoff = async () => {
    if (teamA === teamB) {
      alert("Please select two different national teams to play!");
      return;
    }

    try {
      setLoading(true);
      setSimResult(null);
      setIsPlaying(false);
      setCurrentMinute(0);
      setVisibleEvents([]);
      setPossessionSide('none');
      setIsFinished(false);
      setCrowdIntensity(40);

      const response = await fetch("/api/simulate-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB })
      });
      if (!response.ok) {
        throw new Error("Match simulation server error");
      }
      const data = await response.json();
      setSimResult(data);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      alert("Failed to start match simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && simResult) {
      timerRef.current = setInterval(() => {
        setCurrentMinute((prevMin) => {
          const nextMin = prevMin + 1;
          const matchEvents = simResult.events.filter((e) => e.minute === nextMin);
          
          if (matchEvents.length > 0) {
            setVisibleEvents((prev) => [...matchEvents, ...prev]);
            
            matchEvents.forEach(ev => {
              if (ev.type === 'goal') {
                audioManager.playGoalRoar();
                setCrowdIntensity(100);
                setTimeout(() => setCrowdIntensity(60), 4000);
              } else if (ev.type === 'chance') {
                setCrowdIntensity(85);
                setTimeout(() => setCrowdIntensity(50), 2000);
              }
              if (['kickoff', 'halftime', 'fulltime'].includes(ev.type)) audioManager.playWhistle();
            });
            
            const lastEvent = matchEvents[matchEvents.length - 1];
            if (lastEvent.team === 'A' || lastEvent.team === 'B') {
              setPossessionSide(lastEvent.team);
            } else {
              setPossessionSide('none');
            }
          }

          // Random crowd fluctuation
          setCrowdIntensity(prev => Math.max(30, Math.min(prev + (Math.random() * 4 - 2), isFinished ? 20 : 70)));

          if (nextMin >= 90) {
            setIsPlaying(false);
            setIsFinished(true);
            setCrowdIntensity(15);
            if (timerRef.current) clearInterval(timerRef.current);
            return 90;
          }
          return nextMin;
        });
      }, 200);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simResult]);

  const resetSimulator = () => {
    setIsPlaying(false);
    setCurrentMinute(0);
    setVisibleEvents([]);
    setSimResult(null);
    setPossessionSide('none');
    setIsFinished(false);
    setCrowdIntensity(30);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getCurrentScore = () => {
    if (!simResult) return { scoreA: 0, scoreB: 0 };
    if (isFinished) return { scoreA: simResult.scoreA, scoreB: simResult.scoreB };
    
    let scoreA = 0;
    let scoreB = 0;
    visibleEvents.forEach((ev) => {
      if (ev.type === 'goal') {
        if (ev.team === 'A') scoreA++;
        if (ev.team === 'B') scoreB++;
      }
    });
    return { scoreA, scoreB };
  };

  const { scoreA: liveScoreA, scoreB: liveScoreB } = getCurrentScore();

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'goal': return 'border-l-4 border-amber-500 bg-amber-500/10 text-amber-300';
      case 'card_yellow': return 'border-l-4 border-yellow-500 bg-yellow-500/10 text-yellow-300';
      case 'card_red': return 'border-l-4 border-rose-600 bg-rose-600/10 text-rose-400';
      case 'chance': return 'border-l-4 border-sky-400 bg-sky-400/10 text-sky-300';
      default: return 'border-l-4 border-zinc-700 bg-zinc-950 text-zinc-400';
    }
  };

  return (
    <div id="match-sim-module" className="space-y-6">
      
      {/* Simulation Dashboard */}
      {!simResult && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 max-w-3xl mx-auto backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Gauge className="w-40 h-40 text-white" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center justify-center gap-2 uppercase">
              <Zap className="w-6 h-6 text-amber-500" />
              Tactical Control Engine
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-mono uppercase tracking-widest font-bold">
              Autonomous Match Simulation Node
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-6 relative">
            <div className="md:col-span-5 space-y-2.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-black">NODE A (HOME)</label>
              <select
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-black italic uppercase tracking-tight"
              >
                {NATIONS.map((nation) => (
                  <option key={nation.name} value={nation.name} className="bg-[#050811]">
                    {nation.name} (STR: {nation.rating})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 text-center font-black text-xl text-amber-500 italic">VS</div>

            <div className="md:col-span-5 space-y-2.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-black">NODE B (AWAY)</label>
              <select
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-black italic uppercase tracking-tight"
              >
                {NATIONS.map((nation) => (
                  <option key={nation.name} value={nation.name} className="bg-[#050811]">
                    {nation.name} (STR: {nation.rating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-center">
            <button
              onClick={handleKickoff}
              className="bg-white hover:bg-amber-400 text-black font-black py-4 px-10 rounded-2xl text-xs font-sans uppercase tracking-tight transition-all duration-300 shadow-xl shadow-white/5 cursor-pointer flex items-center gap-3 italic"
            >
              <Play className="w-4 h-4 fill-black" />
              EXECUTE SIMULATION
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-[#050811] border border-white/10 rounded-3xl py-32 flex flex-col items-center justify-center gap-6 shadow-2xl max-w-3xl mx-auto animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em] font-black">Generating Tactical Matrix</p>
            <p className="text-[10px] text-slate-500 uppercase font-black">Handshaking with Gemini Simulation Core...</p>
          </div>
        </div>
      )}

      {/* Active simulation / Final result board */}
      {simResult && (
        <div className="space-y-6">
          
          {/* Top Telemetry Strip */}
          <div className="flex flex-wrap gap-4 justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-mono text-white font-black uppercase tracking-widest">LIVE BROADCAST</span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-slate-500 font-black uppercase">
                <div className="flex items-center gap-1.5"><Wifi className="w-3 h-3" /> 4K@60FPS</div>
                <div className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> LATENCY: 12MS</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Crowd Intensity</span>
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    animate={{ width: `${crowdIntensity}%` }}
                    className={`h-full transition-colors ${crowdIntensity > 80 ? 'bg-rose-500' : 'bg-amber-500'}`}
                  />
                </div>
              </div>
              <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-mono text-emerald-500 font-black uppercase tracking-widest">SECURE FEED</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0A0F1E] to-transparent border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
            
            <div className="grid grid-cols-12 items-center text-center">
              <div className="col-span-4 md:col-span-5 space-y-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-3xl border border-white/10 mx-auto flex items-center justify-center">
                  <Globe className="w-8 h-8 md:w-10 md:h-10 text-white/20" />
                </div>
                <h3 className="text-xl md:text-4xl font-black text-white tracking-tighter uppercase italic">{simResult.teamA}</h3>
              </div>

              <div className="col-span-4 md:col-span-2 flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl px-8 py-5 shadow-2xl scale-110">
                  <span className="text-3xl md:text-6xl font-black text-white font-mono tracking-tighter">{liveScoreA}</span>
                  <span className="text-amber-500/30 text-2xl font-black">:</span>
                  <span className="text-3xl md:text-6xl font-black text-white font-mono tracking-tighter">{liveScoreB}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-mono font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {isFinished ? "FINAL TIME" : `${currentMinute}'`}
                  </div>
                </div>
              </div>

              <div className="col-span-4 md:col-span-5 space-y-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-3xl border border-white/10 mx-auto flex items-center justify-center">
                  <Globe className="w-8 h-8 md:w-10 md:h-10 text-white/20" />
                </div>
                <h3 className="text-xl md:text-4xl font-black text-white tracking-tighter uppercase italic">{simResult.teamB}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.3em]">Direct Command Feed</h4>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest">Sync Active</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {visibleEvents.slice().reverse().map((ev, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-5 rounded-3xl text-xs space-y-2.5 transition-all relative overflow-hidden ${getEventStyle(ev.type)}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black uppercase tracking-widest text-[10px] italic flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          {ev.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono font-black text-[10px] bg-black/40 px-3 py-1 rounded-lg border border-white/10">{ev.minute}'</span>
                      </div>
                      <p className="font-sans leading-relaxed text-zinc-100 font-medium">
                        {ev.description}
                      </p>
                      {ev.player && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <User className="w-2 h-2 text-amber-500" />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 font-black uppercase tracking-widest">
                            Primary Actor: <span className="text-white">{ev.player}</span>
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              {/* Tactical Overview */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.3em]">Telemetry & Stats</h4>
                
                <div className="space-y-6">
                  {[
                    { label: "Possession", a: simResult.stats.possession[0], b: simResult.stats.possession[1] },
                    { label: "Attack Pressure", a: Math.round(50 + (liveScoreA - liveScoreB) * 8), b: Math.round(50 - (liveScoreA - liveScoreB) * 8) },
                    { label: "Vertical Speed", a: 78, b: 82 }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono font-black uppercase tracking-tight">
                        <span className="text-amber-500">{stat.a}%</span>
                        <span className="text-slate-500">{stat.label}</span>
                        <span className="text-white">{stat.b}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: "50%" }}
                          animate={{ width: `${stat.a}%` }}
                          className="h-full bg-amber-500" 
                        />
                        <div className="h-full bg-white/20 flex-grow" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-mono text-slate-500 uppercase font-black mb-1">Pass Accuracy</p>
                    <h5 className="text-lg font-black text-white italic">88.4%</h5>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-mono text-slate-500 uppercase font-black mb-1">Distance Covered</p>
                    <h5 className="text-lg font-black text-white italic">102KM</h5>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={resetSimulator} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase py-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button onClick={handleKickoff} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase py-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Restart
                  </button>
                </div>
              </div>

              {/* Man of the Match Verdict */}
              {isFinished && simResult.manOfTheMatch && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-black relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-24 h-24" />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-black/10 border border-black/10 flex items-center justify-center">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em]">Match Excellence Award</span>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-black rounded-2xl border-2 border-white/20 flex items-center justify-center">
                      <User className="w-10 h-10 text-white/40" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{simResult.manOfTheMatch.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest">{simResult.manOfTheMatch.team}</p>
                      <div className="pt-2 flex items-center gap-2">
                        <div className="bg-black text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black font-mono">
                          RATING: {simResult.manOfTheMatch.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
