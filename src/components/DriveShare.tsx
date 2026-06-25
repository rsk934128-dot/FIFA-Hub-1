import React, { useState } from 'react';
import { HardDrive, Check, Loader2, ExternalLink } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { googleSignIn } from '../lib/workspace';
import { toast } from 'sonner';

interface DriveShareProps {
  fileName: string;
  content: string;
  mimeType?: string;
  buttonText?: string;
  className?: string;
}

export const DriveShare: React.FC<DriveShareProps> = ({ 
  fileName, 
  content, 
  mimeType = 'text/html',
  buttonText = "Save to Drive",
  className = ""
}) => {
  const { hasGmailAccess, accessToken, setGmailAccess } = useWorkspace();
  const [isSaving, setIsSaving] = useState(false);
  const [fileLink, setFileLink] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailAccess(result.accessToken);
        toast.success("Workspace Connected!");
      }
    } catch (err) {
      toast.error("Failed to connect Workspace");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/drive/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileName,
          content,
          mimeType,
          accessToken
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const data = await response.json();
      setFileLink(data.link);
      toast.success("Saved to Google Drive!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save to Drive");
      if (err.message?.includes('auth') || err.message?.includes('token')) {
        setGmailAccess(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasGmailAccess) {
    return (
      <button
        onClick={handleConnect}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all ${className}`}
      >
        <HardDrive className="w-3.5 h-3.5" />
        Connect Drive
      </button>
    );
  }

  if (fileLink) {
    return (
      <a
        href={fileLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all ${className}`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View in Drive
      </a>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 ${className}`}
    >
      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
      {isSaving ? "Saving..." : buttonText}
    </button>
  );
};
