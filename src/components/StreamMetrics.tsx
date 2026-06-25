import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Zap, BarChart2, ShieldCheck, Settings, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { CDNNode } from "../types";

interface StreamMetricsProps {
  selectedCDN: CDNNode;
  isActive: boolean;
}

export default function StreamMetrics({ selectedCDN, isActive }: StreamMetricsProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [bitrateThreshold, setBitrateThreshold] = useState(5);
  const [latencyThreshold, setLatencyThreshold] = useState(100);

  const [metrics, setMetrics] = useState({
    bitrate: 18.5,
    packetLoss: "0.002%",
    jitter: "4.2ms",
    latency: parseInt(selectedCDN.latency) || 45,
    nodeHealth: 99.2
  });

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Simulated fluctuations for a professional "live" feel
        // Occasionally drop bitrate to test alerts
        const shouldDrop = Math.random() > 0.95;
        const bitrateBase = shouldDrop ? 4 : 18.5;
        const bitrateJitter = Math.random() * 2 - 1;
        
        const loss = (Math.random() * 0.005).toFixed(4);
        const j = (Math.random() * 3 + 2).toFixed(1);
        const health = (99 + Math.random() * 0.8).toFixed(1);
        const latBase = parseInt(selectedCDN.latency) || 45;
        const lat = latBase + (Math.random() > 0.98 ? 60 : Math.random() * 5);

        setMetrics({
          bitrate: parseFloat((bitrateBase + bitrateJitter).toFixed(1)),
          packetLoss: `${loss}%`,
          jitter: `${j}ms`,
          latency: Math.round(lat),
          nodeHealth: parseFloat(health)
        });
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [isActive, selectedCDN]);

  if (!isActive) return null;

  const isBitrateWarning = metrics.bitrate < bitrateThreshold;
  const isLatencyWarning = metrics.latency > latencyThreshold;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-8 right-8 w-64 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 hidden md:block z-50 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-emerald-500 font-black tracking-[0.2em]">STREAM INTEL</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isBitrateWarning || isLatencyWarning ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="p-1 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <Settings className={`w-3 h-3 ${showConfig ? 'text-emerald-500' : 'text-slate-500'} group-hover:rotate-45 transition-transform`} />
        </button>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4 space-y-3 bg-white/5 p-3 rounded-xl border border-white/5"
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[7px] font-mono text-slate-400 font-black uppercase">Min Bitrate (Mbps)</label>
                <span className="text-[7px] font-mono text-emerald-500 font-black">{bitrateThreshold}</span>
              </div>
              <input 
                type="range" min="1" max="25" step="0.5"
                value={bitrateThreshold}
                onChange={(e) => setBitrateThreshold(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[7px] font-mono text-slate-400 font-black uppercase">Max Latency (ms)</label>
                <span className="text-[7px] font-mono text-emerald-500 font-black">{latencyThreshold}</span>
              </div>
              <input 
                type="range" min="20" max="500" step="10"
                value={latencyThreshold}
                onChange={(e) => setLatencyThreshold(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {[
          { 
            label: "BITRATE", 
            val: `${metrics.bitrate} Mbps`, 
            icon: <Zap className="w-2.5 h-2.5" />,
            warning: isBitrateWarning 
          },
          { 
            label: "PACKET LOSS", 
            val: metrics.packetLoss, 
            icon: <BarChart2 className="w-2.5 h-2.5" /> 
          },
          { 
            label: "JITTER", 
            val: metrics.jitter, 
            icon: <Activity className="w-2.5 h-2.5" /> 
          },
          { 
            label: "LATENCY", 
            val: `${metrics.latency}ms`, 
            icon: <ShieldCheck className="w-2.5 h-2.5" />,
            warning: isLatencyWarning 
          }
        ].map((item, i) => (
          <div key={i} className={`flex justify-between items-center group p-1.5 rounded-lg transition-all ${item.warning ? 'bg-rose-500/10 border border-rose-500/20' : 'hover:bg-white/5'}`}>
            <div className="flex items-center gap-2">
              <span className={`${item.warning ? 'text-rose-500 animate-pulse' : 'text-slate-500 group-hover:text-emerald-500'} transition-colors`}>
                {item.warning ? <AlertTriangle className="w-2.5 h-2.5" /> : item.icon}
              </span>
              <span className={`text-[8px] font-mono font-black tracking-widest ${item.warning ? 'text-rose-500' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
            <span className={`text-[9px] font-mono font-black ${item.warning ? 'text-rose-500' : 'text-white'}`}>
              {item.val}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[8px] font-mono text-slate-500 font-black tracking-widest">NODE HEALTH</span>
          <span className="text-[8px] font-mono text-emerald-500 font-black">{metrics.nodeHealth}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${metrics.nodeHealth}%` }}
            className="h-full bg-emerald-500" 
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
           <span className="text-[7px] font-mono text-slate-600 font-bold uppercase tracking-widest">Region: {selectedCDN.region}</span>
           <span className={`text-[7px] font-mono font-bold uppercase tracking-widest ${isBitrateWarning || isLatencyWarning ? 'text-rose-500' : 'text-emerald-500/50'}`}>
             {isBitrateWarning || isLatencyWarning ? 'CRITICAL' : 'Nominal'}
           </span>
        </div>
      </div>
    </motion.div>
  );
}
