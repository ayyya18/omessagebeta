import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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