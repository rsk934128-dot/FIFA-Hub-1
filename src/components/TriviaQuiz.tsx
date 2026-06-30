import React, { useState, useEffect } from "react";
import { QuizQuestion } from "../types";
import { Brain, Trophy, ChevronRight, CheckCircle2, XCircle, RefreshCw, Sparkles, AlertCircle, Activity, Medal } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from "./FirebaseProvider";
import { handleFirestoreError, OperationType } from "../lib/firebaseUtils";

export default function TriviaQuiz() {
  const { user } = useFirebase();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Game states
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch Leaderboard
  useEffect(() => {
    const q = query(
      collection(db, "high_scores"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setLeaderboard(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "high_scores");
    });

    return () => unsubscribe();
  }, []);

  // Update High Score
  useEffect(() => {
    if (!user || score <= 0) return;

    const updateHighScore = async () => {
      const scoreRef = doc(db, "high_scores", user.uid);
      try {
        const snap = await getDoc(scoreRef);
        if (!snap.exists() || snap.data().score < score) {
          await setDoc(scoreRef, {
            userId: user.uid,
            displayName: user.displayName || 'Anonymous',
            score: score,
            timestamp: serverTimestamp()
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "high_scores");
      }
    };

    updateHighScore();
  }, [score, user]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedIdx(null);
      setIsAnswered(false);

      const response = await fetch("/api/quiz-question");
      if (!response.ok) {
        throw new Error("Failed to load question.");
      }
      const data = await response.json();
      setQuestion(data);
    } catch (err) {
      setError("Unable to generate fresh quiz question. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleSelectAnswer = (idx: number) => {
    if (isAnswered || !question) return;
    
    setSelectedIdx(idx);
    setIsAnswered(true);

    if (idx === question.correctIndex) {
      setScore((prev) => prev + 100 + (streak * 20)); // Base 100 + streak bonuses!
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  return (
    <div id="trivia-quiz-module" className="max-w-2xl mx-auto space-y-6">
      
      {/* Quiz Header info */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Trivia Arena</h2>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">POWERED BY GEMINI CREATORS</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 items-center font-mono font-bold">
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">SCORE</span>
            <span className="text-sm text-white">{score} PTS</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">STREAK</span>
            <span className="text-sm text-amber-400">X{streak}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-24 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-mono text-amber-400 font-bold tracking-widest uppercase">DRAFTING TRIVIA SCRIPTS...</p>
        </div>
      ) : error || !question ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3 backdrop-blur-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wider">Trivia Interrupted</h3>
          <p className="text-xs text-slate-400">
            We had difficulty communicating with our trivia generator. Click the button below to retry.
          </p>
          <button
            onClick={fetchQuestion}
            className="bg-white hover:bg-amber-400 text-black font-bold text-[10px] font-mono py-2 px-5 rounded-full tracking-wider transition-colors cursor-pointer shadow-md shadow-white/5"
          >
            RE-LOAD QUIZ
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
          {/* Top category label */}
          <div className="absolute top-0 left-0 right-0 p-3 bg-black/20 border-b border-white/5 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
            <span>CATEGORY: <strong className="text-slate-300">{question.category.toUpperCase()}</strong></span>
            <span className="flex items-center gap-1 text-slate-400 uppercase tracking-widest">
              {question.engine === 'gemini' ? (
                <>
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                  Dynamic
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-slate-500" />
                  Banked
                </>
              )}
            </span>
          </div>

          {/* Question Title */}
          <div className="pt-6">
            <h3 className="text-base md:text-lg font-black text-white leading-relaxed font-sans uppercase italic">
              {question.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = question.correctIndex === idx;

              let btnStyle = "bg-black/20 border-white/10 text-slate-300 hover:border-amber-500/50 hover:bg-white/[0.03]";
              let icon = null;

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-amber-500/10 border-amber-500/50 text-amber-400 font-bold";
                  icon = <CheckCircle2 className="w-4 h-4 text-amber-400" />;
                } else if (isSelected) {
                  btnStyle = "bg-rose-500/10 border-rose-500/40 text-rose-400 font-semibold";
                  icon = <XCircle className="w-4 h-4 text-rose-400" />;
                } else {
                  btnStyle = "bg-black/10 border-white/5 text-slate-600 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex justify-between items-center relative ${
                    !isAnswered ? "cursor-pointer" : ""
                  } ${btnStyle}`}
                >
                  <span className="pr-4 font-semibold">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Detailed explanation area (shows once answered) */}
          {isAnswered && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 animate-fade-in">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Historical Insight
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Next match controls */}
          {isAnswered && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={fetchQuestion}
                className="bg-white hover:bg-amber-400 text-black font-bold text-[10px] font-mono py-2.5 px-6 rounded-full tracking-wider transition-all cursor-pointer flex items-center gap-1 uppercase shadow-md shadow-white/5"
              >
                NEXT CHALLENGE
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}

      {leaderboard.length > 0 && <Leaderboard data={leaderboard} />}

    </div>
  );
}

function Leaderboard({ data }: { data: any[] }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Medal className="w-4 h-4 text-amber-500" />
        <h3 className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-widest">Global Top Scorers</h3>
      </div>
      <div className="space-y-2">
        {data.map((entry, i) => (
          <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono font-black ${i === 0 ? 'text-amber-500' : 'text-slate-500'}`}>0{i + 1}</span>
              <span className="text-xs font-bold text-slate-300">{entry.displayName}</span>
            </div>
            <span className="text-xs font-mono font-black text-amber-400">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
