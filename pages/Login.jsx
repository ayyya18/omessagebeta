// src/pages/Login.jsx
import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, setDoc, query, where, getDocs, collection } from "firebase/firestore";
import { indexUser } from '../utils/searchIndex';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Kita akan buat file CSS ini

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Selamat Datang!</h2>
        <p>Login untuk melanjutkan</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="primary">
            Login
          </button>
        </form>

        <p className="toggle-auth">
          Belum punya akun? <Link to="/register">Registrasi di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;