import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ChatHome from "./pages/ChatHome";
import { useAuth } from "./context/AuthContext";
import { FiLoader } from "react-icons/fi";

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <FiLoader className="loading-spinner" size={50} color="#68d391" />
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) return <Navigate to="/login" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<ProtectedRoute><ChatHome /></ProtectedRoute>} />
          <Route path="login" element={currentUser ? <Navigate to="/" /> : <Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;