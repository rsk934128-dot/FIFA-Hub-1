import React, { useState, useEffect } from "react";
import { Download, X, ShieldCheck, Smartphone, Check } from "lucide-react";

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately if previously dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const [manualGuide, setManualGuide] = useState<boolean>(false);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If native prompt not directly available, display friendly instructions in UI
      setManualGuide(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-32px)] bg-slate-950/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fade-in text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Install FIFA Hub</h4>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">PWA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Install standalone app via PWABuilder with offline tactical telemetry.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {manualGuide && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
          ℹ️ Tap your browser's menu (Share / ⋮) and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PWABuilder Certified</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-[10px] font-mono uppercase font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono uppercase font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};
