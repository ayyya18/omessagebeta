import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, setDoc, query, where, getDocs, collection } from "firebase/firestore";
import { indexUser } from '../utils/searchIndex';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Re-use Login styles

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [handle, setHandle] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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

            // Redirect to home/chat
            navigate('/');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Buat Akun Baru</h2>
                <p>Isi data untuk mendaftar</p>

                <form onSubmit={handleSubmit}>
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
                        Registrasi
                    </button>
                </form>

                <p className="toggle-auth">
                    Sudah punya akun? <Link to="/login">Login di sini</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
