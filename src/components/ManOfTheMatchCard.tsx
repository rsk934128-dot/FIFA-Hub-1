import React, { useMemo } from "react";
import { Award, Star, Zap, Shield, Target, Sparkles, User, Activity } from "lucide-react";
import { motion } from "motion/react";
import { MatchEvent, SimulationResult } from "../types";

interface ManOfTheMatchCardProps {
  simResult: SimulationResult;
  events: MatchEvent[];
  isFinished: boolean;
}

interface PlayerStats {
  name: string;
  team: string;
  goals: number;
  shotsOnTarget: number;
  yellowCards: number;
  redCards: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  saves: number;
  rating: number;
  position: "FWD" | "MID" | "DEF" | "GK";
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
}

export default function ManOfTheMatchCard({ simResult, events, isFinished }: ManOfTheMatchCardProps) {
  const motmData = useMemo(() => {
    if (!isFinished || !simResult) return null;

    // 1. Compile stats for all players mentioned in the events
    const playersMap = new Map<string, PlayerStats>();

    const getOrCreatePlayer = (name: string, teamCode: "A" | "B" | "none") => {
      const teamName = teamCode === "A" ? simResult.teamA : teamCode === "B" ? simResult.teamB : "Unknown";
      if (!playersMap.has(name)) {
        // Deterministic but random-looking attributes based on name hash
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const pace = 80 + (Math.abs(hash) % 18);
        const passing = 78 + (Math.abs(hash >> 2) % 20);
        const dribbling = 82 + (Math.abs(hash >> 4) % 16);
        const physicality = 75 + (Math.abs(hash >> 6) % 20);

        playersMap.set(name, {
          name,
          team: teamName,
          goals: 0,
          shotsOnTarget: 0,
          yellowCards: 0,
          redCards: 0,
          passes: 35 + (Math.abs(hash >> 8) % 25),
          passAccuracy: 82 + (Math.abs(hash >> 10) % 15),
          tackles: 1 + (Math.abs(hash >> 12) % 5),
          saves: 0,
          rating: 6.5 + ((Math.abs(hash >> 14) % 15) / 10), // Base rating 6.5 - 8.0
          position: (Math.abs(hash) % 3 === 0) ? "FWD" : (Math.abs(hash) % 3 === 1) ? "MID" : "DEF",
          pace,
          shooting: 70 + (Math.abs(hash >> 1) % 20),
          passing,
          dribbling,
          defending: 50 + (Math.abs(hash >> 3) % 40),
          physicality
        });
      }
      return playersMap.get(name)!;
    };

    // Parse events to award stats and dynamically adjust ratings
    events.forEach((ev) => {
      if (!ev.player || ev.player === "") return;
      const p = getOrCreatePlayer(ev.player, ev.team);
      if (ev.type === "goal") {
        p.goals += 1;
        p.shotsOnTarget += 1;
        p.rating += 2.2;
        p.shooting = Math.min(99, p.shooting + 15);
      } else if (ev.type === "chance") {
        p.shotsOnTarget += 1;
        p.rating += 0.8;
        p.shooting = Math.min(99, p.shooting + 5);
      } else if (ev.type === "card_yellow") {
        p.yellowCards += 1;
        p.rating -= 1.0;
        p.defending = Math.min(99, p.defending + 8);
      } else if (ev.type === "card_red") {
        p.redCards += 1;
        p.rating -= 3.0;
      }
    });

    // 2. Select the Man of the Match
    // If the server provided an MVP name, prioritize them but overlay our calculated stats
    let motmPlayer: PlayerStats | null = null;
    const serverMotm = simResult.manOfTheMatch;

    if (serverMotm && serverMotm.name) {
      // Find or create
      const side = serverMotm.team === simResult.teamA ? "A" : "B";
      const p = getOrCreatePlayer(serverMotm.name, side);
      p.rating = serverMotm.rating; // Use the server rating
      
      // Ensure rating is high
      p.rating = Math.max(8.0, p.rating);
      
      // Boost attributes because they are the MOTM
      p.pace = Math.min(99, p.pace + 5);
      p.shooting = Math.min(99, p.shooting + 10);
      p.passing = Math.min(99, p.passing + 6);
      p.dribbling = Math.min(99, p.dribbling + 7);
      p.physicality = Math.min(99, p.physicality + 4);
      
      motmPlayer = p;
    } else {
      // Otherwise find the player with the highest rating
      const allPlayers = Array.from(playersMap.values());
      if (allPlayers.length > 0) {
        allPlayers.sort((a, b) => b.rating - a.rating);
        motmPlayer = allPlayers[0];
      }
    }

    // 3. Fallback if no player events occurred (e.g. extreme low event scoreless draw)
    if (!motmPlayer) {
      const defaultName = simResult.scoreA >= simResult.scoreB ? "Gomes" : "Smith";
      const defaultTeam = simResult.scoreA >= simResult.scoreB ? simResult.teamA : simResult.teamB;
      motmPlayer = {
        name: defaultName,
        team: defaultTeam,
        goals: 0,
        shotsOnTarget: 0,
        yellowCards: 0,
        redCards: 0,
        passes: 42,
        passAccuracy: 89,
        tackles: 3,
        saves: 0,
        rating: 7.8,
        position: "MID",
        pace: 84,
        shooting: 75,
        passing: 88,
        dribbling: 82,
        defending: 71,
        physicality: 78
      };
    }

    // Double check ratings limit
    motmPlayer.rating = Math.max(1.0, Math.min(9.9, motmPlayer.rating));

    return {
      player: motmPlayer,
      highlight: serverMotm?.highlight || `An absolutely flawless masterclass by ${motmPlayer.name}. They dominated key duels, provided vital transition link-up play, and maintained complete tactical discipline.`
    };
  }, [simResult, events, isFinished]);

  if (!isFinished || !motmData) return null;

  const { player, highlight } = motmData;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Award className="w-4 h-4 text-amber-500 animate-bounce" />
        <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-[0.2em]">Official Man of the Match</h4>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-b from-[#131b2e] to-[#080d1a] border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
      >
        {/* Fut Card Light Effect */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Diagonal Golden Stripes */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#f59e0b_25%,transparent_25%,transparent_50%,#f59e0b_50%,#f59e0b_75%,transparent_75%,transparent)] bg-[size:40px_40px] pointer-events-none" />

        <div className="grid grid-cols-12 gap-6 relative z-10 items-center">
          
          {/* Left Column: Golden FUT-style Player Card badge */}
          <div className="col-span-12 sm:col-span-5 flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 8 }}
              className="w-36 h-52 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 p-[2px] rounded-[24px] shadow-[0_10px_30px_rgba(245,158,11,0.2)] relative overflow-hidden cursor-pointer group"
              style={{ perspective: 1000 }}
            >
              {/* Card Face container */}
              <div className="w-full h-full bg-[#0d1222] rounded-[22px] p-3 flex flex-col justify-between text-amber-400 relative overflow-hidden">
                {/* Gloss effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                
                {/* Rating & Position section */}
                <div className="flex justify-between items-start pt-2 px-1">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black font-mono tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">
                      {player.rating.toFixed(1)}
                    </span>
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-500 leading-none mt-1">
                      {player.position}
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-amber-500/20">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                {/* Center Silhouette with glowing ring */}
                <div className="flex-grow flex items-center justify-center relative mt-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/10 flex items-center justify-center">
                    <User className="w-9 h-9 text-amber-300/40 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {player.goals > 0 && (
                    <span className="absolute bottom-0 right-3 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none flex items-center gap-0.5 shadow-lg">
                      ⚽ {player.goals}
                    </span>
                  )}
                </div>

                {/* Player Name & Team */}
                <div className="text-center pb-2">
                  <h5 className="text-[13px] font-black uppercase tracking-tight truncate px-1 text-white leading-none">
                    {player.name}
                  </h5>
                  <p className="text-[8px] font-mono font-black text-amber-500/70 uppercase tracking-widest truncate leading-none mt-1">
                    {player.team}
                  </p>
                </div>

                {/* Minimalist 6 stats grid at the bottom */}
                <div className="border-t border-amber-500/20 pt-1.5 grid grid-cols-6 gap-x-0.5 text-center text-[7px] font-mono text-slate-400">
                  <div>
                    <div className="font-bold text-amber-300">{player.pace}</div>
                    <div>PAC</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">{player.shooting}</div>
                    <div>SHO</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">{player.passing}</div>
                    <div>PAS</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">{player.dribbling}</div>
                    <div>DRI</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">{player.defending}</div>
                    <div>DEF</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-300">{player.physicality}</div>
                    <div>PHY</div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Right Column: Key performance metrics & stats list */}
          <div className="col-span-12 sm:col-span-7 space-y-4">
            <div>
              <span className="text-[8px] font-mono text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                TACTICAL MVP PERFORMANCE
              </span>
              <h4 className="text-xl font-black text-white italic uppercase tracking-tight mt-2 leading-none">
                {player.name}
              </h4>
              <p className="text-[10px] font-mono text-slate-500 font-bold uppercase mt-1">
                Representing {player.team}
              </p>
            </div>

            {/* Performance Stats bars */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-widest">Goals Scored</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-amber-400 font-mono">{player.goals}</span>
                  <span className="text-[9px] font-mono text-slate-400">goals</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-widest">Shots on Target</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-white font-mono">{player.shotsOnTarget}</span>
                  <span className="text-[9px] font-mono text-slate-400">shots</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-widest">Pass Accuracy</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-white font-mono">{player.passAccuracy}%</span>
                  <span className="text-[8px] font-mono text-emerald-500 font-bold">({player.passes} passes)</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                <span className="text-[8px] font-mono text-slate-500 font-black uppercase tracking-widest">Tackles Won</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-white font-mono">{player.tackles}</span>
                  <span className="text-[9px] font-mono text-slate-400">tackles</span>
                </div>
              </div>
            </div>

            {/* Coach Highlight Quotes */}
            <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-1 right-2 text-3xl font-serif text-amber-500/10 select-none">“</div>
              <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic">
                {highlight}
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
