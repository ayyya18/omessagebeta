// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

// 1. Buat Context
export const AuthContext = createContext();

// 2. Buat Provider (pembungkus)
export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Tambahkan status loading

  useEffect(() => {
    // onAuthStateChanged adalah listener real-time dari Firebase Auth
    // Ini akan berjalan saat user login, logout, atau saat aplikasi pertama kali load
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Selesai loading
      console.log("User saat ini:", user);
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Buat custom hook (opsional tapi praktis)
export const useAuth = () => {
  return useContext(AuthContext);
};