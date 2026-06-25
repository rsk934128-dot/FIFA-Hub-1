import React, { useState, useEffect } from "react";
import { Tv, Play, Users, Signal, Globe, Zap, ExternalLink, ShieldCheck, Server, Radio, BarChart2, Activity, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LiveChannel, CDNNode } from "../types";
import StreamMetrics from "./StreamMetrics";

const CHANNELS: LiveChannel[] = [
  {
    id: "ch-1",
    name: "FIFA WC CHANNEL 1",
    status: "LIVE",
    match: "SWITZERLAND vs CANADA",
    viewerCount: "1.2M",
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-in-the-stadium-91-large.mp4"
  },
  {
    id: "ch-2",
    name: "FIFA WC CHANNEL 2",
    status: "LIVE",
    match: "BOSNIA vs QATAR",
    viewerCount: "850K",
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-a-soccer-ball-entering-a-goal-at-night-42245-large.mp4"
  },
  {
    id: "ch-3",
    name: "FIFA WC CHANNEL 3",
    status: "LIVE",
    match: "SCOTLAND vs BRAZIL",
    viewerCount: "2.4M",
    thumbnail: "https://images.unsplash.com/photo-1518091043644-c1d445eb9519?q=80&w=800&auto=format&fit=crop",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-football-player-running-with-the-ball-on-the-field-42239-large.mp4"
  },
  {
    id: "ch-4",
    name: "GLOBAL SPORTS HD",
    status: "UPCOMING",
    match: "FRANCE vs ARGENTINA (Starts in 2h)",
    viewerCount: "0",
    thumbnail: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop"
  }
];

const CDN_NODES: CDNNode[] = [
  { id: "edge-1", region: "ASIA-EAST-1", load: 45, latency: "12ms" },
  { id: "edge-2", region: "EUROPE-WEST-4", load: 78, latency: "45ms" },
  { id: "edge-3", region: "US-CENTRAL-1", load: 22, latency: "88ms" },
];

