import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Analytics and Messaging conditionally
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

const DATABASE_ID = 'ai-studio-236bf4ef-42bb-41e0-94ca-3f4c8db500db';
export const db = getFirestore(app, DATABASE_ID);
export const auth = getAuth();

export async function validateConnection() {
  try {
    // Try to read from news collection which is public
    await getDocFromServer(doc(db, 'news', 'connection-check'));
    console.log("Firebase connected successfully");
  } catch (error) {
    console.error("Firebase connection error:", error);
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('insufficient permissions'))) {
      console.warn("Please check your Firebase configuration or ensure Firestore is provisioned.");
    }
  }
}
