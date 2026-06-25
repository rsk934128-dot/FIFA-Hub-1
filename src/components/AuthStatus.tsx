import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export const AuthStatus: React.FC = () => {
  const { user, loading } = useFirebase();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono text-slate-400 uppercase font-black">{user.displayName || 'User'}</p>
            <p className="text-[8px] font-mono text-emerald-500 uppercase font-black">Connected</p>
          </div>
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-500 transition-colors" />
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-mono font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <LogIn className="w-4 h-4" />
          Login with Google
        </button>
      )}
    </div>
  );
};