export default function LiveTV() {
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(CHANNELS[0]);
  const [streamState, setStreamState] = useState<"idle" | "initializing" | "handshaking" | "buffering" | "active">("idle");
  const [selectedCDN, setSelectedCDN] = useState<CDNNode>(CDN_NODES[0]);

  const handlePlay = () => {
    setStreamState("initializing");
    
    // Complex state machine for realism
    setTimeout(() => {
      setStreamState("handshaking");
      setTimeout(() => {
        setStreamState("buffering");
        setTimeout(() => {
          setStreamState("active");
        }, 1500);
      }, 1000);
    }, 1000);
  };

  return (
    <div id="live-tv-module" className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Broadcast Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5">
            <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Global Broadcast Core</h2>
              <div className="bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-rose-500/30">
                LIVE 4K
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Uplink: STABLE</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Node: {selectedCDN.region}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-4">
            <Server className="w-4 h-4 text-slate-500" />
            <select 
              value={selectedCDN.id}
              onChange={(e) => setSelectedCDN(CDN_NODES.find(n => n.id === e.target.value) || CDN_NODES[0])}
              className="bg-transparent text-[10px] font-mono text-white uppercase tracking-widest font-black outline-none cursor-pointer"
            >
              {CDN_NODES.map(node => (
                <option key={node.id} value={node.id} className="bg-slate-900">{node.region} ({node.latency})</option>
              ))}
            </select>
          </div>
          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest font-black">
            <ShieldCheck className="w-4 h-4" />
            AES-256 Encrypted
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Player Engine */}
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 relative group shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedChannel.id + streamState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {streamState === "active" && selectedChannel.videoUrl ? (
                  <video 
                    src={selectedChannel.videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={selectedChannel.thumbnail} 
                      alt="Broadcast"
                      className={`w-full h-full object-cover ${streamState === 'idle' ? 'opacity-60 grayscale-[0.3]' : 'opacity-20 blur-md'} transition-all duration-1000`}
                    />
                    {streamState !== 'idle' && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    )}
                  </div>
                )}
                
                {/* Visual Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Broadcast Intelligence Overlay (Engineer View) */}
                <StreamMetrics 
                  isActive={streamState === "active"}
                  selectedCDN={selectedCDN}
                />

                {/* HUD: Top */}
                <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-2">
                    <div className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-rose-600/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE TRANSMISSION
                    </div>
                    {streamState === 'active' && (
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-mono text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        STABLE • 60 FPS
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-[10px] font-mono flex items-center gap-3">
                    <Users className="w-4 h-4 text-rose-500" />
                    <span className="font-black tracking-widest">{selectedChannel.viewerCount} VIEWING</span>
                  </div>
                </div>

                {/* Simulation HUD: Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {streamState === "idle" && (
                    <button 
                      onClick={handlePlay}
                      className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:scale-110 active:scale-95 transition-all cursor-pointer group/play"
                    >
                      <Play className="w-10 h-10 fill-current group-hover/play:scale-110 transition-transform ml-1" />
                    </button>
                  )}
                  
                  {["initializing", "handshaking", "buffering"].includes(streamState) && (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-white/5 border-t-rose-500 animate-spin" />
                        <Zap className="absolute inset-0 m-auto w-6 h-6 text-rose-500 animate-pulse" />
                      </div>
                      <div className="bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
                        <span className="text-[10px] font-mono text-rose-500 font-black uppercase tracking-[0.3em]">
                          {streamState === "initializing" && "Initializing Engine"}
                          {streamState === "handshaking" && "CDN Handshake"}
                          {streamState === "buffering" && "Optimizing Buffer"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Global Node: {selectedCDN.id}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* HUD: Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-10">
                  <div className="flex items-end justify-between gap-8">
                    <div className="max-w-xl">
                      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-3 leading-none">{selectedChannel.match}</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                            <Tv className="w-3 h-3 text-rose-500" />
                          </div>
                          <span className="text-[11px] font-mono text-rose-500 font-black uppercase tracking-widest">{selectedChannel.name}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">World Cup 2026 Exclusive HD</span>
                      </div>
                    </div>
                    {streamState === "active" && (
                      <button 
                        onClick={() => setStreamState("idle")}
                        className="bg-white/10 hover:bg-rose-500/20 hover:border-rose-500/30 text-white px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer group"
                      >
                        <Zap className="w-4 h-4 group-hover:text-rose-500 transition-colors" />
                        Terminate Feed
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Technical Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">Signal Quality</p>
                <h4 className="text-xl font-black text-white italic tracking-tight uppercase">99.8% STABLE</h4>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">Global Latency</p>
                <h4 className="text-xl font-black text-white italic tracking-tight uppercase">{selectedCDN.latency}</h4>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">Packet Loss</p>
                <h4 className="text-xl font-black text-white italic tracking-tight uppercase">NOMINAL</h4>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest mb-1">Regional Node</p>
                <h4 className="text-xl font-black text-white italic tracking-tight uppercase">{selectedCDN.id}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Navigation & Program Guide */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
            <div>
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] font-black mb-6 pl-1">Live Multi-Feed</h3>
              <div className="space-y-4">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setStreamState("idle");
                    }}
                    className={`w-full text-left p-4 rounded-3xl border transition-all relative overflow-hidden group flex items-center gap-4 cursor-pointer ${
                      selectedChannel.id === channel.id
                        ? "bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div className="w-20 h-14 rounded-2xl overflow-hidden bg-black flex-shrink-0 relative border border-white/5 shadow-lg">
                      <img src={channel.thumbnail} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      {channel.status === "LIVE" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-black text-rose-500 tracking-widest uppercase">{channel.name}</span>
                        {channel.status === "LIVE" ? (
                          <span className="flex items-center gap-1.5 text-[8px] font-mono font-black text-rose-500 animate-pulse">
                            <Signal className="w-3 h-3" /> LIVE
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono font-black text-slate-600 uppercase tracking-widest">SCHED</span>
                        )}
                      </div>
                      <h4 className={`text-xs font-black uppercase italic tracking-tight truncate ${
                        selectedChannel.id === channel.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}>
                        {channel.match}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] font-mono text-slate-600 font-black tracking-[0.2em]">{channel.viewerCount}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] font-black mb-6 pl-1">Technical Stack</h3>
              <div className="space-y-4">
                {[
                  { label: "CDN STATUS", val: "OPERATIONAL", status: "emerald" },
                  { label: "ENCODING", val: "HEVC / AV1", status: "rose" },
                  { label: "LOAD BALANCER", val: "ACTIVE", status: "emerald" },
                  { label: "BUFFER RATIO", val: "24.5%", status: "amber" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        stat.status === 'emerald' ? 'bg-emerald-500' : 
                        stat.status === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-[10px] font-mono text-white font-black uppercase tracking-widest">{stat.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
            <Zap className="w-6 h-6 text-rose-500" />
            <p className="text-[11px] font-mono text-rose-500 font-black uppercase tracking-widest">Ultra-Low Latency Mode Enabled</p>
            <p className="text-[10px] text-slate-400 font-medium">Experience real-time telemetry with sub-second synchronization across all global nodes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
