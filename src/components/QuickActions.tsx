import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Brain, Layout, Zap, X, ChevronRight, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickActionsProps {
  onNavigate: (view: any) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const actions = [
    { 
      id: 'browser', 
      label: 'Google Mini Browser', 
      icon: Globe, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      description: 'Live real matches & telemetry'
    },
    { 
      id: 'scout', 
      label: 'New Scouting Report', 
      icon: Search, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      description: 'Analyze new player profiles'
    },
    { 
      id: 'quiz', 
      label: 'Start Tactical Quiz', 
      icon: Brain, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      description: 'Test your football IQ'
    },
    { 
      id: 'advisor', 
      label: 'Tactical Advisor', 
      icon: Zap, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      description: 'AI-powered match strategies'
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 md:bottom-20 right-0 w-72 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <div className="px-4 py-2 mb-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] font-black">Quick Tactical Actions</h3>
              </div>

              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onNavigate(action.id as any);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 md:p-4 rounded-2xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-white/5 cursor-pointer"
                >
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${action.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-4 h-4 md:w-5 md:h-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white uppercase italic tracking-tight truncate">{action.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 truncate">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle quick actions"
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group relative cursor-pointer ${
          isOpen ? 'bg-zinc-800 rotate-45' : 'bg-amber-500 hover:bg-amber-400 hover:scale-105'
        }`}
      >
        <div className={`absolute inset-0 rounded-full bg-amber-500/20 animate-ping ${isOpen ? 'hidden' : 'block'}`} />
        <Plus className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${isOpen ? 'text-white' : 'text-black'}`} />
      </button>
    </div>
  );
};
