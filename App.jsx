// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ChatHome from "./pages/ChatHome"; // Kita akan buat ini
import { useAuth } from "./context/AuthContext";
import { FiLoader } from "react-icons/fi"; // Ikon loading

function App() {
  const { currentUser, loading } = useAuth(); // Ambil status user & loading

  // Komponen untuk melindungi route
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      // Tampilkan loading spinner jika status auth belum jelas
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem', color: 'var(--primary-color)' }}>
          <FiLoader className="loading-spinner" />
        </div>
      );
    }

    if (!currentUser) {
      // Jika tidak loading dan tidak ada user, redirect ke login
      return <Navigate to="/login" />;
    }

    // Jika lolos, tampilkan halaman yang dituju (children)
    return children;
  };

  // Komponen untuk halaman login
  const LoginRoute = ({ children }) => {
    if (currentUser) {
      // Jika user sudah login, redirect ke halaman utama
      return <Navigate to="/" />;
    }
    // Jika belum, tampilkan halaman login
    return children;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          {/* Rute Utama (Dilindungi) */}
          <Route
            index
            element={
              <ProtectedRoute>
                <ChatHome />
              </ProtectedRoute>
            }
          />
          {/* Rute Login */}
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

// Tambahkan sedikit CSS untuk animasi spinner di index.css
/* Tambahkan di src/index.css

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-spinner {
    animation: spin 1s linear infinite;
  }
*/

export default App;