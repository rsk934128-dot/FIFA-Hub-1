import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Server, Users, Zap, Activity, ShieldCheck, Gauge, Share2, BarChart3, Database, Radio } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import * as d3 from "d3";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: "source" | "edge" | "user";
  label: string;
  load: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  id: string;
}

interface Packet {
  id: number;
  sourceId: string;
  targetId: string;
  color: string;
}

const generateThroughputData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    val: Math.floor(Math.random() * 40 + 60)
  }));
};

export default function NetworkFlow() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [throughputData, setThroughputData] = useState(generateThroughputData());
  const [simNodes, setSimNodes] = useState<Node[]>([]);
  const [simLinks, setSimLinks] = useState<Link[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize nodes and links
  useEffect(() => {
    const nodes: Node[] = [
      { id: "src-1", type: "source", label: "US_EAST_UPLINK", load: 45 },
      { id: "src-2", type: "source", label: "EU_CENTRAL_UPLINK", load: 62 },
      { id: "edge-1", type: "edge", label: "LON_EDGE_01", load: 78 },
      { id: "edge-2", type: "edge", label: "SIN_EDGE_01", load: 34 },
      { id: "edge-3", type: "edge", label: "SFO_EDGE_01", load: 12 },
      { id: "user-1", type: "user", label: "CLUSTER_EU", load: 88 },
      { id: "user-2", type: "user", label: "CLUSTER_NA", load: 92 },
      { id: "user-3", type: "user", label: "CLUSTER_AS", load: 41 },
    ];

    const links: Link[] = [
      { id: "l1", source: "src-1", target: "edge-1" },
      { id: "l2", source: "src-1", target: "edge-2" },
      { id: "l3", source: "src-2", target: "edge-1" },
      { id: "l4", source: "src-2", target: "edge-3" },
      { id: "l5", source: "edge-1", target: "user-1" },
      { id: "l6", source: "edge-2", target: "user-3" },
      { id: "l7", source: "edge-3", target: "user-2" },
      { id: "l8", source: "edge-1", target: "user-2" },
    ];

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("x", d3.forceX<Node>(d => {
        if (d.type === "source") return dimensions.width * 0.15;
        if (d.type === "edge") return dimensions.width * 0.5;
        return dimensions.width * 0.85;
      }).strength(0.5))
      .on("tick", () => {
        setSimNodes([...nodes]);
        setSimLinks([...links]);
      });

    return () => simulation.stop();
  }, [dimensions]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update chart and packets
  useEffect(() => {
    const interval = setInterval(() => {
      if (simLinks.length === 0) return;

      // Spawn packet
      const randomLink = simLinks[Math.floor(Math.random() * simLinks.length)];
      const source = typeof randomLink.source === "string" ? randomLink.source : (randomLink.source as Node).id;
      const target = typeof randomLink.target === "string" ? randomLink.target : (randomLink.target as Node).id;

      const newPacket: Packet = {
        id: Date.now() + Math.random(),
        sourceId: source,
        targetId: target,
        color: "#f59e0b"
      };
      
      setPackets(prev => [...prev.slice(-20), newPacket]);
      
      // Node activation
      setActiveNodes(prev => {
        const next = new Set(prev);
        next.add(source);
        next.add(target);
        return next;
      });

      setTimeout(() => {
        setActiveNodes(prev => {
          const next = new Set(prev);
          next.delete(source);
          next.delete(target);
          return next;
        });
      }, 600);

      // Throughput update
      setThroughputData(prev => {
        const last = prev[prev.length - 1];
        const nextVal = Math.max(40, Math.min(100, (last?.val || 60) + (Math.random() * 10 - 5)));
        return [...prev.slice(1), { time: (last?.time || 0) + 1, val: nextVal }];
      });

    }, 400);

    return () => clearInterval(interval);
  }, [simLinks]);

  return (
    <div className="bg-[#050811] border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Radio className="w-40 h-40 text-white" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Share2 className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Network Flow Monitor</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] font-black mt-1">Real-time Stream Orchestration</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-widest">Encrypted Tunnel</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-widest">D3_ENGINE_V4</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Force Directed Graph View */}
        <div ref={containerRef} className="lg:col-span-8 relative aspect-[16/9] bg-black/40 rounded-3xl border border-white/5 p-4 overflow-hidden group">
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
            <g>
              {simLinks.map(link => {
                const s = link.source as Node;
                const t = link.target as Node;
                return (
                  <line
                    key={link.id}
                    x1={s.x} y1={s.y}
                    x2={t.x} y2={t.y}
                    stroke="white"
                    strokeWidth="0.5"
                    strokeOpacity="0.05"
                  />
                );
              })}

              <AnimatePresence initial={false}>
                {packets.map(packet => {
                  const source = simNodes.find(n => n.id === packet.sourceId);
                  const target = simNodes.find(n => n.id === packet.targetId);
                  if (!source?.x || !target?.x) return null;
                  return (
                    <motion.circle
                      key={packet.id}
                      r="1.5"
                      fill={packet.color}
                      initial={{ cx: source.x, cy: source.y, opacity: 0 }}
                      animate={{ 
                        cx: target.x, 
                        cy: target.y,
                        opacity: [0, 1, 1, 0],
                        scale: [1, 2, 2, 1]
                      }}
                      transition={{ duration: 2, ease: "linear" }}
                    />
                  );
                })}
              </AnimatePresence>
            </g>
          </svg>

          {simNodes.map(node => (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node"
              style={{ left: node.x, top: node.y }}
            >
              <div className={`relative p-3.5 rounded-2xl border transition-all duration-500 ${
                activeNodes.has(node.id) 
                  ? "bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-110" 
                  : "bg-[#0A0F1E]/90 border-white/10 hover:border-white/30"
              }`}>
                {node.type === "source" && <Database className={`w-5 h-5 ${activeNodes.has(node.id) ? "text-amber-500" : "text-slate-500"}`} />}
                {node.type === "edge" && <Zap className={`w-5 h-5 ${activeNodes.has(node.id) ? "text-emerald-500" : "text-slate-500"}`} />}
                {node.type === "user" && <Users className={`w-5 h-5 ${activeNodes.has(node.id) ? "text-rose-500" : "text-slate-500"}`} />}
                
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-[#050811]" style={{ 
                  backgroundColor: node.load > 70 ? "#ef4444" : node.load > 40 ? "#f59e0b" : "#10b981" 
                }} />
              </div>
              <div className="mt-2 text-center pointer-events-none transition-all duration-300 transform scale-90 group-hover/node:scale-100 opacity-0 group-hover/node:opacity-100">
                <span className="text-[8px] font-mono text-white font-black uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                  {node.label}
                </span>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 flex gap-6 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            {[
              { label: "Uplink", icon: <Database className="w-3 h-3 text-amber-500" /> },
              { label: "CDN Edge", icon: <Zap className="w-3 h-3 text-emerald-500" /> },
              { label: "Client Hub", icon: <Users className="w-3 h-3 text-rose-500" /> }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.icon}
                <span className="text-[8px] font-mono text-slate-400 font-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Routing Analytics</h4>
              <BarChart3 className="w-4 h-4 text-slate-600" />
            </div>
            
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#f59e0b" 
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-mono text-slate-500 uppercase font-black mb-1">Peak Flow</p>
                <h5 className="text-xl font-black text-white italic">9.2 GB/S</h5>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-mono text-slate-500 uppercase font-black mb-1">Active Paths</p>
                <h5 className="text-xl font-black text-white italic">2,482</h5>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Connection Health</h4>
            <div className="space-y-4">
              {[
                { label: "Sync Fidelity", val: 99.8, color: "emerald", bgColor: "bg-emerald-500" },
                { label: "CDN Payload", val: 64.2, color: "amber", bgColor: "bg-amber-500" },
                { label: "Packet Jitter", val: 2.5, color: "rose", bgColor: "bg-rose-500" }
              ].map((stat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-mono font-black uppercase">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className={
                      stat.color === 'emerald' ? 'text-emerald-500' : 
                      stat.color === 'amber' ? 'text-amber-500' : 'text-rose-500'
                    }>{stat.val}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${stat.val}%` }}
                      className={`h-full ${stat.bgColor} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-black" />
            </div>
            <p className="text-[10px] font-mono text-amber-500 font-black uppercase tracking-widest">Optimization: ACTIVE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
