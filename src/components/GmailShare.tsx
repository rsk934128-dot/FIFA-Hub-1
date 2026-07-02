import React, { useState } from 'react';
import { Mail, Send, Check, Loader2, AlertCircle } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { googleSignIn } from '../lib/workspace';
import { toast } from 'sonner';

interface GmailShareProps {
  subject: string;
  body: string;
  buttonText?: string;
  className?: string;
}

export const GmailShare: React.FC<GmailShareProps> = ({ 
  subject, 
  body, 
  buttonText = "Share to Gmail",
  className = ""
}) => {
  const { hasGmailAccess, accessToken, setGmailAccess } = useWorkspace();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [recipient, setRecipient] = useState('');

  const handleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailAccess(result.accessToken);
        toast.success("Gmail Connected!");
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        toast.error("Connection popup blocked. Please allow popups and try again.");
      } else {
        toast.error("Failed to connect Gmail");
      }
    }
  };

  const handleSend = async () => {
    if (!recipient) {
      toast.error("Please enter a recipient email");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          body,
          accessToken
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send");
      }

      setIsSent(true);
      toast.success("Match report sent via Gmail!");
      setTimeout(() => {
        setIsSent(false);
        setShowRecipientInput(false);
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
      if (err.message?.includes('auth') || err.message?.includes('token')) {
        setGmailAccess(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!hasGmailAccess) {
    return (
      <button
        onClick={handleConnect}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all ${className}`}
      >
        <Mail className="w-3.5 h-3.5" />
        Connect Gmail
      </button>
    );
  }

  if (showRecipientInput) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-amber-500/50 transition-all">
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient Email"
            className="bg-transparent border-none outline-none text-[10px] font-mono text-white placeholder:text-slate-600 w-full"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className="text-amber-500 hover:text-amber-400 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button 
          onClick={() => setShowRecipientInput(false)}
          className="text-[8px] font-mono text-slate-500 uppercase tracking-widest hover:text-slate-400 self-start px-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowRecipientInput(true)}
      disabled={isSent}
      className={`flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:bg-emerald-500 disabled:text-white ${className}`}
    >
      {isSent ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
      {isSent ? "Sent Successfully" : buttonText}
    </button>
  );
};
