// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthContextProvider } from './context/AuthContext';
import { ChatContextProvider } from './context/ChatContext'; // <-- 1. IMPORT BARU

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>
      <ChatContextProvider> {/* <-- 2. BUNGKUS APP DI SINI */}
        <App />
      </ChatContextProvider>
    </AuthContextProvider>
  </React.StrictMode>,
);