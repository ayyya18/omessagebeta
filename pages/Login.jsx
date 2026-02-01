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
import './Login.css'; // Kita akan buat file CSS ini

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Hanya untuk registrasi
  const [handle, setHandle] = useState(''); // Unique user id e.g. @abragaw
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      // Proses Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Pengguna akan diarahkan oleh App.jsx
      } catch (err) {
        setError(err.message);
      }
    } else {
      // Proses Registrasi
      if (!username) {
        setError("Username harus diisi saat registrasi");
        return;
      }
      if (!handle) {
        setError("Handle pengguna harus diisi (contoh: @abragaw)");
        return;
      }
      try {
        // Pastikan handle unik
        const normalizedHandle = handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`;
        const hQuery = query(collection(db, 'users'), where('handle', '==', normalizedHandle));
        const hSnapshot = await getDocs(hQuery);
        if (!hSnapshot.empty) {
          setError('Handle sudah digunakan. Pilih yang lain.');
          return;
        }

        const res = await createUserWithEmailAndPassword(auth, email, password);

        // 1. Update profil di Firebase Auth
        await updateProfile(res.user, {
          displayName: username,
        });

        // 2. Buat dokumen user di Firestore
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          displayName: username,
          email: email,
          photoURL: "",
          bio: "",
          handle: normalizedHandle,
          friends: [],
        });

        // ensure user is indexed for search
        try { await indexUser({ uid: res.user.uid, displayName: username, handle: normalizedHandle, photoURL: '' }); } catch (err) { console.error('indexUser after signup failed', err); }

        // Buat koleksi userChats untuknya
        await setDoc(doc(db, "userChats", res.user.uid), {});

      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}</h2>
        <p>{isLogin ? 'Login untuk melanjutkan' : 'Isi data untuk mendaftar'}</p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Username (unik)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Handle (unik, contoh: @abragaw)"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </>
          )}
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
            {isLogin ? 'Login' : 'Registrasi'}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Registrasi di sini' : 'Login di sini'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;