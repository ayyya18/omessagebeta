// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthContextProvider } from './context/AuthContext'; // Import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Bungkus di sini */}
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </React.StrictMode>,
);