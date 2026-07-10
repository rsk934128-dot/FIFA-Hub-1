import React from 'react';
import { motion } from 'motion/react';
import { Activity, Circle } from 'lucide-react';

interface LiveScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  time: string;
  league: string;
  status: 'live' | 'finished';
}

const mockScores: LiveScore[] = [
  { id: '1', homeTeam: 'ARS', awayTeam: 'MCI', homeScore: 2, awayScore: 1, time: "78'", league: 'EPL', status: 'live' },
  { id: '2', homeTeam: 'RMA', awayTeam: 'BAR', homeScore: 0, awayScore: 0, time: "12'", league: 'LALIGA', status: 'live' },
  { id: '3', homeTeam: 'BAY', awayTeam: 'DOR', homeScore: 3, awayScore: 1, time: "FT", league: 'BUNDESLIGA', status: 'finished' },
  { id: '4', homeTeam: 'PSG', awayTeam: 'OL', homeScore: 1, awayScore: 2, time: "65'", league: 'LIGUE 1', status: 'live' },
  { id: '5', homeTeam: 'INT', awayTeam: 'ACM', homeScore: 0, awayScore: 0, time: "34'", league: 'SERIE A', status: 'live' },
  { id: '6', homeTeam: 'LIV', awayTeam: 'CHE', homeScore: 2, awayScore: 2, time: "89'", league: 'EPL', status: 'live' },
  { id: '7', homeTeam: 'JUV', awayTeam: 'NAP', homeScore: 1, awayScore: 0, time: "HT", league: 'SERIE A', status: 'live' },
];

export const LiveScoresMarquee: React.FC = () => {
  // Triple the items to ensure a seamless loop
  const marqueeItems = [...mockScores, ...mockScores, ...mockScores];

  return (
    <div className="w-full bg-amber-500/5 border-b border-white/5 py-2 overflow-hidden flex items-center relative z-30 group">
      {/* Label Panel */}
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-amber-500 flex items-center gap-2 z-40 shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
        <Activity className="w-3 h-3 text-black animate-pulse" />
        <span className="text-[10px] font-black text-black tracking-tighter uppercase italic">LIVE SCORES</span>
      </div>

      {/* Scrolling Content */}
      <motion.div 
        className="flex items-center gap-8 whitespace-nowrap pl-32"
        animate={{ x: [0, -1035] }} // Adjust based on content width
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear",
          repeatType: "loop"
        }}
      >
        {marqueeItems.map((score, idx) => (
          <div 
            key={`${score.id}-${idx}`}
            className="flex items-center gap-4 group/score"
          >
            {/* League Tag */}
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{score.league}</span>
            
            {/* Score Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">{score.homeTeam}</span>
                <span className="text-sm font-black text-amber-500 font-mono">{score.homeScore}</span>
              </div>
              
              <span className="text-zinc-700 font-bold">-</span>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-500 font-mono">{score.awayScore}</span>
                <span className="text-xs font-bold text-white tracking-tight">{score.awayTeam}</span>
              </div>
            </div>

            {/* Time / Status Indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
              score.status === 'live' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-zinc-500/10 border-white/5 text-zinc-500'
            }`}>
              {score.status === 'live' && (
                <Circle className="w-1.5 h-1.5 fill-current animate-pulse" />
              )}
              <span className="text-[9px] font-black font-mono tracking-tighter italic">
                {score.time}
              </span>
            </div>

            {/* Separator Dot */}
            <div className="w-1 h-1 rounded-full bg-white/10 mx-2" />
          </div>
        ))}
      </motion.div>

      {/* Faded edges */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050811] to-transparent z-10 pointer-events-none" />
    </div>
  );
};
