import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Milestone } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Loader2
} from 'lucide-react';

export const ProjectRoadmap: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roadmapRef = collection(db, 'roadmap');
    const q = query(roadmapRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Milestone[];
        
        setMilestones(data);
        setLoading(false);

        // Seed initial data if empty
        if (data.length === 0 && loading) {
          seedInitialData();
        }
      },
      (err) => {
        console.error("Error fetching roadmap:", err);
        setError("Failed to load roadmap data. Please check your Firestore connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const seedInitialData = async () => {
    const initialMilestones = [
      {
        title: "Beta Launch",
        description: "Public beta release with core features",
        status: "completed",
        progress: 100,
        order: 1,
        dueDate: new Date(2026, 5, 15).toISOString()
      },
      {
        title: "Tactical Advisor AI",
        description: "Integration of advanced scouting models",
        status: "in-progress",
        progress: 75,
        order: 2,
        dueDate: new Date(2026, 7, 1).toISOString()
      },
      {
        title: "Mobile App Release",
        description: "Native iOS and Android versions",
        status: "todo",
        progress: 0,
        order: 3,
        dueDate: new Date(2026, 9, 10).toISOString()
      },
      {
        title: "Global Expansion",
        description: "Multi-language support and regional servers",
        status: "todo",
        progress: 0,
        order: 4,
        dueDate: new Date(2026, 11, 20).toISOString()
      }
    ];

    try {
      for (const m of initialMilestones) {
        await addDoc(collection(db, 'roadmap'), m);
      }
    } catch (err) {
      console.error("Error seeding roadmap:", err);
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const totalProgress = milestones.length > 0 
    ? Math.round(milestones.reduce((acc, m) => acc + m.progress, 0) / milestones.length)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-mono text-sm">LOADING ROADMAP ENGINE...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs tracking-widest uppercase">
              <TrendingUp className="w-4 h-4" />
              Strategic Roadmap
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Project Evolution</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Track the development milestones and strategic growth of the FIFAHub ecosystem.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-right">
                <div className="text-xs text-gray-500 font-mono uppercase tracking-tighter">Overall Completion</div>
                <div className="text-2xl font-bold text-white tabular-nums">{totalProgress}%</div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={175.92}
                    initial={{ strokeDashoffset: 175.92 }}
                    animate={{ strokeDashoffset: 175.92 - (175.92 * totalProgress) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-blue-500"
                  />
                </svg>
                <Flag className="w-5 h-5 text-blue-400 absolute" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <div className="max-w-5xl mx-auto space-y-12 py-8">
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative flex gap-6"
                >
                  {/* Timeline Line */}
                  {index !== milestones.length - 1 && (
                    <div className="absolute left-[22px] top-12 bottom-[-24px] w-0.5 bg-gradient-to-b from-white/10 to-transparent" />
                  )}

                  {/* Status Icon */}
                  <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    {getStatusIcon(milestone.status)}
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all hover:border-white/20">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(milestone.status)}`}>
                        {milestone.status.replace('-', ' ')}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-mono uppercase tracking-tighter">Progress</span>
                          <span className="text-blue-400 font-bold tabular-nums">{milestone.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${milestone.progress}%` }}
                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                            className={`h-full rounded-full ${
                              milestone.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>

                      {milestone.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Target Date: {new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-12 flex justify-center">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-sm font-medium group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Suggest Future Milestone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
