import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Analytics and Messaging conditionally
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

const DATABASE_ID = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log(`Attempting to initialize Firestore with Database ID: ${DATABASE_ID} in project: ${firebaseConfig.projectId}`);

// Use initializeFirestore with long polling and ignoreUndefinedProperties for better reliability
export let db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, DATABASE_ID);

export const auth = getAuth(app);

export async function validateConnection() {
  try {
    // Try to read from news collection which is public
    const docRef = doc(db, 'news', 'connection-check');
    await getDocFromServer(docRef);
    console.log(`Firebase connected successfully with database: ${DATABASE_ID}`);
  } catch (error: any) {
    console.warn(`Firebase connection error with database ${DATABASE_ID}:`, error.message);
    
    // If it's not the default database, try falling back to (default)
    if (DATABASE_ID !== '(default)') {
      try {
        console.log("Attempting fallback to (default) database...");
        const defaultDb = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        });
        await getDocFromServer(doc(defaultDb, 'news', 'connection-check'));
        db = defaultDb;
        console.log("Firebase connected successfully with (default) database");
      } catch (fallbackError: any) {
        console.error("Firebase connection error with (default) database too:", fallbackError.message);
      }
    }
  }
}
