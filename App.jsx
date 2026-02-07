// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatHome from "./pages/ChatHome";
import CalendarHome from "./pages/CalendarHome";
import DashboardHome from "./pages/DashboardHome";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TaskProvider } from "./context/TaskContext";
import { FiLoader } from "react-icons/fi";
import WorkspaceHome from "./pages/Workspace/WorkspaceHome";

import { WorkspaceProvider } from "./context/WorkspaceContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CommentsProvider } from "./context/CommentsContext";
import { FileStorageProvider } from "./context/FileStorageContext";
import { TemplatesProvider } from "./context/TemplatesContext";
import { CustomFieldsProvider } from "./context/CustomFieldsContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { TimeTrackingProvider } from "./context/TimeTrackingContext";
import { AutomationProvider } from "./context/AutomationContext";
import { TaskDependenciesProvider } from "./context/TaskDependenciesContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { CollaborationProvider } from "./context/CollaborationContext";
import { SettingsProvider } from "./context/SettingsContext";
import GlobalSearchModal from "./components/Search/GlobalSearchModal";
import { useState, useEffect } from "react";

function App() {
  const { currentUser, loading } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <SettingsProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <TaskProvider>
            <NotificationProvider>
              <CommentsProvider>
                <FileStorageProvider>
                  <TemplatesProvider>
                    <CustomFieldsProvider>
                      <PermissionsProvider>
                        <TimeTrackingProvider>
                          <AutomationProvider>
                            <TaskDependenciesProvider>
                              <AnalyticsProvider>
                                <CollaborationProvider>
                                  <BrowserRouter>
                                    <GlobalSearchModal show={showSearch} onClose={() => setShowSearch(false)} />
                                    <Routes>
                                      <Route path="/login" element={<Login />} />
                                      <Route path="/register" element={<Register />} />
                                      <Route
                                        path="/chat"
                                        element={
                                          <ProtectedRoute>
                                            <ChatHome />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path="/calendar"
                                        element={
                                          <ProtectedRoute>
                                            <CalendarHome />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path="/"
                                        element={
                                          <ProtectedRoute>
                                            <DashboardHome />
                                          </ProtectedRoute>
                                        }
                                      />
                                      <Route
                                        path="/workspace"
                                        element={
                                          <ProtectedRoute>
                                            <WorkspaceHome />
                                          </ProtectedRoute>
                                        }
                                      />
                                    </Routes>
                                  </BrowserRouter>
                                </CollaborationProvider>
                              </AnalyticsProvider>
                            </TaskDependenciesProvider>
                          </AutomationProvider>
                        </TimeTrackingProvider>
                      </PermissionsProvider>
                    </CustomFieldsProvider>
                  </TemplatesProvider>
                </FileStorageProvider>
              </CommentsProvider>
            </NotificationProvider>
          </TaskProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;