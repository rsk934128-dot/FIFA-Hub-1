import React, { useState, useEffect, useCallback } from 'react';
import { 
  HardDrive, 
  Search, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Loader2, 
  RefreshCw, 
  Filter,
  FileCode,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { googleSignIn } from '../lib/workspace';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime: string;
}

export const MyDocs: React.FC = () => {
  const { hasGmailAccess, accessToken, setGmailAccess } = useWorkspace();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchFiles = useCallback(async (searchTerm = '') => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/drive/list?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading archive');
      if (err.message.includes('401') || err.message.includes('token')) {
        setGmailAccess(null);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, setGmailAccess]);

  useEffect(() => {
    if (hasGmailAccess) {
      fetchFiles();
    }
  }, [hasGmailAccess, fetchFiles]);

  const handleDelete = async (fileId: string) => {
    if (!accessToken || !window.confirm('Archive this tactical report permanently?')) return;

    setIsDeleting(fileId);
    try {
      const response = await fetch(`/api/drive/delete/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Report archived/deleted');
    } catch (err: any) {
      toast.error('Failed to delete from archive');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailAccess(result.accessToken);
        toast.success("Drive Connected!");
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        toast.error("Connection popup blocked. Please allow popups and try again.");
      } else {
        toast.error("Failed to connect Workspace");
      }
    }
  };

  if (!hasGmailAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10 rounded-3xl bg-white/[0.02] p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
          <HardDrive className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-mono font-black italic text-white uppercase tracking-tighter mb-2">Tactical Archive Locked</h2>
        <p className="text-slate-500 text-sm font-mono max-w-xs mb-8 uppercase tracking-widest leading-relaxed">
          Connect your Google Workspace to access scouting reports and match data.
        </p>
        <button
          onClick={handleConnect}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-mono text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]"
        >
          <HardDrive className="w-4 h-4" />
          Authorize Drive Access
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="SEARCH ARCHIVES..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Debounced search could be added here
            }}
            onKeyDown={(e) => e.key === 'Enter' && fetchFiles(search)}
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-mono text-white placeholder:text-slate-600 focus:border-blue-500/50 outline-none transition-all uppercase tracking-widest"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => fetchFiles(search)}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync
          </button>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-mono font-black text-blue-500 uppercase tracking-widest">Workspace Online</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      {loading && files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.3em]">Accessing Tactical Vault...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-3xl opacity-50">
          <AlertCircle className="w-8 h-8 text-slate-700 mb-4" />
          <span className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.3em]">No Records Found</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    {file.mimeType.includes('html') ? (
                      <FileCode className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting === file.id}
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      {isDeleting === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    <a 
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <h3 className="font-mono text-xs font-black text-white uppercase tracking-wider mb-2 truncate group-hover:text-blue-400 transition-colors">
                  {file.name}
                </h3>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[9px] font-mono uppercase tracking-widest">
                      {new Date(file.createdTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Filter className="w-3 h-3" />
                    <span className="text-[9px] font-mono uppercase tracking-widest truncate max-w-[80px]">
                      {file.mimeType.split('/').pop()?.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
