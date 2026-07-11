import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { ShieldAlert, Lock, Mail, ChevronRight, Terminal, CheckCircle2, ShoppingCart, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

export const ApprovalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, refreshProfile } = useFirebase();
  const [command, setCommand] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Hardcoded master code for demonstration/prototype as per specific instructions
  const EXPECTED_PREFIX = "/approve 4b281d7d6a2c5f572ac235c8bd10661822af8680:";
  const MASTER_CODE = "GLOCAL2026"; 

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsVerifying(true);
    
    if (command === `${EXPECTED_PREFIX}${MASTER_CODE}`) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isApproved: true,
          approvedAt: new Date().toISOString()
        });
        toast.success("Registration Approved! Initializing tactical access...");
        await refreshProfile();
      } catch (error) {
        toast.error("Approval failed. Contact system administrator.");
      }
    } else {
      toast.error("Invalid approval command or code. Please check your credentials.");
    }
    
    setIsVerifying(false);
  };

  const handleTelegramPayment = async () => {
    if (!user) return;
    
    setIsPaying(true);
    try {
      const response = await fetch('/api/payments/telegram/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          planId: 'premium_access',
          amount: 60000, // $600.00
          currency: 'USD'
        })
      });

      const data = await response.json();

      if (data.url) {
        if (typeof (window as any).Telegram !== 'undefined' && (window as any).Telegram.WebApp) {
          (window as any).Telegram.WebApp.openInvoice(data.url, async (status: string) => {
            if (status === 'paid') {
              await updateDoc(doc(db, 'users', user.uid), {
                isApproved: true,
                approvedAt: new Date().toISOString(),
                planId: 'premium_access'
              });
              toast.success("Payment Successful! Tactical access has been unlocked.");
              await refreshProfile();
            } else {
              toast.error("Payment failed or cancelled.");
            }
          });
        } else {
          toast.info("Opening payment portal...");
          window.open(data.url, '_blank');
          
          if (data.mock) {
            setTimeout(async () => {
              await updateDoc(doc(db, 'users', user.uid), {
                isApproved: true,
                approvedAt: new Date().toISOString(),
                planId: 'premium_access'
              });
              toast.success("MOCK SUCCESS: Tactical access unlocked.");
              await refreshProfile();
            }, 3000);
          }
        }
      } else {
        throw new Error(data.error || "Failed to initialize payment");
      }
    } catch (error: any) {
      toast.error("Payment Error: " + error.message);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return null;

  if (user && profile && !profile.isApproved) {
    return (
      <div className="fixed inset-0 z-[200] bg-zinc-950 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldAlert className="w-32 h-32 text-amber-500" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Access <span className="text-amber-500">Restricted</span></h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Pending Manager Verification</p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed italic font-medium">
                "Your account is created. To approve the registration, please subscribe via the <span className="text-amber-500">Telegram Payments API</span> or enter the manager-code below."
              </p>
              
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest pt-2 border-t border-white/5">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact: hello@smart-glocal.com</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleTelegramPayment}
                disabled={isPaying}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase italic tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 group overflow-hidden relative"
              >
                {isPaying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Subscribe via Telegram
                    <ShoppingCart className="w-5 h-5" />
                  </>
                )}
                <motion.div 
                  className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                />
              </button>

              <div className="relative flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest font-black">Or Use Tactical Code</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleApprove} className="space-y-4">
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input 
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="/approve 4b281d7d6a2c5f572ac235c8bd10661822af8680:CODE"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-amber-500 placeholder:text-zinc-700 outline-none focus:border-amber-500/50 transition-all uppercase"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={isVerifying || !command}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase italic tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Initialize via Code
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => signOut(auth)}
                    className="w-full py-3 text-slate-600 hover:text-white font-mono text-[9px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Sign Out of Current Identity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
