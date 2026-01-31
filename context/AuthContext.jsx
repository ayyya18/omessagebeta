// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

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
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Pass value loading ke context
  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children} {/* Opsional: Jangan render children sampai loading selesai */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};