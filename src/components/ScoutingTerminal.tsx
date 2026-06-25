import React, { useState, useEffect } from "react";
import { ScoutingReport, PlayerComparison } from "../types";
import { Shield, Sparkles, RefreshCw, AlertCircle, Search, Star, Layers, Activity, Users, ArrowLeftRight, Flame, Share2, History } from "lucide-react";
import NetworkFlow from "./NetworkFlow";
import { GmailShare } from "./GmailShare";
import { DriveShare } from "./DriveShare";
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from "./FirebaseProvider";
import { handleFirestoreError, OperationType } from "../lib/firebaseUtils";

const SUGGESTED_COUNTRIES = [
  "Argentina", "Brazil", "France", "England", "Spain", "Germany", "Japan", "Bangladesh", "Morocco"
];

export default function ScoutingTerminal() {
  const { user } = useFirebase();
  const [view, setView] = useState<"scout" | "compare">("scout");
  
  // Scouting State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCountry, setActiveCountry] = useState<string>("Argentina");
  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Comparison State
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [comparison, setComparison] = useState<PlayerComparison | null>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparisonHistory, setComparisonHistory] = useState<any[]>([]);

  const fetchReport = async (countryName: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedPlayer(null);
      setShowHeatmap(false);
      const response = await fetch("/api/scout-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName })
      });
      if (!response.ok) {
        throw new Error("Scouting failed.");
      }
      const data = await response.json();
      setReport(data);
      setActiveCountry(countryName);
    } catch (err: any) {
      setError("Scouting data for this country is temporarily unavailable.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    if (!player1.trim() || !player2.trim()) return;
    try {
      setCompareLoading(true);
      setCompareError(null);
      const response = await fetch(`/api/compare-players?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`);
      if (!response.ok) {
        throw new Error("Comparison failed.");
      }
      const data = await response.json();
      setComparison(data);

      // Save to Firebase
      if (user) {
        addDoc(collection(db, "comparisons"), {
          player1: player1,
          player2: player2,
          comparisonData: data,
          createdAt: serverTimestamp(),
          userId: user.uid
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, "comparisons"));
      }
    } catch (err: any) {
      setCompareError("Failed to generate tactical comparison.");
      console.error(err);
    } finally {
      setCompareLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeCountry);
  }, []);

  // Load comparison history
  useEffect(() => {
    if (!user) {
      setComparisonHistory([]);
      return;
    }

    const q = query(
      collection(db, "comparisons"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setComparisonHistory(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "comparisons");
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchReport(searchQuery.trim());
    }
  };

  return (
    <div id="scouting-terminal-module" className="space-y-6">
      
      {/* View Switcher Header */}
      <div className="flex justify-center">
        <div className="bg-white/5 border border-white/10 p-1 rounded-full flex gap-1 backdrop-blur-sm shadow-xl">
          <button
            onClick={() => setView("scout")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              view === "scout"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            Team Scouting
          </button>
          <button
            onClick={() => setView("compare")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              view === "compare"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Player Comparison
          </button>
        </div>
      </div>

      {view === "scout" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls & Country Selector (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter flex items-center gap-2 uppercase">
                  <Shield className="w-5 h-5 text-amber-500" />
                  Scouting Deck
                </h2>
                <p className="text-xs text-slate-400">
                  Query Gemini to deliver deep tactical setups, player roles, and team metrics.
                </p>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050811] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-amber-400 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Preset Chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_COUNTRIES.map((country) => (
                    <button
                      key={country}
                      onClick={() => {
                        setSearchQuery("");
                        fetchReport(country);
                      }}
                      className={`text-xs py-1 px-3 rounded-full border font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                        activeCountry.toLowerCase() === country.toLowerCase()
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-white/5 text-slate-400 border-white/5 hover:text-white hover:border-white/10"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactical Rating Card */}
            {report && !loading && (
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold">
                  <Activity className="w-4 h-4 text-amber-500" />
                  Combat Effectiveness
                </h3>
                
                <div className="space-y-3.5">
                  {/* Rating 1: Overall */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5 font-mono font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">TACTICAL DEPTH</span>
                      <span className="text-amber-400">{report.tacticalRating}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${report.tacticalRating}%` }}
                      />
                    </div>
                  </div>

                  {/* Rating 2: Attack */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5 font-mono font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">ATTACK RATING</span>
                      <span className="text-orange-400">{report.attackRating}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                        style={{ width: `${report.attackRating}%` }}
                      />
                    </div>
                  </div>

                  {/* Rating 3: Midfield */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5 font-mono font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">MIDFIELD CONTROL</span>
                      <span className="text-yellow-400">{report.midfieldRating}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                        style={{ width: `${report.midfieldRating}%` }}
                      />
                    </div>
                  </div>

                  {/* Rating 4: Defense */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5 font-mono font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">DEFENSIVE SOLIDITY</span>
                      <span className="text-slate-400">{report.defenseRating}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-1000"
                        style={{ width: `${report.defenseRating}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Scouting Report & Lineup Pitch (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl py-32 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase">COMPILING SCOUT REPORT FOR {activeCountry.toUpperCase()}...</p>
              </div>
            ) : error || !report ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scouting Interrupted</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  We encountered a slight setback generating reports for that specific team. Please try another preset country or query again.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Report Header */}
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 p-3 bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold tracking-widest uppercase border-l border-b border-white/10 rounded-bl-xl flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    Gemini Intelligence
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                      National Scouting Report
                    </span>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic mt-1">
                      {report.country}
                    </h1>
                    <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Formation: <span className="text-white font-bold">{report.formation}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <GmailShare 
                      subject={`Scouting Report: ${report.country}`}
                      body={`
                        <div style="font-family: sans-serif; background-color: #050811; color: white; padding: 40px; border-radius: 20px;">
                          <h1 style="color: #f59e0b; font-style: italic; margin-bottom: 5px;">SCOUTING REPORT: ${report.country}</h1>
                          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">Formation: <strong>${report.formation}</strong></p>
                          
                          <div style="background-color: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                            <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 15px;">Tactical Breakdown</h2>
                            <p style="font-size: 14px; line-height: 1.6;">${report.playstyleSummary}</p>
                          </div>

                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div>
                              <h3 style="color: #f59e0b; font-size: 12px; text-transform: uppercase;">Strengths</h3>
                              <ul style="font-size: 13px; padding-left: 20px;">
                                ${report.strengths.map(s => `<li>${s}</li>`).join('')}
                              </ul>
                            </div>
                            <div>
                              <h3 style="color: #ef4444; font-size: 12px; text-transform: uppercase;">Weaknesses</h3>
                              <ul style="font-size: 13px; padding-left: 20px;">
                                ${report.weaknesses.map(w => `<li>${w}</li>`).join('')}
                              </ul>
                            </div>
                          </div>

                          <div style="margin-top: 40px; font-size: 12px; color: #475569;">
                            Strategic Insight provided by Gemini AI Scouting.
                          </div>
                        </div>
                      `}
                      buttonText="Share Report"
                    />
                    <DriveShare
                      fileName={`Scouting_Report_${report.country}.html`}
                      content={`
                        <div style="font-family: sans-serif; background-color: #050811; color: white; padding: 40px; border-radius: 20px;">
                          <h1 style="color: #f59e0b; font-style: italic; margin-bottom: 5px;">SCOUTING REPORT: ${report.country}</h1>
                          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">Formation: <strong>${report.formation}</strong></p>
                          <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 15px;">Tactical Breakdown</h2>
                          <p style="font-size: 14px; line-height: 1.6;">${report.playstyleSummary}</p>
                        </div>
                      `}
                      buttonText="Save to Drive"
                    />
                  </div>
                </div>

                {/* Tactical Grid (Pitch vs Core Report) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Green Football Pitch (7 cols on md) */}
                  <div className="md:col-span-7 flex flex-col bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">TACTICAL LINEUP PLOT</span>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">TAP NODES FOR ROLES</span>
                    </div>
                    
                    {/* Visual Pitch */}
                    <div className="relative aspect-[3/4] w-full bg-emerald-950/40 rounded-xl overflow-hidden border border-emerald-800/35">
                      {/* Grass patterns */}
                      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-emerald-900/10" />
                      
                      {/* Heatmap Overlay */}
                      {showHeatmap && selectedPlayer?.heatmap && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {selectedPlayer.heatmap.map((point: any, pIdx: number) => (
                            <div
                              key={pIdx}
                              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                              style={{
                                left: `${point.x}%`,
                                top: `${100 - point.y}%`,
                                width: '100px',
                                height: '100px',
                                background: `radial-gradient(circle, rgba(245, 158, 11, ${point.intensity * 0.4}) 0%, transparent 70%)`
                              }}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Field lines */}
                      {/* Penalty box top */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[18%] border-b border-x border-white/20 rounded-b-xl" />
                      {/* Penalty box bottom */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[18%] border-t border-x border-white/20 rounded-t-xl" />
                      
                      {/* Center line */}
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 aspect-square border border-white/20 rounded-full" />
                      
                      {/* Goal outlines */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1/5 h-2 bg-emerald-800 border border-white/30 rounded-full" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/5 h-2 bg-emerald-800 border border-white/30 rounded-full" />

                      {/* Player Nodes (using coordinates from report) */}
                      {report.lineup.map((player, idx) => {
                        const isSelected = selectedPlayer?.name === player.name;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const kp = report.keyPlayers.find(k => k.name.toLowerCase().includes(player.name.toLowerCase()) || player.name.toLowerCase().includes(k.name.toLowerCase()));
                              setSelectedPlayer(kp || { name: player.name, role: "Core Starting Lineup Squad Member", position: player.position, number: idx + 2 });
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300"
                            style={{ left: `${player.x}%`, top: `${100 - player.y}%` }}
                          >
                            {/* Player Ring animation */}
                            <div className={`absolute -inset-2 rounded-full border opacity-0 group-hover:opacity-100 transition-opacity animate-ping ${
                              isSelected ? "border-amber-400/50" : "border-white/30"
                            }`} />
                            
                            {/* Circle dot */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shadow-lg transition-all border-2 ${
                              isSelected
                                ? "bg-amber-500 text-black border-amber-300 scale-110"
                                : "bg-zinc-950 text-white border-white/10 hover:bg-amber-500/20"
                            }`}>
                              {player.position}
                            </div>
                            
                            {/* Name label */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-zinc-950/95 border border-zinc-800 rounded px-1.5 py-0.5 whitespace-nowrap text-[8px] font-mono text-zinc-300 tracking-tight shadow-md group-hover:text-white group-hover:border-zinc-700">
                              {player.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Player Detail panel */}
                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl min-h-[60px] flex flex-col justify-center">
                      {selectedPlayer ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1 uppercase font-sans">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {selectedPlayer.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {selectedPlayer.heatmap && (
                                <button
                                  onClick={() => setShowHeatmap(!showHeatmap)}
                                  className={`flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    showHeatmap 
                                      ? "bg-amber-500 text-black border-amber-400" 
                                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                                  }`}
                                >
                                  <Flame className="w-3 h-3" />
                                  {showHeatmap ? "HEATMAP ON" : "HEATMAP OFF"}
                                </button>
                              )}
                              <span className="text-[10px] font-mono bg-black/40 text-slate-300 py-0.5 px-2 rounded border border-white/5 font-bold">
                                N°{selectedPlayer.number || "—"} • {selectedPlayer.position}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal font-sans">
                            Tactical Role: <strong className="text-slate-200">{selectedPlayer.role}</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] font-mono text-slate-500 py-2 uppercase font-bold tracking-wider">
                          TAP ANY NODE ON PITCH TO VIEW TACTICAL ROLES & ROSTER
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Scouting Details (5 cols on md) */}
                  <div className="md:col-span-5 space-y-4">
                    
                    {/* Play Style */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2 backdrop-blur-sm shadow-md">
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold border-b border-white/5 pb-1">
                        Core Play Style
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {report.styleOfPlay}
                      </p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 gap-4">
                      
                      {/* Strengths */}
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                        <h3 className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Key Strengths
                        </h3>
                        <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-sans leading-relaxed">
                          {report.strengths.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl space-y-2">
                        <h3 className="text-xs font-mono text-rose-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Tactical Gaps
                        </h3>
                        <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-sans leading-relaxed">
                          {report.weaknesses.map((wk, i) => (
                            <li key={i}>{wk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Key Players Card */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 backdrop-blur-sm shadow-md">
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold border-b border-white/5 pb-1">
                        Key Player Roster
                      </h3>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {report.keyPlayers.map((player, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2.5 bg-black/20 border border-white/5 rounded-xl text-xs hover:border-white/10 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <strong className="text-white block font-sans">{player.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {player.role}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono bg-white/5 text-amber-400 font-bold py-1 px-2.5 rounded-lg border border-white/5">
                              {player.position}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Network Flow Monitoring */}
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-amber-500" />
                      Network Flow Monitoring
                    </h3>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <NetworkFlow />
                </div>

              </div>
            )}
          </div>
        </div>
      ) : (
        /* PLAYER COMPARISON VIEW */
        <div className="space-y-6">
          {/* Input Area */}
          <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">Player One</label>
                <input
                  type="text"
                  placeholder="e.g. Kylian Mbappé"
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  className="w-full bg-[#050811] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex-shrink-0 mt-6 hidden md:block">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500 italic">
                  VS
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">Player Two</label>
                <input
                  type="text"
                  placeholder="e.g. Erling Haaland"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  className="w-full bg-[#050811] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="md:mt-6 w-full md:w-auto">
                <button
                  onClick={fetchComparison}
                  disabled={compareLoading || !player1 || !player2}
                  className="w-full bg-white hover:bg-amber-400 text-black font-black text-xs py-3 px-8 rounded-xl tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                >
                  {compareLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  {compareLoading ? "Analyzing..." : "Compare"}
                </button>
              </div>
            </div>
          </div>

          {/* Comparison History */}
          {!comparison && !compareLoading && comparisonHistory.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-2 px-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-[0.2em]">Previous Comparisons</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {comparisonHistory.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setPlayer1(item.player1);
                      setPlayer2(item.player2);
                      setComparison(item.comparisonData);
                    }}
                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.08] transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-white italic uppercase">{item.player1}</span>
                      <span className="text-[10px] font-mono text-amber-500 font-black">VS</span>
                      <span className="text-xs font-black text-white italic uppercase">{item.player2}</span>
                    </div>
                    <div className="text-slate-500 group-hover:text-amber-400 transition-colors">
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result Area */}
          {compareLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <p className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase text-center max-w-xs leading-relaxed">
                Gemini is cross-referencing tactical data points and performance metrics...
              </p>
            </div>
          ) : compareError ? (
            <div className="max-w-xl mx-auto bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-white uppercase">Analysis Failed</h3>
              <p className="text-xs text-slate-400">{compareError}</p>
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Split Screen Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* VS Overlay for Desktop */}
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-amber-500 text-black font-black italic rounded-full border-4 border-[#050811] shadow-2xl">
                  VS
                </div>

                {[comparison.playerA, comparison.playerB].map((p, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-white/5 border-l border-b border-white/10 rounded-bl-xl text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                      {idx === 0 ? "Option Alpha" : "Option Beta"}
                    </div>
                    
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-amber-400 transition-colors">
                      {p.name}
                    </h3>

                    {/* Metrics Radar-ish List */}
                    <div className="space-y-4 mb-6">
                      {p.metrics.map((m, mIdx) => (
                        <div key={mIdx}>
                          <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5">
                            <span className="text-slate-400 uppercase tracking-widest">{m.label}</span>
                            <span className="text-white">{m.value}%</span>
                          </div>
                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-amber-500' : 'bg-amber-400'}`}
                              style={{ width: `${m.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-black/20 border border-white/5 rounded-xl">
                      <h4 className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        Tactical Summary
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                        "{p.summary}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verdict Section */}
              <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles className="w-8 h-8 text-amber-500/20" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-shrink-0 text-center md:text-left">
                    <div className="bg-amber-500 text-black font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter mb-2 inline-block">
                      GEMINI VERDICT
                    </div>
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Tactical Comparison Conclusion</h2>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-relaxed font-sans border-l-2 border-amber-500/30 pl-6 italic">
                      {comparison.tacticalVerdict}
                    </p>
                  </div>
                  <div className="flex-shrink-0 pt-4 md:pt-0 flex flex-col gap-2">
                    <GmailShare 
                      subject={`Tactical Comparison: ${player1} vs ${player2}`}
                      body={`
                        <div style="font-family: sans-serif; background-color: #050811; color: white; padding: 40px; border-radius: 20px;">
                          <h1 style="color: #f59e0b; font-style: italic; margin-bottom: 25px;">TACTICAL COMPARISON: ${player1} VS ${player2}</h1>
                          
                          <div style="background-color: rgba(255,255,255,0.05); padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                            <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 10px;">Final Verdict</h2>
                            <p style="font-size: 15px; line-height: 1.7; font-style: italic;">${comparison.tacticalVerdict}</p>
                          </div>

                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                            <div>
                              <h3 style="font-size: 18px; color: #f59e0b; margin-bottom: 10px;">${comparison.playerA.name}</h3>
                              <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">${comparison.playerA.summary}</p>
                              <ul style="font-size: 12px; list-style: none; padding: 0;">
                                ${comparison.playerA.metrics.map(m => `<li>${m.label}: ${m.value}%</li>`).join('')}
                              </ul>
                            </div>
                            <div>
                              <h3 style="font-size: 18px; color: #f59e0b; margin-bottom: 10px;">${comparison.playerB.name}</h3>
                              <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">${comparison.playerB.summary}</p>
                              <ul style="font-size: 12px; list-style: none; padding: 0;">
                                ${comparison.playerB.metrics.map(m => `<li>${m.label}: ${m.value}%</li>`).join('')}
                              </ul>
                            </div>
                          </div>
                        </div>
                      `}
                      buttonText="Share Verdict"
                    />
                    <DriveShare
                      fileName={`Comparison_${player1}_vs_${player2}.html`}
                      content={`
                        <div style="font-family: sans-serif; background-color: #050811; color: white; padding: 40px; border-radius: 20px;">
                          <h1 style="color: #f59e0b; font-style: italic; margin-bottom: 25px;">TACTICAL COMPARISON: ${player1} VS ${player2}</h1>
                          <p style="font-size: 15px; line-height: 1.7; font-style: italic;">${comparison.tacticalVerdict}</p>
                        </div>
                      `}
                      buttonText="Save Verdict"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Initial State */
            <div className="py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Enter players for tactical analysis</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed uppercase font-mono font-bold tracking-tight">
                Provide two names and Gemini will generate a cross-referenced breakdown of their profiles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

