// src/pages/ChatHome.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import './ChatHome.css'; // Kita akan tambahkan style baru nanti
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'; // <-- Gunakan ChatContext
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  onSnapshot,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { FiSearch, FiSend, FiLoader } from 'react-icons/fi'; // Ikon

// ==========================================
// KOMPONEN PENCARIAN (BARU)
// ==========================================
const Search = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null); // Hasil pencarian
  const [err, setErr] = useState(false);

  const { currentUser } = useAuth();
  const { dispatch } = useChat();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Buat query untuk mencari user berdasarkan displayName
    // Note: Firestore case-sensitive, jadi 'UserA' != 'usera'
    // Untuk pencarian yang lebih canggih, perlu Algolia/Elasticsearch
    const q = query(
      collection(db, 'users'),
      where('displayName', '==', username.trim())
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErr(true);
        setUser(null);
      } else {
        querySnapshot.forEach((doc) => {
          // Jangan tampilkan diri sendiri di hasil pencarian
          if (doc.data().uid !== currentUser.uid) {
            setUser(doc.data());
          } else {
            setUser(null);
          }
        });
        setErr(false);
      }
    } catch (err) {
      console.error(err);
      setErr(true);
    }
  };

  // Fungsi saat user di hasil pencarian di-klik
  const handleSelect = async () => {
    if (!user) return;

    // Buat ID chat gabungan (konsisten)
    const combinedId =
      currentUser.uid > user.uid
        ? currentUser.uid + user.uid
        : user.uid + currentUser.uid;

    try {
      // Cek apakah 'chats' (ruang obrolan) sudah ada
      const res = await getDoc(doc(db, 'chats', combinedId));

      if (!res.exists()) {
        // Jika belum ada, buat ruang obrolan baru
        await setDoc(doc(db, 'chats', combinedId), { messages: [] });

        // Update 'userChats' untuk *pengguna saat ini*
        await updateDoc(doc(db, 'userChats', currentUser.uid), {
          [combinedId + '.userInfo']: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL || '',
          },
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
        });

        // Update 'userChats' untuk *pengguna yang diajak chat*
        await updateDoc(doc(db, 'userChats', user.uid), {
          [combinedId + '.userInfo']: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL || '',
          },
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
        });
      }

      // Pilih chat ini di Context
      dispatch({ type: 'CHANGE_USER', payload: user });

    } catch (err) {
      console.error("Gagal membuat chat:", err);
    }

    setUser(null); // Tutup hasil pencarian
    setUsername(''); // Kosongkan input
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Cari pengguna (username)..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit"><FiSearch /></button>
      </form>
      {err && <span className="search-error">Pengguna tidak ditemukan</span>}
      {user && (
        <div className="search-result" onClick={handleSelect}>
          {/* <img src={user.photoURL} alt="" /> */}
          <div className="chat-info">
            <span className="chat-name">{user.displayName}</span>
            <span className="chat-last-msg">Mulai obrolan baru</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN DAFTAR CHAT (BARU)
// ==========================================
const ChatList = () => {
  const [chats, setChats] = useState([]);
  const { currentUser } = useAuth();
  const { dispatch, data: chatData } = useChat();

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listener real-time ke 'userChats' milik kita
    const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
      if (doc.exists()) {
        // Ubah data object menjadi array dan urutkan
        const chatEntries = Object.entries(doc.data());
        const sortedChats = chatEntries
          .filter(chat => chat[1].date) // Filter yang mungkin belum lengkap
          .sort((a, b) => b[1].date - a[1].date); // Urutkan terbaru di atas
        setChats(sortedChats);
      }
    });

    return () => unsub();
  }, [currentUser?.uid]); // Jalankan ulang jika user berubah

  const handleSelect = (userInfo) => {
    dispatch({ type: "CHANGE_USER", payload: userInfo });
  };

  return (
    <div className="chat-list">
      {chats.length === 0 && (
        <p className="no-chats">Mulai obrolan baru lewat pencarian</p>
      )}
      {chats.map((chat) => (
        <div
          className={`chat-item ${chat[0] === chatData.chatId ? 'active' : ''}`}
          key={chat[0]}
          onClick={() => handleSelect(chat[1].userInfo)}
        >
          {/* <img src={chat[1].userInfo.photoURL} alt="" /> */}
          <div className="chat-info">
            <span className="chat-name">{chat[1].userInfo.displayName}</span>
            <p className="chat-last-msg">{chat[1].lastMessage?.text || "..."}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// KOMPONEN SIDEBAR (MODIFIKASI)
// ==========================================
const Sidebar = () => {
  const { currentUser } = useAuth();

  const handleLogout = () => {
    signOut(auth);
    // Kita akan otomatis ter-redirect ke /login oleh App.jsx
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>My Chat App</h3>
        <div className="user-profile">
          <span>{currentUser?.displayName || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <Search /> {/* <-- Tambahkan Komponen Search */}
      <ChatList /> {/* <-- Ganti "Obrolan Umum" dengan ChatList */}
    </div>
  );
};

// ==========================================
// KOMPONEN DAFTAR PESAN (MODIFIKASI)
// ==========================================
const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const { data } = useChat(); // Ambil data chat yg aktif
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!data.chatId) {
      setMessages([]); // Kosongkan pesan jika tidak ada chat dipilih
      return;
    }

    // Listener real-time ke sub-koleksi 'messages' di dalam 'chats'
    const q = query(
      collection(db, "chats", data.chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });

    return () => unsub();
  }, [data.chatId]); // Jalankan ulang jika chatId berubah

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Baru saja';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}
        >
          <div className="message-bubble">
            {/* Kita tidak perlu nama pengirim di chat 1-on-1 */}
            <p className="message-text">{msg.text}</p>
            <span className="message-time">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

// ==========================================
// KOMPONEN FORM KIRIM (MODIFIKASI)
// ==========================================
const SendForm = () => {
  const [text, setText] = useState('');
  const { currentUser } = useAuth();
  const { data } = useChat(); // Ambil data chat yg aktif

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() === '' || !currentUser || !data.chatId) return;

    try {
      // Kirim pesan ke sub-koleksi 'messages'
      await addDoc(collection(db, "chats", data.chatId, "messages"), {
        text: text,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // Update 'lastMessage' di 'userChats' untuk kedua pengguna
      await updateDoc(doc(db, "userChats", currentUser.uid), {
        [data.chatId + ".lastMessage"]: { text },
        [data.chatId + ".date"]: serverTimestamp(),
      });
      
      await updateDoc(doc(db, "userChats", data.user.uid), {
        [data.chatId + ".lastMessage"]: { text },
        [data.chatId + ".date"]: serverTimestamp(),
      });

      setText('');
    } catch (err) {
      console.error("Error mengirim pesan: ", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="send-form">
      <input
        type="text"
        placeholder="Ketik pesan Anda..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="primary"><FiSend /></button>
    </form>
  );
};

// ==========================================
// KOMPONEN CHAT WINDOW (MODIFIKASI)
// ==========================================
const ChatWindow = () => {
  const { data } = useChat(); // Ambil data chat yg aktif

  // Jika belum ada chat dipilih, tampilkan placeholder
  if (!data.chatId) {
    return (
      <div className="chat-window placeholder">
        <div className="placeholder-content">
          <FiSend size={50} />
          <h2>Selamat Datang!</h2>
          <p>Cari pengguna untuk memulai obrolan baru.</p>
        </div>
      </div>
    );
  }

  // Jika sudah ada, tampilkan chat
  return (
    <div className="chat-window">
      <div className="chat-header">
        {/* Tampilkan nama user yang kita ajak chat */}
        <h3>{data.user?.displayName || 'Pilih Obrolan'}</h3>
      </div>
      <MessageList />
      <SendForm />
    </div>
  );
};

// ==========================================
// HALAMAN UTAMA (TETAP SAMA)
// ==========================================
const ChatHome = () => {
  return (
    <div className="chat-home-container">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatHome;