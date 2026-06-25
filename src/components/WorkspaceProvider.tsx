import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { setAccessToken } from '../lib/workspace';

interface WorkspaceContextType {
  hasGmailAccess: boolean;
  accessToken: string | null;
  setGmailAccess: (token: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  hasGmailAccess: false,
  accessToken: null,
  setGmailAccess: () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setToken] = useState<string | null>(null);

  const setGmailAccess = (token: string | null) => {
    setToken(token);
    setAccessToken(token);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setGmailAccess(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ 
      hasGmailAccess: !!accessToken, 
      accessToken, 
      setGmailAccess 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
