// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from "react";
import { auth, db, messaging, onMessage as fcmOnMessage } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { indexUser } from '../utils/searchIndex';
import { requestNotificationPermission, showLocalNotification } from '../notifications';

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // Mulai dengan loading = true agar tidak render halaman kosong/error di awal
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Matikan loading setelah Firebase merespon
      console.log("Auth State Changed:", user ? "Logged In" : "Logged Out");

      // Jika user login, lakukan setup notifikasi (token + foreground handler)
      if (user) {
        (async () => {
          try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (vapidKey) {
              const token = await requestNotificationPermission(vapidKey);
              if (token) {
                await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
              }
              // ensure user is indexed for global search
              try { await indexUser(user); } catch (err) { console.error('indexUser in AuthContext failed', err); }
            }

            if (messaging && fcmOnMessage) {
              fcmOnMessage(messaging, (payload) => {
                const title = payload.notification?.title || 'Pesan Baru';
                const body = payload.notification?.body || '';
                showLocalNotification(title, { body });
              });
            }
          } catch (err) {
            console.warn('Notification setup skipped or failed:', err?.message || err);
          }
        })();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Pass value loading ke context
  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};