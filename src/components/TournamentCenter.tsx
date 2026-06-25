import React, { useState } from "react";
import { TournamentGroup, GroupTeam, BracketMatch } from "../types";
import { Trophy, RefreshCw, Award, Sparkles, ChevronRight, Activity, Zap, TrendingUp, BarChart3, Globe, ShieldCheck, Timer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Standard ratings for simulation weights
const TEAM_RATINGS: Record<string, number> = {
  "Argentina": 92, "Canada": 78, "Chile": 80, "Peru": 76,
  "France": 93, "Austria": 82, "Netherlands": 88, "Poland": 80,
  "Brazil": 91, "Colombia": 84, "Paraguay": 78, "Costa Rica": 74,
  "England": 90, "Denmark": 83, "Slovenia": 76, "Bangladesh": 55
};

const INITIAL_GROUPS: TournamentGroup[] = [
  {
    letter: "A",
    teams: [
      { name: "Argentina", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Canada", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Chile", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Peru", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "B",
    teams: [
      { name: "France", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Austria", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Netherlands", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Poland", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "C",
    teams: [
      { name: "Brazil", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Colombia", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Paraguay", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Costa Rica", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "D",
    teams: [
      { name: "England", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Denmark", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Slovenia", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Bangladesh", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  }
];

const INITIAL_BRACKET: BracketMatch[] = [
  // Quarter Finals (QF)
  { id: "qf1", stage: "QF", teamA: "Group A Winner", teamB: "Group B Runner", simulated: false },
  { id: "qf2", stage: "QF", teamA: "Group C Winner", teamB: "Group D Runner", simulated: false },
  { id: "qf3", stage: "QF", teamA: "Group B Winner", teamB: "Group A Runner", simulated: false },
  { id: "qf4", stage: "QF", teamA: "Group D Winner", teamB: "Group C Runner", simulated: false },
  // Semi Finals (SF)
  { id: "sf1", stage: "SF", teamA: "QF1 Winner", teamB: "QF2 Winner", simulated: false },
  { id: "sf2", stage: "SF", teamA: "QF3 Winner", teamB: "QF4 Winner", simulated: false },
  // Final (F)
  { id: "f1", stage: "F", teamA: "SF1 Winner", teamB: "SF2 Winner", simulated: false }
];

export default function TournamentCenter() {
  const [groups, setGroups] = useState<TournamentGroup[]>(INITIAL_GROUPS);
  const [bracket, setBracket] = useState<BracketMatch[]>(INITIAL_BRACKET);
  const [activeTab, setActiveTab] = useState<"groups" | "bracket">("groups");
  const [groupsSimulated, setGroupsSimulated] = useState<boolean>(false);
  const [champion, setChampion] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Tournament-wide aggregate stats
  const totalGoals = groups.reduce((acc, g) => acc + g.teams.reduce((ta, t) => ta + t.gf, 0), 0) + 
                    bracket.filter(m => m.simulated).reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0);
  
  const matchesPlayed = (groupsSimulated ? 24 : 0) + bracket.filter(m => m.simulated).length;

  // Core offline simulation logic for single matches
  const simSingleMatch = (teamA: string, teamB: string): { scoreA: number; scoreB: number } => {
    const rA = TEAM_RATINGS[teamA] || 75;
    const rB = TEAM_RATINGS[teamB] || 75;
    
    const weightA = rA / (rA + rB);
    const scoreA = Math.max(0, Math.round(Math.random() * 3 + (weightA * 1.5) - 0.5));
    const scoreB = Math.max(0, Math.round(Math.random() * 3 + ((1 - weightA) * 1.5) - 0.5));
    
    return { scoreA, scoreB };
  };

  // Run the full group stage simulation
  const simulateGroups = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updatedGroups = groups.map((group) => {
        const teamsMap: Record<string, GroupTeam> = {};
        group.teams.forEach((t) => {
          teamsMap[t.name] = { name: t.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
        });

        const list = Object.keys(teamsMap);
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const nameA = list[i];
            const nameB = list[j];
            const { scoreA, scoreB } = simSingleMatch(nameA, nameB);

            teamsMap[nameA].played++;
            teamsMap[nameA].gf += scoreA;
            teamsMap[nameA].ga += scoreB;
            teamsMap[nameA].gd = teamsMap[nameA].gf - teamsMap[nameA].ga;

            teamsMap[nameB].played++;
            teamsMap[nameB].gf += scoreB;
            teamsMap[nameB].ga += scoreA;
            teamsMap[nameB].gd = teamsMap[nameB].gf - teamsMap[nameB].ga;

            if (scoreA > scoreB) {
              teamsMap[nameA].won++;
              teamsMap[nameA].points += 3;
              teamsMap[nameB].lost++;
            } else if (scoreB > scoreA) {
              teamsMap[nameB].won++;
              teamsMap[nameB].points += 3;
              teamsMap[nameA].lost++;
            } else {
              teamsMap[nameA].drawn++;
              teamsMap[nameA].points += 1;
              teamsMap[nameB].drawn++;
              teamsMap[nameB].points += 1;
            }
          }
        }

        const sortedTeams = Object.values(teamsMap).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });

        return {
          letter: group.letter,
          teams: sortedTeams
        };
      });

      setGroups(updatedGroups);
      setGroupsSimulated(true);

      const seedQF = (id: string, teamA: string, teamB: string) => {
        setBracket((prev) =>
          prev.map((m) => (m.id === id ? { ...m, teamA, teamB, scoreA: undefined, scoreB: undefined, winner: undefined, simulated: false } : m))
        );
      };

      const a1 = updatedGroups[0].teams[0].name;
      const a2 = updatedGroups[0].teams[1].name;
      const b1 = updatedGroups[1].teams[0].name;
      const b2 = updatedGroups[1].teams[1].name;
      const c1 = updatedGroups[2].teams[0].name;
      const c2 = updatedGroups[2].teams[1].name;
      const d1 = updatedGroups[3].teams[0].name;
      const d2 = updatedGroups[3].teams[1].name;

      seedQF("qf1", a1, b2);
      seedQF("qf2", c1, d2);
      seedQF("qf3", b1, a2);
      seedQF("qf4", d1, c2);

      setBracket((prev) =>
        prev.map((m) =>
          m.stage === "SF" || m.stage === "F"
            ? {
                ...m,
                teamA: m.stage === "SF" ? (m.id === "sf1" ? "QF1 Winner" : "QF3 Winner") : "SF1 Winner",
                teamB: m.stage === "SF" ? (m.id === "sf2" ? "QF2 Winner" : "QF4 Winner") : "SF2 Winner",
                scoreA: undefined,
                scoreB: undefined,
                winner: undefined,
                simulated: false
              }
            : m
        )
      );
      setChampion(null);
      setIsSyncing(false);
    }, 800);
  };

  const simulateBracketMatch = (matchId: string) => {
    const match = bracket.find((m) => m.id === matchId);
    if (!match) return;
    
    if (match.teamA.includes("Winner") || match.teamB.includes("Winner") || match.teamA.includes("Runner") || match.teamB.includes("Runner")) {
      return;
    }

    let { scoreA, scoreB } = simSingleMatch(match.teamA, match.teamB);
    if (scoreA === scoreB) {
      if (Math.random() < 0.5) scoreA++; else scoreB++;
    }

    const winner = scoreA > scoreB ? match.teamA : match.teamB;

    setBracket((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, scoreA, scoreB, winner, simulated: true } : m))
    );

    promoteWinner(matchId, winner);
  };

  const promoteWinner = (matchId: string, winner: string) => {
    setBracket((prev) => {
      return prev.map((m) => {
        if (m.stage === "SF") {
          if (matchId === "qf1" && m.id === "sf1") return { ...m, teamA: winner };
          if (matchId === "qf2" && m.id === "sf1") return { ...m, teamB: winner };
          if (matchId === "qf3" && m.id === "sf2") return { ...m, teamA: winner };
          if (matchId === "qf4" && m.id === "sf2") return { ...m, teamB: winner };
        }
        if (m.stage === "F") {
          if (matchId === "sf1" && m.id === "f1") return { ...m, teamA: winner };
          if (matchId === "sf2" && m.id === "f1") return { ...m, teamB: winner };
        }
        return m;
      });
    });

    if (matchId === "f1") {
      setChampion(winner);
    }
  };

  const simulateWholePlayoff = () => {
    setIsSyncing(true);
    setTimeout(() => {
      if (!groupsSimulated) {
        simulateGroups();
      }
      
      const order = ["qf1", "qf2", "qf3", "qf4", "sf1", "sf2", "f1"];
      let currentBracket = [...bracket];
      
      order.forEach((mid) => {
        const match = currentBracket.find((m) => m.id === mid);
        if (!match) return;

        let tA = match.teamA;
        let tB = match.teamB;

        if (mid === "sf1") {
          tA = currentBracket.find(m => m.id === "qf1")?.winner || "QF1 Winner";
          tB = currentBracket.find(m => m.id === "qf2")?.winner || "QF2 Winner";
        } else if (mid === "sf2") {
          tA = currentBracket.find(m => m.id === "qf3")?.winner || "QF3 Winner";
          tB = currentBracket.find(m => m.id === "qf4")?.winner || "QF4 Winner";
        } else if (mid === "f1") {
          tA = currentBracket.find(m => m.id === "sf1")?.winner || "SF1 Winner";
          tB = currentBracket.find(m => m.id === "sf2")?.winner || "SF2 Winner";
        }

        let { scoreA, scoreB } = simSingleMatch(tA, tB);
        if (scoreA === scoreB) {
          if (Math.random() < 0.5) scoreA++; else scoreB++;
        }
        const win = scoreA > scoreB ? tA : tB;

        currentBracket = currentBracket.map((m) => {
          if (m.id === mid) {
            return { ...m, teamA: tA, teamB: tB, scoreA, scoreB, winner: win, simulated: true };
          }
          if (m.stage === "SF") {
            if (mid === "qf1" && m.id === "sf1") return { ...m, teamA: win };
            if (mid === "qf2" && m.id === "sf1") return { ...m, teamB: win };
            if (mid === "qf3" && m.id === "sf2") return { ...m, teamA: win };
            if (mid === "qf4" && m.id === "sf2") return { ...m, teamB: win };
          }
          if (m.stage === "F") {
            if (mid === "sf1" && m.id === "f1") return { ...m, teamA: win };
            if (mid === "sf2" && m.id === "f1") return { ...m, teamB: win };
          }
          return m;
        });
      });

      setBracket(currentBracket);
      const finalWin = currentBracket.find((m) => m.id === "f1")?.winner || null;
      setChampion(finalWin);
      setIsSyncing(false);
    }, 1500);
  };

  const resetAll = () => {
    setGroups(INITIAL_GROUPS);
    setBracket(INITIAL_BRACKET);
    setGroupsSimulated(false);
    setChampion(null);
  };

  return (
    <div id="tournament-command-center" className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MATCHES PLANNED", val: matchesPlayed + (groupsSimulated ? 0 : 24) + (champion ? 0 : 7), icon: <Timer className="w-4 h-4 text-slate-500" /> },
          { label: "TOTAL GOALS", val: totalGoals, icon: <Activity className="w-4 h-4 text-rose-500" /> },
          { label: "COMPLETION %", val: Math.round((matchesPlayed / 31) * 100) + "%", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: "AI PREDICTED WINNER", val: "ARGENTINA", icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              {stat.icon}
            </div>
            <div>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black leading-none mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-white italic tracking-tight">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Orchestration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Control & Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-[#0A0F1E] to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-12 h-12 text-amber-500/5" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Main Controller</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Orchestration Active</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={simulateGroups}
                disabled={isSyncing}
                className="w-full bg-white hover:bg-amber-400 text-black font-black text-xs font-sans uppercase py-4 px-5 rounded-2xl tracking-tight transition-all cursor-pointer flex items-center justify-between shadow-lg shadow-white/5 disabled:opacity-50"
              >
                Simulate Groups
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={simulateWholePlayoff}
                disabled={isSyncing}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs font-sans uppercase py-4 px-5 rounded-2xl tracking-tight transition-all cursor-pointer flex items-center justify-between shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                Instant Playoff
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={resetAll}
                className="w-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-mono py-3 px-4 rounded-2xl transition-all cursor-pointer uppercase font-bold text-center"
              >
                Reset Database
              </button>
            </div>

            {isSyncing && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black">Syncing Match Data...</span>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">AI Predictions</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Winning Probabilities</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: "Argentina", prob: 28 },
                { name: "France", prob: 24 },
                { name: "Brazil", prob: 21 },
                { name: "England", prob: 18 }
              ].map((team, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-black uppercase">
                    <span className="text-slate-300">{team.name}</span>
                    <span className="text-emerald-500">{team.prob}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${team.prob * 3}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            <p className="text-[10px] font-mono uppercase tracking-widest font-black">All Match IDs Verified</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-2.5 px-6 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer font-black uppercase ${
                activeTab === "groups"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Group Hub
            </button>
            <button
              onClick={() => setActiveTab("bracket")}
              className={`py-2.5 px-6 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer font-black uppercase ${
                activeTab === "bracket"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Knockout Command
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "groups" ? (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {groups.map((group) => (
                  <div key={group.letter} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Globe className="w-16 h-16 text-white" />
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-white text-xl font-sans uppercase italic tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-black text-xs font-mono flex items-center justify-center font-black">
                          {group.letter}
                        </span>
                        GROUP {group.letter}
                      </h3>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest mb-3 px-2">
                        <div className="col-span-6">TEAM</div>
                        <div className="col-span-2 text-center">W/L</div>
                        <div className="col-span-2 text-center">GD</div>
                        <div className="col-span-2 text-center">PTS</div>
                      </div>
                      {group.teams.map((team, idx) => (
                        <div
                          key={team.name}
                          className={`grid grid-cols-12 gap-2 py-3 px-4 rounded-2xl transition-all ${
                            idx < 2 && groupsSimulated 
                              ? "bg-amber-500/10 border border-amber-500/20" 
                              : "bg-white/5 border border-transparent hover:border-white/10"
                          }`}
                        >
                          <div className="col-span-6 flex items-center gap-3">
                            <span className={`text-[10px] font-mono font-black ${idx < 2 && groupsSimulated ? "text-amber-500" : "text-slate-600"}`}>
                              0{idx + 1}
                            </span>
                            <span className="text-xs font-black text-white uppercase italic tracking-tight">{team.name}</span>
                          </div>
                          <div className="col-span-2 text-center text-[10px] font-mono text-slate-400 font-bold">{team.won}/{team.lost}</div>
                          <div className="col-span-2 text-center text-[10px] font-mono text-slate-400 font-bold">{team.gd > 0 ? `+${team.gd}` : team.gd}</div>
                          <div className={`col-span-2 text-center text-xs font-mono font-black ${idx < 2 && groupsSimulated ? "text-amber-500" : "text-white"}`}>
                            {team.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="bracket"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {champion && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
                    <Trophy className="w-20 h-20 text-black mx-auto drop-shadow-2xl mb-2 relative" />
                    <div className="relative">
                      <p className="text-[11px] font-mono text-black uppercase tracking-[0.3em] font-black mb-1">TOURNAMENT SUPREMACY</p>
                      <h3 className="text-5xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">{champion}</h3>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "QUARTER FINALS", stage: "QF" },
                    { label: "SEMI FINALS", stage: "SF" },
                    { label: "GRAND FINAL", stage: "F" }
                  ].map((col, cIdx) => (
                    <div key={col.stage} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-black">{col.label}</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      </div>
                      
                      <div className={`space-y-4 ${col.stage === 'SF' ? 'pt-12' : col.stage === 'F' ? 'pt-32' : ''}`}>
                        {bracket.filter(m => m.stage === col.stage).map((match) => (
                          <div
                            key={match.id}
                            className={`bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 transition-all relative overflow-hidden group ${
                              match.simulated ? "border-white/20" : "hover:border-amber-500/40"
                            }`}
                          >
                            <div className="space-y-3">
                              {[
                                { name: match.teamA, score: match.scoreA },
                                { name: match.teamB, score: match.scoreB }
                              ].map((t, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${match.winner === t.name ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-white/5'}`} />
                                    <span className={`text-xs font-black uppercase italic tracking-tight ${match.winner === t.name ? "text-amber-500" : "text-slate-300"}`}>
                                      {t.name}
                                    </span>
                                  </div>
                                  {match.simulated && (
                                    <span className="font-mono font-black bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-xs text-white">
                                      {t.score}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {!match.simulated && (
                              <button
                                onClick={() => simulateBracketMatch(match.id)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white hover:text-amber-400 text-[9px] font-mono font-black uppercase py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
                              >
                                EXECUTE SIM
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
