import React from 'react';
import { 
  Zap, 
  Shield, 
  Crown, 
  Star, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Check, 
  ChevronRight, 
  Sparkles,
  MessageSquare,
  FileSearch,
  Mic,
  Cpu,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface PlanProps {
  title: string;
  subtitle: string;
  price?: string;
  period?: string;
  features: string[];
  models?: string[];
  isPremium?: boolean;
  isBundle?: boolean;
  icon: any;
  accentColor: string;
}

const PlanCard: React.FC<PlanProps> = ({ 
  title, 
  subtitle, 
  price, 
  period, 
  features, 
  models, 
  isPremium, 
  isBundle, 
  icon: Icon,
  accentColor 
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative flex flex-col p-6 rounded-[2rem] border transition-all duration-300 ${
        isPremium 
          ? `bg-white/5 border-${accentColor}/30 shadow-2xl shadow-${accentColor}/10` 
          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
      }`}
    >
      {isPremium && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-${accentColor} text-black text-[9px] font-black uppercase tracking-widest italic flex items-center gap-1`}>
          <Crown className="w-3 h-3" />
          Elite Access
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className={`w-12 h-12 rounded-2xl bg-${accentColor}/10 flex items-center justify-center border border-${accentColor}/20 mb-4`}>
            <Icon className={`w-6 h-6 text-${accentColor}`} />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{title}</h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{subtitle}</p>
        </div>
        {price && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
              <span className="text-2xl font-black italic">{price}</span>
            </div>
            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{period}</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {models && (
          <div className="space-y-2">
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Available Systems</p>
            <div className="flex flex-wrap gap-1.5">
              {models.map((m, i) => (
                <span key={i} className="px-2 py-1 bg-black/40 border border-white/5 rounded-lg text-[8px] font-mono text-slate-300 uppercase italic">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`mt-1 w-3.5 h-3.5 rounded-full bg-${accentColor}/10 flex items-center justify-center border border-${accentColor}/20`}>
                <Check className={`w-2 h-2 text-${accentColor}`} />
              </div>
              <span className="text-[11px] text-slate-300 font-medium leading-tight">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <button className={`mt-8 w-full py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
        isPremium 
          ? `bg-${accentColor} text-black hover:opacity-90 shadow-lg shadow-${accentColor}/20` 
          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
      }`}>
        {isBundle ? 'Select Bundle' : 'Initialize Plan'}
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const SubscriptionStore: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest">Nexus Intelligence Store</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          Elite Service <span className="text-amber-500">Subscription</span>
        </h1>
        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed">
          Unlock the world's most powerful AI models and tactical tools. Integrated directly into your scouting workflow.
        </p>
      </div>

      {/* Main Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PlanCard 
          title="Basic Core"
          subtitle="Free | Weekly Access"
          features={[
            "50 requests per week",
            "Basic Image recognition",
            "25 image generations",
            "Standard community support"
          ]}
          models={["GPT-5 mini", "DeepSeek V4", "Gemini 3.1 Flash", "Perplexity", "Nano Banana 2", "GPT Image 2"]}
          icon={Zap}
          accentColor="slate"
        />
        
        <PlanCard 
          title="Premium Elite"
          subtitle="Monthly Access"
          price="600"
          period="Stars / Month"
          isPremium
          features={[
            "100 requests per day limit",
            "All Basic systems included",
            "Advanced File analysis",
            "Full Voice responses",
            "Ad-free tactical experience"
          ]}
          models={["GPT-5.6", "Gemini 3.5 Flash", "Claude 4.8 Opus", "Sonnet 5", "Nano Banana Pro"]}
          icon={Crown}
          accentColor="amber"
        />

        <PlanCard 
          title="Premium X2"
          subtitle="Monthly High Capacity"
          price="900"
          period="Stars / Month"
          features={[
            "200 requests per day limit",
            "Full Premium perks included",
            "Priority system access",
            "Beta feature availability"
          ]}
          models={["All Premium Models"]}
          icon={Cpu}
          accentColor="blue"
        />
      </div>

      {/* Bundles Section */}
      <div className="space-y-8 pt-12 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Resource Bundles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard 
            title="Image Pack"
            subtitle="Generation Bundle"
            price="250"
            period="From 250 Stars"
            isBundle
            features={[
              "50 to 500 generations",
              "Midjourney & Video access",
              "Advanced Face swapping",
              "Flux & Seedream engines"
            ]}
            models={["Midjourney", "Recraft", "Flux", "Seedream"]}
            icon={ImageIcon}
            accentColor="emerald"
          />

          <PlanCard 
            title="Video Vault"
            subtitle="Motion Bundle"
            price="150"
            period="From 150 Stars"
            isBundle
            features={[
              "2 to 50 generations",
              "Video-to-video processing",
              "Image-to-video conversion",
              "Creative visual effects"
            ]}
            models={["Kling", "Veo 3.1", "Seedance 2.0", "Pika"]}
            icon={Video}
            accentColor="rose"
          />

          <PlanCard 
            title="Music Forge"
            subtitle="Audio Bundle"
            price="250"
            period="From 250 Stars"
            isBundle
            features={[
              "20 to 100 generations",
              "Custom or AI lyrics support",
              "Professional Pro engines",
              "High-fidelity output"
            ]}
            models={["Suno V5.5", "Lyria 3 Pro"]}
            icon={Music}
            accentColor="purple"
          />
        </div>
      </div>

      {/* Footer support info */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <MessageSquare className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight italic">Need Support?</h4>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Our tactical assistance team is standing by.</p>
          </div>
        </div>
        <a 
          href="https://t.me/i_abramov_gpt" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          Contact @i_abramov_gpt
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

const Layers: React.FC<any> = (props) => (
  <svg 
    {...props} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.83l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.83Z" />
    <path d="m2.6 12.08 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
    <path d="m2.6 16.14 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
  </svg>
);
