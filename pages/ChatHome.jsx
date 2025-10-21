// src/pages/ChatHome.jsx
import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './ChatHome.css';
import { useEffect, useRef } from 'react'; // Import useEffect dan useRef
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { db } from '../firebase'; // Import db
import { collection, addDoc, serverTimestamp,  query, orderBy, onSnapshot } from "firebase/firestore"; // Import fungsi firestore
import { useState } from 'react'; // Import useState

// Untuk sementara, kita buat komponen placeholder
const Sidebar = () => {
  const { currentUser } = useAuth(); // Ambil user yang login

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
      <div className="chat-list">
        {/* Nanti di sini daftar obrolan (Pin, Arsip, dll) */}
        <div className="chat-item active">
          <p className="chat-name">Obrolan Umum</p>
          <span className="chat-last-msg">Klik untuk mulai...</span>
        </div>
      </div>
    </div>
  );
};

// Ini komponen utama untuk menampilkan dan mengirim pesan
const ChatWindow = () => {
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Obrolan Umum</h3>
      </div>
      <MessageList />
      <SendForm />
    </div>
  );
};

// Placeholder untuk daftar pesan
const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null); // Untuk auto-scroll

  // Efek untuk auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listener Real-time
  useEffect(() => {
    // Buat query ke koleksi 'messages', urutkan berdasarkan 'createdAt'
    const q = query(collection(db, "messages"), orderBy("createdAt"));

    // onSnapshot adalah listener real-time
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        // Kita tambahkan id dokumennya juga
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });

    // Cleanup listener saat komponen di-unmount
    return () => unsubscribe();
  }, []); // [] berarti efek ini hanya jalan sekali saat komponen mount

  // Fungsi untuk format waktu (sederhana)
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
          // Tentukan apakah pesan 'sent' (terkirim) atau 'received' (diterima)
          className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}
        >
          <div className="message-bubble">
            {/* Tampilkan nama pengirim jika BUKAN pesan kita */}
            {msg.senderId !== currentUser.uid && (
              <p className="message-sender">{msg.senderName}</p>
            )}
            <p className="message-text">{msg.text}</p>
            <span className="message-time">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      ))}
      {/* Elemen kosong untuk auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};

// Placeholder untuk form kirim pesan
const SendForm = () => {
  const [text, setText] = useState('');
  const { currentUser } = useAuth(); // Dapatkan info user

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() === '' || !currentUser) return;

    try {
      // 'messages' adalah nama koleksi kita
      await addDoc(collection(db, "messages"), {
        text: text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        createdAt: serverTimestamp(), // Waktu dari server, BUKAN dari klien
      });
      setText(''); // Kosongkan input setelah terkirim
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
      <button type="submit" className="primary">Kirim</button>
    </form>
  );
};

// Halaman utama
const ChatHome = () => {
  return (
    <div className="chat-home-container">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatHome;