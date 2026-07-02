import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CreditCard, ShieldCheck, Zap, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StripeConfig {
  publishableKey: string;
}

export const StripeCheckout: React.FC = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const { publishableKey } = await res.json();
        if (publishableKey) {
          setStripePromise(loadStripe(publishableKey));
        } else {
          console.warn("Stripe Publishable Key not found in environment.");
        }
      } catch (err) {
        console.error("Failed to fetch Stripe config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!stripePromise) {
      toast.error("Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your secrets.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: window.location.origin + '?payment=success',
          cancelUrl: window.location.origin + '?payment=cancel',
        }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);

      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error("Checkout Error:", err);
      toast.error(err.message || "Failed to initiate checkout");
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Initializing Secure Payment Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black italic text-white tracking-tight flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-amber-500" />
          FIFA HUB PREMIUM
        </h2>
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Unlock elite tactical insights & scouting deep-dives</p>
      </div>

      {!stripePromise && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-amber-500 font-bold text-sm">Action Required: Stripe Configuration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              To enable real payments, you must provide your Stripe keys in the <span className="text-white font-bold">Secrets panel</span>. 
              Add <code className="bg-white/5 px-1 rounded text-amber-400">STRIPE_SECRET_KEY</code> and <code className="bg-white/5 px-1 rounded text-amber-400">VITE_STRIPE_PUBLISHABLE_KEY</code>.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pro Plan */}
        <div className="bg-[#0a0f1d] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star className="w-24 h-24 text-amber-500" />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-[0.2em] block mb-2">Tactical Pro</span>
              <h3 className="text-4xl font-black text-white italic">$12<span className="text-lg font-normal text-slate-500 not-italic">/mo</span></h3>
            </div>

            <ul className="space-y-3">
              {[
                "Unlimited Tactical Advisor Queries",
                "Advanced Scouting Data Export",
                "Live Stream Performance Metrics",
                "Priority Match Simulations",
                "Nexus Global Access (unrestricted)"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              disabled={loading}
              onClick={() => handleCheckout('price_pro_monthly')}
              className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Lifetime Plan */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/50 transition-all duration-500">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-[0.2em] block mb-2">Elite Founder</span>
                <h3 className="text-4xl font-black text-white italic">$99<span className="text-lg font-normal text-slate-500 not-italic">/once</span></h3>
              </div>
              <div className="bg-amber-500 text-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter">Best Value</div>
            </div>

            <ul className="space-y-3">
              {[
                "Everything in Tactical Pro",
                "Lifetime Access - No Subscriptions",
                "Exclusive Founder Badge in Chat",
                "Beta Access to New AI Models",
                "Direct Input to Feature Roadmap"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              disabled={loading}
              onClick={() => handleCheckout('price_lifetime')}
              className="w-full py-4 bg-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Get Lifetime Access
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 py-6 opacity-30">
        <div className="text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" /> Secure by Stripe
        </div>
        <div className="text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2">
          <Zap className="w-3 h-3" /> PCI DSS Compliant
        </div>
        <div className="text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2">
          <Star className="w-3 h-3" /> Trusted Global Gateway
        </div>
      </div>
    </div>
  );
};
