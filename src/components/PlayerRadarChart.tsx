import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface Metric {
  label: string;
  value: number;
}

interface PlayerRadarChartProps {
  playerA: {
    name: string;
    metrics: Metric[];
  };
  playerB: {
    name: string;
    metrics: Metric[];
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0f1d] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              <span className="text-[10px] font-mono text-white uppercase tracking-wider">
                {entry.name}:
              </span>
              <span className="text-[10px] font-mono font-black text-white">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({ playerA, playerB }) => {
  // Transform data for Recharts
  // We assume both players have the same labels in the same order
  const data = playerA.metrics.map((m, index) => ({
    subject: m.label,
    A: m.value,
    B: playerB.metrics[index]?.value || 0,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[400px] bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <div className="text-[40px] font-black italic text-white select-none">RADAR</div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          
          <Radar
            name={playerA.name}
            dataKey="A"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={playerB.name}
            dataKey="B"
            stroke="#fbbf24"
            fill="#fbbf24"
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
