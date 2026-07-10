import React, { useState } from 'react';
import { Play, Tv, Sparkles, Clock, Share2, Download, Maximize2, Shield, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Highlight {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  matchDate: string;
  teams: {
    home: string;
    away: string;
    score: string;
  };
  aiTags: string[];
}

const MOCK_HIGHLIGHTS: Highlight[] = [
  {
    id: 'h1',
    title: 'Elite Tactical Breakdown',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    duration: '2:15',
    matchDate: '2026-07-08',
    teams: { home: 'Argentina', away: 'France', score: '3 - 3' },
    aiTags: ['Counter-Attack', 'High Press', 'Overlap']
  },
  {
    id: 'h2',
    title: 'Strategic Defensive Shape',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '1:45',
    matchDate: '2026-07-07',
    teams: { home: 'England', away: 'Germany', score: '1 - 0' },
    aiTags: ['Low Block', 'Zonal Marking']
  },
  {
    id: 'h3',
    title: 'Midfield Transition Engine',
    thumbnail: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2000&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:20',
    matchDate: '2026-07-06',
    teams: { home: 'Spain', away: 'Brazil', score: '2 - 2' },
    aiTags: ['Possession', 'Triangles', 'Switch']
  },
  {
    id: 'h4',
    title: 'Set Piece Execution',
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83d66b1ad12?q=80&w=2000&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '1:10',
    matchDate: '2026-07-05',
    teams: { home: 'Japan', away: 'Morocco', score: '0 - 1' },
    aiTags: ['Corner Kick', 'Heading']
  }
];

export const VeoHighlights: React.FC = () => {
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Player Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black border border-white/10 shadow-2xl group">
            {selectedHighlight ? (
              <iframe
                src={selectedHighlight.videoUrl}
                className="w-full h-full"
                allowFullScreen
                title={selectedHighlight.title}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Play className="w-10 h-10 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">SELECT A REPLAY UNIT</h3>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">AI-GENERATED VEO SUMMARIES READY FOR ANALYSIS</p>
              </div>
            )}
            
            {/* VEO Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono font-black text-white uppercase tracking-widest italic">VEO INTELLIGENCE LIVE</span>
            </div>
          </div>

          {selectedHighlight && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedHighlight.title}</h2>
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[9px] font-mono font-black uppercase">VEO AI</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {selectedHighlight.duration}</span>
                    <span className="flex items-center gap-1.5"><Tv className="w-3 h-3" /> {selectedHighlight.teams.home} VS {selectedHighlight.teams.away}</span>
                    <span className="flex items-center gap-1.5 font-black text-amber-500/80">{selectedHighlight.teams.score}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-mono text-[10px] font-black uppercase italic transition-all hover:bg-amber-600 cursor-pointer shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                    Full Analytics
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">AI TAGGED MOMENTS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedHighlight.aiTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg text-[9px] font-mono text-slate-300 uppercase tracking-tighter hover:border-amber-500/30 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar List Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
            <h3 className="text-sm font-black text-white uppercase italic tracking-wider mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              HIGHLIGHT FEED
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {MOCK_HIGHLIGHTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHighlight(h)}
                  className={`w-full text-left group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                    selectedHighlight?.id === h.id 
                      ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' 
                      : 'bg-black/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex gap-4 p-3">
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={h.thumbnail} alt={h.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-white/20" />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] font-mono text-white">
                        {h.duration}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-1 py-1">
                      <h4 className={`text-[11px] font-black uppercase italic leading-tight tracking-tight transition-colors ${
                        selectedHighlight?.id === h.id ? 'text-amber-500' : 'text-zinc-100 group-hover:text-amber-400'
                      }`}>
                        {h.title}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{h.teams.home} v {h.teams.away}</p>
                      <div className="flex gap-1 mt-1">
                        {h.aiTags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[7px] px-1 py-0.5 bg-white/5 rounded text-slate-400 font-mono uppercase italic">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h4 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">MATCH INTELLIGENCE</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                    <span>Tactical Adherence</span>
                    <span className="text-amber-500">88%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-amber-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                    <span>Decision Quality</span>
                    <span className="text-emerald-500">92%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
