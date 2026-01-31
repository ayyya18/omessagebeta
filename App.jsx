// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ChatHome from "./pages/ChatHome";
import { useAuth } from "./context/AuthContext";
import { FiLoader } from "react-icons/fi";

function App() {
  const { currentUser, loading } = useAuth();

  // 1. Tampilkan Loading Screen secara GLOBAL
  // Aplikasi tidak akan me-render Router sampai status auth jelas (Login/Logout)
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: 'var(--bg-color)' 
      }}>
        <FiLoader className="loading-spinner" size={40} color="#68d391" />
      </div>
    );
  }

  // 2. Komponen Pelindung Route (Hanya untuk user yang login)
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  // 3. Komponen Pelindung Login (Hanya untuk user yang BELUM login)
  const LoginRoute = ({ children }) => {
    if (currentUser) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <ProtectedRoute>
                <ChatHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="login"
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;