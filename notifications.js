// Helper utilities to request notification permission and obtain FCM token
import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';

// Request browser notification permission and return FCM token (if messaging available)
export async function requestNotificationPermission(vapidKey) {
  if (!('Notification' in window)) throw new Error('Browser does not support notifications');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission not granted');
  if (!messaging) throw new Error('Firebase messaging is not initialized');
  // getToken requires passing the VAPID key from Firebase console (set via env VITE_FIREBASE_VAPID_KEY)
  const token = await getToken(messaging, { vapidKey });
  return token;
}

// Simple utility to show a local notification (when app is in foreground)
export function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    try { new Notification(title, options); } catch (e) { console.warn('Notification failed:', e); }
  }
}
