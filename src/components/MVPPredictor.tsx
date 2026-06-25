import React, { useState, useEffect } from "react";
import { Star, Award, Sparkles, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MatchEvent } from "../types";

interface MVPResult {
  player: string;
  team: string;
  reasoning: string;
  rating: number;
}

interface MVPPredictorProps {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  events: MatchEvent[];
  isFinished: boolean;
}

export default function MVPPredictor({ teamA, teamB, scoreA, scoreB, events, isFinished }: MVPPredictorProps) {
  const [prediction, setPrediction] = useState<MVPResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = async () => {
    if (!isFinished) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mvp-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB, scoreA, scoreB, events }),
      });

      if (!response.ok) throw new Error("Failed to get AI prediction");
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
      setError("AI Analysis unavailable. Defaulting to system results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFinished && !prediction && !loading) {
      getPrediction();
    }
  }, [isFinished]);

  if (!isFinished) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <h4 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.2em]">Nexus AI Verdict</h4>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 border-dashed"
          >
            <div className="relative">
              <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
            </div>
            <p className="text-[10px] font-mono text-slate-400 font-bold uppercase animate-pulse">Analyzing match telemetry...</p>
          </motion.div>
        ) : prediction ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-black relative overflow-hidden group shadow-2xl shadow-amber-500/10"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Award className="w-32 h-32" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-black/10 border border-black/10 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em]">Match Excellence Award</span>
              </div>
              
              <div className="flex items-start gap-5 mb-6">
                <div className="w-20 h-20 bg-black rounded-2xl border-2 border-white/20 flex items-center justify-center shrink-0">
                  <User className="w-10 h-10 text-white/40" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{prediction.player}</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{prediction.team}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <div className="bg-black text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black font-mono">
                      RATING: {prediction.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/10 border border-black/5 rounded-2xl p-4">
                <p className="text-xs font-bold leading-relaxed text-black/80">
                  "{prediction.reasoning}"
                </p>
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-mono text-red-500 font-bold uppercase">{error}</p>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
