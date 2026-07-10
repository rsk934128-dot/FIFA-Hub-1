import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { auth, db, messaging, validateConnection } from '../lib/firebase';
import { toast } from 'sonner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  fcmToken: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  fcmToken: null,
});

export const useFirebase = () => useContext(FirebaseContext);

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = "BDfW_placeholder_please_replace_with_actual_vapid_key";

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    validateConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && messaging) {
        try {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Get FCM token
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

  return (
    <FirebaseContext.Provider value={{ user, loading, fcmToken }}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};
