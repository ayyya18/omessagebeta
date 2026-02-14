import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBy2CwId1iUZFEuiy5BrT86zcEreAP2crI",
  authDomain: "omessage-c9ff2.firebaseapp.com",
  databaseURL: "https://omessage-c9ff2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "omessage-c9ff2",
  storageBucket: "omessage-c9ff2.firebasestorage.app",
  messagingSenderId: "817621464763",
  appId: "1:817621464763:web:c6ed06130b591e1e4adb9e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const dbRealtime = getDatabase(app);
export const storage = getStorage(app);
// Export messaging for notifications (will be undefined in non-HTTPS / localfile envs)
let messaging;
try {
  messaging = getMessaging(app);
} catch (err) {
  // ignore if messaging isn't supported in this environment
  console.warn('FCM not available:', err?.message || err);
}
export { messaging, onMessage };