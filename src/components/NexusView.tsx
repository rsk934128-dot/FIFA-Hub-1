import React, { useState } from "react";
import { motion } from "motion/react";
import { Globe, RefreshCw, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export default function NexusView() {
  const [loading, setLoading] = useState(true);
  const targetUrl = "https://noor-nexus-omega.vercel.app/";

  return (
    <div id="nexus-view" className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              <Globe className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-mono text-amber-500 font-black uppercase tracking-[0.3em]">External Integration</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Noor Nexus <span className="text-slate-700">Omega</span></h2>
          <p className="text-slate-400 font-medium max-w-xl mt-2">
            Accessing the global ecosystem portal. Secure tunnel established to regional data hubs.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-mono text-slate-300 font-black uppercase tracking-widest">Tunnel Secure</span>
          </div>
          <a 
            href={targetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group"
          >
            <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="relative group px-2">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-rose-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#050811] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl h-[75vh]">
          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono text-slate-500 font-black tracking-widest">
                <Zap className="w-3 h-3" />
                EDGE NODE: SINGAPORE-01
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 max-w-md w-full sm:w-auto">
              <Globe className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] font-mono text-slate-400 truncate">{targetUrl}</span>
            </div>

            <button 
              onClick={() => {
                setLoading(true);
                const iframe = document.getElementById('nexus-iframe') as HTMLIFrameElement;
                if (iframe) iframe.src = targetUrl;
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050811]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent"
                ></motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-amber-500/50" />
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Establishing Nexus Handshake...</p>
            </div>
          )}

          {/* The Iframe */}
          <iframe 
            id="nexus-iframe"
            src={targetUrl}
            className="w-full h-full pt-12"
            onLoad={() => setLoading(false)}
            title="Noor Nexus Integration"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-12">
        {[
          { label: "Sync Fidelity", val: "99.9%", status: "Nominal" },
          { label: "Bridge Latency", val: "24ms", status: "Low" },
          { label: "Data Throughput", val: "1.2 GB/S", status: "Active" },
          { label: "Encryption", val: "AES-256", status: "Enabled" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-white italic">{stat.val}</span>
              <span className="text-[8px] font-mono text-emerald-500 font-black uppercase">{stat.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
