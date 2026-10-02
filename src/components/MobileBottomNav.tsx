import React from "react";
import { 
  Activity, 
  Globe, 
  Tv, 
  Newspaper, 
  Grid, 
  Sparkles,
  Layers
} from "lucide-react";
import { ProgramId } from "./ProgramLauncherModal";

interface MobileBottomNavProps {
  activeTab: ProgramId;
  onSelectTab: (tab: ProgramId) => void;
  onOpenLauncher: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenLauncher
}) => {
  const primaryTabs: { id: ProgramId; label: string; icon: React.ReactNode }[] = [
    {
      id: "sim",
      label: "Sim",
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: "browser",
      label: "Browser",
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: "live",
      label: "Live TV",
      icon: <Tv className="w-5 h-5" />
    },
    {
      id: "news",
      label: "News",
      icon: <Newspaper className="w-5 h-5" />
    }
  ];

  const isOtherActive = !primaryTabs.some(t => t.id === activeTab);

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050811]/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {primaryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
                isActive
                  ? "text-amber-400 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
                )}
              </div>
              <span className="text-[10px] font-mono tracking-tight mt-1">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}

        {/* All Programs Drawer / Sheet button */}
        <button
          onClick={onOpenLauncher}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            isOtherActive
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-amber-500 text-[8px] font-black text-black font-mono">
              15
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-tight mt-1">
            Programs
          </span>
          {isOtherActive && (
            <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-amber-400" />
          )}
        </button>
      </div>
    </nav>
  );
};
