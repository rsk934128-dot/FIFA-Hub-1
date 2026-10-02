import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
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
  Loader2,
  X,
  Calendar,
  Sparkles,
  Filter,
  Check,
  ChevronRight,
  Target,
  Sliders,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'todo' | 'in-progress' | 'completed';

interface PresetMilestone {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  progress: number;
}

const PRESET_IDEAS: PresetMilestone[] = [
  {
    title: "Real-Time AI Tactical HUD",
    description: "Overlay live pitch telemetry, xG heatmaps, and passing lane disruption vectors during matches.",
    status: "in-progress",
    progress: 45
  },
  {
    title: "Automated VAR Simulation Engine",
    description: "Multi-angle volumetric trajectory recreation for contested offside and penalty decisions.",
    status: "todo",
    progress: 0
  },
  {
    title: "Global Scout Network & Talent Pool",
    description: "Decentralized player evaluation ratings with peer consensus and metric verification.",
    status: "todo",
    progress: 15
  },
  {
    title: "Dynamic Weather & Pitch Acoustics",
    description: "Integrate humidity, turf friction, and binaural crowd noise into simulation mechanics.",
    status: "todo",
    progress: 0
  }
];

export const ProjectRoadmap: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed'>('todo');
  const [progress, setProgress] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Real-time Listener
  useEffect(() => {
    const roadmapRef = collection(db, 'roadmap');
    const q = query(roadmapRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Milestone[];
        
        setMilestones(data);
        setLoading(false);

        // Seed initial data if empty on first load
        if (data.length === 0 && !snapshot.metadata.hasPendingWrites) {
          seedInitialData();
        }
      },
      (err) => {
        console.error("Error fetching roadmap:", err);
        setError("Failed to load roadmap data. Please verify Firestore connectivity.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update order default whenever milestone count changes
  useEffect(() => {
    if (milestones.length > 0) {
      const maxOrder = Math.max(...milestones.map(m => m.order || 0), 0);
      setOrder(maxOrder + 1);
    } else {
      setOrder(1);
    }
  }, [milestones]);

  const seedInitialData = async () => {
    const initialMilestones = [
      {
        title: "Beta Launch & Core Telemetry",
        description: "Initial platform deployment with match simulation and real-time news engines.",
        status: "completed",
        progress: 100,
        order: 1,
        dueDate: new Date(2026, 4, 15).toISOString()
      },
      {
        title: "Tactical Advisor AI Integration",
        description: "LLM-assisted opponent analysis, formation optimization, and squad comparisons.",
        status: "in-progress",
        progress: 75,
        order: 2,
        dueDate: new Date(2026, 6, 1).toISOString()
      },
      {
        title: "High-Frequency Scouting Feed",
        description: "Real-time positional tracking and player performance metrics across confederations.",
        status: "in-progress",
        progress: 35,
        order: 3,
        dueDate: new Date(2026, 8, 15).toISOString()
      },
      {
        title: "Decentralized TON Vault Integration",
        description: "Custodial smart wallet for player licensing, tournament entries, and match rewards.",
        status: "todo",
        progress: 10,
        order: 4,
        dueDate: new Date(2026, 10, 20).toISOString()
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

  const handleStatusChange = (newStatus: 'todo' | 'in-progress' | 'completed') => {
    setStatus(newStatus);
    if (newStatus === 'completed' && progress < 100) {
      setProgress(100);
    } else if (newStatus === 'todo' && progress === 100) {
      setProgress(0);
    } else if (newStatus === 'in-progress' && (progress === 0 || progress === 100)) {
      setProgress(50);
    }
  };

  const applyPreset = (preset: PresetMilestone) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setStatus(preset.status);
    setProgress(preset.progress);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setProgress(0);
    setDueDate('');
    const maxOrder = Math.max(...milestones.map(m => m.order || 0), 0);
    setOrder(maxOrder + 1);
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Milestone title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newMilestoneData: {
        title: string;
        description: string;
        status: 'todo' | 'in-progress' | 'completed';
        progress: number;
        order: number;
        dueDate?: string;
        createdAt: string;
      } = {
        title: title.trim(),
        description: description.trim(),
        status,
        progress: Number(progress),
        order: Number(order) || (milestones.length + 1),
        createdAt: new Date().toISOString()
      };

      if (dueDate) {
        newMilestoneData.dueDate = new Date(dueDate).toISOString();
      }

      await addDoc(collection(db, 'roadmap'), newMilestoneData);

      toast.success("Milestone added to roadmap successfully!");
      resetForm();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error("Failed to add milestone:", err);
      toast.error(err?.message || "Failed to add milestone to Firestore. Check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickProgressUpdate = async (milestone: Milestone, newProgress: number) => {
    try {
      const clamped = Math.max(0, Math.min(100, newProgress));
      let newStatus: 'todo' | 'in-progress' | 'completed' = milestone.status;
      if (clamped === 100) newStatus = 'completed';
      else if (clamped > 0) newStatus = 'in-progress';
      else newStatus = 'todo';

      const milestoneDocRef = doc(db, 'roadmap', milestone.id);
      await updateDoc(milestoneDocRef, {
        progress: clamped,
        status: newStatus
      });
      toast.success(`Updated "${milestone.title}" to ${clamped}%`);
    } catch (err: any) {
      console.error("Error updating progress:", err);
      toast.error("Could not update progress in Firestore.");
    }
  };

  const getStatusIcon = (st: Milestone['status']) => {
    switch (st) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-sky-400 animate-pulse" />;
      default: return <Circle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusBadge = (st: Milestone['status']) => {
    switch (st) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in-progress': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  // Metrics
  const totalCount = milestones.length;
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const inProgressCount = milestones.filter(m => m.status === 'in-progress').length;
  const todoCount = milestones.filter(m => m.status === 'todo').length;

  const totalProgress = totalCount > 0 
    ? Math.round(milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / totalCount)
    : 0;

  // Filtered milestones
  const filteredMilestones = milestones.filter(m => {
    const matchesFilter = activeFilter === 'all' || m.status === activeFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] min-h-[450px] text-zinc-400">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-400 absolute -top-2 -right-2" />
        </div>
        <p className="font-mono text-xs tracking-widest mt-4 uppercase text-zinc-300">Synchronizing Roadmap Feed...</p>
        <p className="text-[11px] text-zinc-500 mt-1">Connecting to Firestore telemetry</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#07090e] text-zinc-100 overflow-x-hidden">
      {/* Header Banner */}
      <div className="p-6 lg:p-8 border-b border-white/10 bg-gradient-to-b from-blue-950/20 via-black/40 to-transparent">
        {/* Futuristic Stadium Concept Banner */}
        <div className="max-w-7xl mx-auto mb-6 relative h-40 sm:h-52 w-full rounded-3xl overflow-hidden border border-blue-500/20 group shadow-2xl">
          <img 
            src="/src/assets/images/roadmap_futuristic_stadium_1790958963282.jpg" 
            alt="Next-Gen Smart Stadium Architecture" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/60 to-transparent" />
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-[10px] tracking-wider uppercase font-bold w-fit mb-2 backdrop-blur-md">
              <TrendingUp className="w-3 h-3" />
              FIFAHub Architecture Evolution
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic drop-shadow-md">
              Next-Gen Stadium & Platform Evolution
            </h2>
            <p className="text-zinc-300 text-xs sm:text-sm mt-1 leading-relaxed drop-shadow line-clamp-2">
              Architecting spatial acoustics, AI vision analysis, and decentralized player vaults for the 2026 World Cup ecosystem.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs tracking-wider uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              FIFAHub Ecosystem Matrix
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              Strategic Product Roadmap
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Track tactical development milestones, suggest future AI modules, and synchronize real-time release cycles directly with Firestore.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Completion Gauge Widget */}
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
              <div className="text-right">
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Overall Maturity</div>
                <div className="text-3xl font-black text-white tabular-nums tracking-tight">{totalProgress}%</div>
                <div className="text-[10px] text-zinc-500 font-mono">{completedCount}/{totalCount} Complete</div>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white/5 flex items-center justify-center relative flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="23"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={144.5}
                    initial={{ strokeDashoffset: 144.5 }}
                    animate={{ strokeDashoffset: 144.5 - (144.5 * totalProgress) / 100 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="text-blue-500"
                  />
                </svg>
                <Flag className="w-4 h-4 text-blue-400 absolute" />
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`flex items-center gap-2.5 px-5 py-4 rounded-xl font-bold text-sm transition-all shadow-xl ${
                isFormOpen
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isFormOpen ? (
                <>
                  <X className="w-4 h-4" />
                  Close Creator
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Add New Milestone
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Total Initiatives</span>
            <div className="text-xl font-bold text-white mt-0.5">{totalCount}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-sky-400">In Active Build</span>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{inProgressCount}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-emerald-400">Deployed & Live</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedCount}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Queued in Backlog</span>
            <div className="text-xl font-bold text-zinc-400 mt-0.5">{todoCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Interactive Add Milestone Form Modal/Drawer */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-b from-[#121624] to-[#0d101a] border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative">
                {/* Glow Accent */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        Create Roadmap Milestone
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-widest border border-blue-500/30">
                          Direct Firestore Write
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Append a high-priority tactical objective to the live distributed roadmap.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Presets Carousel */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Prefill Blueprints
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {PRESET_IDEAS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-blue-500/40 transition-all group"
                      >
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {preset.title}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span className="uppercase">{preset.status}</span>
                          <span className="text-blue-400 font-bold">{preset.progress}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* The Interactive Form */}
                <form onSubmit={handleSubmitMilestone} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Core Data */}
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5 font-bold">
                          Milestone Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={200}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Real-Time Scouting Video Highlights"
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
                          <span>Concise, action-oriented milestone name</span>
                          <span>{title.length}/200</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5 font-bold">
                          Technical & Tactical Description
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detail feature deliverables, models used, and user benefits..."
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Right Column: Execution Controls */}
                    <div className="space-y-5 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                      {/* Status Selection */}
                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-300 mb-2 font-bold">
                          Target Lifecycle Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange('todo')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                              status === 'todo'
                                ? 'bg-zinc-800 border-zinc-400 text-white shadow-lg'
                                : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5'
                            }`}
                          >
                            <Circle className="w-4 h-4 mb-1 text-zinc-400" />
                            Planned
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange('in-progress')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                              status === 'in-progress'
                                ? 'bg-sky-950/50 border-sky-400 text-sky-300 shadow-lg shadow-sky-900/20'
                                : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5'
                            }`}
                          >
                            <Clock className="w-4 h-4 mb-1 text-sky-400" />
                            In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange('completed')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                              status === 'completed'
                                ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-900/20'
                                : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-400" />
                            Completed
                          </button>
                        </div>
                      </div>

                      {/* Progress Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-blue-400" />
                            Completion Percentage
                          </label>
                          <span className="font-mono text-sm font-bold text-blue-400 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progress}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setProgress(val);
                            if (val === 100 && status !== 'completed') setStatus('completed');
                            else if (val > 0 && val < 100 && status === 'todo') setStatus('in-progress');
                          }}
                          className="w-full accent-blue-500 h-2 bg-black/60 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2">
                          {[0, 25, 50, 75, 100].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setProgress(pct);
                                if (pct === 100) setStatus('completed');
                                else if (pct > 0) setStatus('in-progress');
                                else setStatus('todo');
                              }}
                              className={`px-2 py-0.5 rounded hover:bg-white/10 ${progress === pct ? 'text-blue-400 font-bold underline' : ''}`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Due Date & Execution Order */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5 font-bold">
                            Target Release Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5 font-bold">
                            Execution Order #
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={order}
                            onChange={(e) => setOrder(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Action Controls */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !title.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing to Firestore...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          Publish Milestone
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'in-progress', 'todo', 'completed'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all ${
                  activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'all' ? 'All Milestones' : tab.replace('-', ' ')}
                <span className="ml-1.5 text-[10px] opacity-70 font-mono">
                  {tab === 'all' 
                    ? totalCount 
                    : milestones.filter(m => m.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestone..."
              className="w-full px-3.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Timeline Visualizer */}
        <div className="space-y-6">
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl p-8">
              <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-300">No milestones matching criteria</h3>
              <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
                No items found for the current filter. Click "Add New Milestone" above to schedule a strategic goal.
              </p>
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                  setIsFormOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Open Creator
              </button>
            </div>
          ) : (
            <div className="relative pl-2 sm:pl-4">
              <AnimatePresence mode="popLayout">
                {filteredMilestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex gap-4 sm:gap-6 mb-8 last:mb-0"
                  >
                    {/* Continuous Vertical Timeline Track */}
                    {index !== filteredMilestones.length - 1 && (
                      <div className="absolute left-[20px] top-12 bottom-[-32px] w-0.5 bg-gradient-to-b from-white/15 via-white/5 to-transparent" />
                    )}

                    {/* Order & Status Orb */}
                    <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-2xl bg-[#0e121d] border border-white/15 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      {getStatusIcon(milestone.status)}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 sm:p-6 transition-all shadow-lg backdrop-blur-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                              #{milestone.order}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                              {milestone.title}
                            </h3>
                          </div>
                          {milestone.description && (
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                              {milestone.description}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusBadge(milestone.status)}`}>
                          {milestone.status.replace('-', ' ')}
                        </div>
                      </div>

                      {/* Progress Bar & Interactive Quick-Nudge */}
                      <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-mono uppercase tracking-wider text-[11px]">Execution Level</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono font-bold text-sm tabular-nums">
                              {milestone.progress}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar with glow */}
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${milestone.progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full transition-all ${
                              milestone.status === 'completed' 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                          />
                        </div>

                        {/* Bottom Row: Target Date & Quick Status Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
                          <div className="flex items-center gap-4">
                            {milestone.dueDate && (
                              <div className="flex items-center gap-1.5 text-zinc-400">
                                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Target: {new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Progress Nudge Buttons */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-500 mr-1">Quick Nudge:</span>
                            {[
                              { label: '+25%', add: 25 },
                              { label: 'Done', set: 100 }
                            ].map((btn, bidx) => (
                              <button
                                key={bidx}
                                onClick={() => {
                                  if (btn.set !== undefined) {
                                    handleQuickProgressUpdate(milestone, btn.set);
                                  } else if (btn.add !== undefined) {
                                    handleQuickProgressUpdate(milestone, (milestone.progress || 0) + btn.add);
                                  }
                                }}
                                disabled={milestone.progress === 100 && btn.set === 100}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 rounded text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom CTA to add another milestone */}
        {!isFormOpen && (
          <div className="pt-6 pb-12 flex justify-center">
            <button
              onClick={() => {
                setIsFormOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-2xl text-zinc-400 hover:text-white transition-all text-sm font-medium group shadow-lg"
            >
              <Plus className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Another Milestone to Firestore</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
