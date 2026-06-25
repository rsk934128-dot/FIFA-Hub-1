import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Activity, Zap, BarChart2, ShieldCheck } from "lucide-react";
import { CDNNode } from "../types";

interface StreamMetricsProps {
  selectedCDN: CDNNode;
  isActive: boolean;
}

export default function StreamMetrics({ selectedCDN, isActive }: StreamMetricsProps) {
  const [metrics, setMetrics] = useState({
    bitrate: "18.5 Mbps",
    packetLoss: "0.002%",
    jitter: "4.2ms",
    latency: selectedCDN.latency,
    nodeHealth: 99.2
  });

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Simulated fluctuations for a professional "live" feel
        const bitrateBase = 18.5;
        const bitrateJitter = Math.random() * 2 - 1;
        
        const loss = (Math.random() * 0.005).toFixed(4);
        const j = (Math.random() * 3 + 2).toFixed(1);
        const health = (99 + Math.random() * 0.8).toFixed(1);

        setMetrics({
          bitrate: `${(bitrateBase + bitrateJitter).toFixed(1)} Mbps`,
          packetLoss: `${loss}%`,
          jitter: `${j}ms`,
          latency: selectedCDN.latency,
          nodeHealth: parseFloat(health)
        });
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [isActive, selectedCDN]);

  if (!isActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-8 right-8 w-64 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 hidden md:block z-20 pointer-events-none"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-emerald-500 font-black tracking-[0.2em]">STREAM INTEL</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <Activity className="w-3 h-3 text-emerald-500" />
      </div>

      <div className="space-y-3">
        {[
          { label: "BITRATE", val: metrics.bitrate, icon: <Zap className="w-2.5 h-2.5" /> },
          { label: "PACKET LOSS", val: metrics.packetLoss, icon: <BarChart2 className="w-2.5 h-2.5" /> },
          { label: "JITTER", val: metrics.jitter, icon: <Activity className="w-2.5 h-2.5" /> },
          { label: "LATENCY", val: metrics.latency, icon: <ShieldCheck className="w-2.5 h-2.5" /> }
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center group">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 group-hover:text-emerald-500 transition-colors">{item.icon}</span>
              <span className="text-[8px] font-mono text-slate-500 font-black tracking-widest">{item.label}</span>
            </div>
            <span className="text-[9px] font-mono text-white font-black">{item.val}</span>
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
           <span className="text-[7px] font-mono text-emerald-500/50 font-bold uppercase tracking-widest">Nominal</span>
        </div>
      </div>
    </motion.div>
  );
}
