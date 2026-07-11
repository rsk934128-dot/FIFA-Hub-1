import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { auth, db, messaging, validateConnection } from '../lib/firebase';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isApproved: boolean;
  settings?: any;
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  fcmToken: string | null;
  refreshProfile: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  fcmToken: null,
  refreshProfile: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = "BDfW_placeholder_please_replace_with_actual_vapid_key";

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const fetchProfile = async (uid: string) => {
    try {
      const userDoc = await getDocFromServer(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile = {
          uid,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          isApproved: false,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', uid), initialProfile);
        setProfile(initialProfile as any);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    validateConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }

      setLoading(false);

      if (currentUser && messaging) {
        try {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Get FCM token
            if (VAPID_KEY && !VAPID_KEY.includes('placeholder')) {
              const token = await getToken(messaging, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
              });
              
              if (token) {
                setFcmToken(token);
                // Store token in Firestore
                const tokenRef = doc(db, 'users', currentUser.uid, 'fcm_tokens', token.substring(0, 32));
                await setDoc(tokenRef, {
                  token,
                  platform: 'web',
                  lastUpdated: new Date().toISOString(),
                  createdAt: serverTimestamp()
                }, { merge: true });
                
                console.log("FCM Token registered:", token);
              }
            } else {
              console.warn("FCM registration skipped: VAPID_KEY is a placeholder.");
            }
          }
        } catch (error) {
          console.error("FCM registration error:", error);
          // Only show error toast if it's not a permission issue
          if (Notification.permission !== 'denied') {
            toast.error("Failed to enable push notifications. Check VAPID key.");
          }
        }
      }
    });

    // Handle foreground messages
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        if (payload.notification) {
          toast(payload.notification.title, {
            description: payload.notification.body,
          });
        }
      });
    }

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, fcmToken, refreshProfile }}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};
