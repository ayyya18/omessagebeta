// src/pages/ChatHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import './ChatHome.css';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
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
  FieldValue, // <-- Pastikan ini di-import dari langkah sebelumnya
} from 'firebase/firestore';
import { 
  FiSearch, FiSend, FiPaperclip, FiLoader, FiFile, FiUser, FiUsers, FiSmile,
  FiMoreVertical, FiEdit2, FiTrash2 // <-- Ikon untuk menu
} from 'react-icons/fi'; 
import Picker from 'emoji-picker-react';

import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';

const CLOUDINARY_CLOUD_NAME = "dca2fjndp"; 
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset"; 

// Komponen 'Avatar' (Tidak berubah)
const Avatar = ({ src, alt, size = 44, isGroup = false }) => {
  const placeholder = isGroup ? 
    <FiUsers size={size * 0.6} /> : 
    (alt[0] || '?');
  return (
    <div className="avatar-container" style={{ width: `${size}px`, height: `${size}px` }}>
      {src ? (
        <img src={src} alt={alt} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">{placeholder}</div>
      )}
    </div>
  );
};

const Search = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null); 
  const [err, setErr] = useState(false);
  const { currentUser } = useAuth();
  const { dispatch } = useChat();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const q = query(collection(db, 'users'), where('displayName', '==', username.trim()));
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { setErr(true); setUser(null); }
      else {
        querySnapshot.forEach((doc) => {
          if (doc.data().uid !== currentUser.uid) setUser(doc.data());
          else setUser(null);
        });
        setErr(false);
      }
    } catch (err) { console.error(err); setErr(true); }
  };
  const handleSelect = async () => {
    if (!user) return;
    const combinedId = currentUser.uid > user.uid ? currentUser.uid + user.uid : user.uid + currentUser.uid;
    try {
      const res = await getDoc(doc(db, 'chats', combinedId));
      if (!res.exists()) {
        await setDoc(doc(db, 'chats', combinedId), { messages: [] });
        await updateDoc(doc(db, 'userChats', currentUser.uid), {
          [combinedId + '.userInfo']: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' },
          [combinedId + '.isGroup']: false,
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
        });
        await updateDoc(doc(db, 'userChats', user.uid), {
          [combinedId + '.userInfo']: { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || '' },
          [combinedId + '.isGroup']: false,
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
        });
      }
      dispatch({ type: 'CHANGE_USER', payload: user });
    } catch (err) { console.error("Gagal membuat chat:", err); }
    setUser(null); setUsername('');
  };
  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input type="text" placeholder="Cari pengguna (username)..." value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="submit"><FiSearch /></button>
      </form>
      {err && <span className="search-error">Pengguna tidak ditemukan</span>}
      {user && (
        <div className="search-result" onClick={handleSelect}>
          <Avatar src={user.photoURL} alt={user.displayName} size={40} />
          <div className="chat-info">
            <span className="chat-name">{user.displayName}</span>
            <span className="chat-last-msg">Mulai obrolan baru</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const { currentUser } = useAuth();
  const { dispatch, data: chatData } = useChat();
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
      if (doc.exists()) {
        const chatEntries = Object.entries(doc.data());
        const sortedChats = chatEntries.filter(chat => chat[1] && chat[1].date).sort((a, b) => b[1].date - a[1].date);
        setChats(sortedChats);
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);
  const handleSelect = (chatInfo) => {
    if (chatInfo.isGroup) dispatch({ type: "CHANGE_USER", payload: chatInfo });
    else dispatch({ type: "CHANGE_USER", payload: chatInfo.userInfo });
  };
  const renderLastMessage = (msg) => {
    if (!msg) return "...";
    // === TAMBAHAN BARU ===
    if (msg.isDeleted) return "Pesan telah dihapus"; 
    // ======================
    if (msg.fileType === 'image') return "🖼️ Foto";
    if (msg.fileType === 'video') return "📹 Video";
    if (msg.fileType === 'raw') return "📄 File";
    if (msg.text) return msg.text;
    return "...";
  }
  return (
    <div className="chat-list">
      {chats.length === 0 && <p className="no-chats">Mulai obrolan baru lewat pencarian</p>}
      {chats.map((chat) => (
        <div className={`chat-item ${chat[0] === chatData.chatId ? 'active' : ''}`} key={chat[0]} onClick={() => handleSelect(chat[1])}>
          <Avatar src={chat[1].userInfo.photoURL} alt={chat[1].userInfo.displayName} isGroup={chat[1].isGroup} />
          <div className="chat-info">
            <span className="chat-name">{chat[1].userInfo.displayName}</span>
            <p className="chat-last-msg">{renderLastMessage(chat[1].lastMessage)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Sidebar = () => {
  const { currentUser } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const handleLogout = () => { signOut(auth); };
  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h3>My Chat App</h3>
            <button onClick={() => setIsGroupModalOpen(true)} className="profile-btn" title="Buat Grup Baru"><FiUsers /></button>
          </div>
          <div className="user-profile">
            <Avatar src={currentUser?.photoURL} alt={currentUser?.displayName || 'U'} size={24} />
            <span className="user-profile-name">{currentUser?.displayName || 'User'}</span>
            <button onClick={() => setIsProfileModalOpen(true)} className="profile-btn" title="Atur Profil"><FiUser /></button>
            <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
          </div>
        </div>
        <Search />
        <ChatList />
      </div>
      <ProfileModal show={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <CreateGroupModal show={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </>
  );
};

const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const messagesEndRef = useRef(null);
  
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);

  // === STATE BARU untuk Edit/Hapus ===
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null); // Menu '...'
  const [editingMsgId, setEditingMsgId] = useState(null); // Pesan yg diedit
  const [editingText, setEditingText] = useState("");      // Teks di form edit
  const menuRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setReactionPickerMsgId(null);
    setMenuOpenMsgId(null); // <-- Reset menu
    setEditingMsgId(null);  // <-- Reset edit
    
    if (!data.chatId) {
      setMessages([]);
      return;
    }
    const collectionPath = data.isGroup ? "groups" : "chats";
    const q = query(collection(db, collectionPath, data.chatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });
    return () => unsub();
  }, [data.chatId, data.isGroup]);

  // Efek menutup menu saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenMsgId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  // Fungsi helper untuk update 'lastMessage' di semua chat anggota
  const updateLastMessageForAll = async (lastMessageData) => {
    if (data.isGroup) {
      const groupDoc = await getDoc(doc(db, "groups", data.chatId));
      const members = groupDoc.data().members || [];
      for (const uid of members) {
        await updateDoc(doc(db, "userChats", uid), {
          [data.chatId + ".lastMessage"]: lastMessageData,
          [data.chatId + ".date"]: serverTimestamp(),
        });
      }
    } else {
      await updateDoc(doc(db, "userChats", currentUser.uid), {
        [data.chatId + ".lastMessage"]: lastMessageData,
        [data.chatId + ".date"]: serverTimestamp(),
      });
      await updateDoc(doc(db, "userChats", data.user.uid), {
        [data.chatId + ".lastMessage"]: lastMessageData,
        [data.chatId + ".date"]: serverTimestamp(),
      });
    }
  };
  
  // --- FUNGSI BARU: Hapus Pesan (Soft Delete) ---
  const handleDelete = async (msg) => {
    const collectionPath = data.isGroup ? "groups" : "chats";
    const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id);
    try {
      await updateDoc(msgRef, {
        text: "Pesan ini telah dihapus",
        isDeleted: true,
        fileURL: null,
        fileType: null,
        fileName: null,
        reactions: {}, // Hapus semua reaksi
      });
      // Update lastMessage
      await updateLastMessageForAll({ text: "Pesan ini telah dihapus", isDeleted: true });
    } catch (err) {
      console.error("Gagal menghapus pesan:", err);
    }
    setMenuOpenMsgId(null);
  };

  // --- FUNGSI BARU: Buka Mode Edit ---
  const openEditMode = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text); // Hanya edit teks
    setMenuOpenMsgId(null);
  };

  // --- FUNGSI BARU: Simpan Edit ---
  const handleSaveEdit = async (msg) => {
    if (editingText.trim() === '') return; // Jangan simpan jika kosong
    
    const collectionPath = data.isGroup ? "groups" : "chats";
    const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id);
    try {
      await updateDoc(msgRef, {
        text: editingText,
        isEdited: true,
        editedAt: serverTimestamp(),
      });
      // Update lastMessage
      await updateLastMessageForAll({ text: editingText, fileType: msg.fileType });
    } catch (err) {
      console.error("Gagal mengedit pesan:", err);
    }
    setEditingMsgId(null);
    setEditingText("");
  };

  // Komponen inline baru untuk Editor Pesan
  const MessageEditor = ({ msg }) => (
    <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(msg); }}>
      <input
        type="text"
        value={editingText}
        onChange={(e) => setEditingText(e.target.value)}
        autoFocus
        onBlur={() => setEditingMsgId(null)} // Batal jika klik di luar
      />
      <div className="edit-form-buttons">
        <button type="button" className="cancel" onClick={() => setEditingMsgId(null)}>Batal</button>
        <button type="submit" className="save">Simpan</button>
      </div>
    </form>
  );

  // Fungsi reaksi (dari langkah sebelumnya)
  const handleReaction = async (emoji, msg) => {
    const collectionPath = data.isGroup ? "groups" : "chats";
    const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id);
    try {
      const docSnap = await getDoc(msgRef);
      if (!docSnap.exists() || docSnap.data().isDeleted) return; // Jangan bereaksi pada pesan terhapus

      const reactions = docSnap.data().reactions || {};
      
      // Logika arrayUnion/arrayRemove tidak berfungsi baik dengan state React
      // Kita baca, modifikasi, lalu tulis ulang
      let currentReactionList = reactions[emoji.emoji] || [];
      if (currentReactionList.includes(currentUser.uid)) {
        // Hapus
        currentReactionList = currentReactionList.filter(uid => uid !== currentUser.uid);
      } else {
        // Tambah
        currentReactionList.push(currentUser.uid);
      }
      
      if (currentReactionList.length === 0) {
        delete reactions[emoji.emoji]; // Hapus key jika array kosong
      } else {
        reactions[emoji.emoji] = currentReactionList;
      }
      
      await updateDoc(msgRef, { reactions: reactions });

    } catch (err) {
      console.error("Gagal menambah reaksi: ", err);
    }
    setReactionPickerMsgId(null);
  };
  
  // Render reaksi (dari langkah sebelumnya)
  const RenderReactions = ({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) {
      return null;
    }
    return (
      <div className="reactions-container">
        {Object.entries(reactions)
          .filter(([emoji, uids]) => uids && uids.length > 0)
          .map(([emoji, uids]) => (
            <span key={emoji} className="reaction-tag">
              {emoji} {uids.length}
            </span>
          ))
        }
      </div>
    );
  };
  
  // Format waktu (dari langkah sebelumnya)
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Baru saja';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Komponen Konten Pesan (MODIFIKASI: Cek isDeleted)
  const MessageContent = ({ msg }) => {
    // Tampilkan pesan terhapus
    if (msg.isDeleted) {
      return (
        <p className="message-text deleted">
          <FiTrash2 size={14} /> Pesan ini telah dihapus
        </p>
      );
    }
    // Tampilkan media (logika sama)
    switch (msg.fileType) {
      case 'image': return (<> <img src={msg.fileURL} alt="Kiriman gambar" className="message-image" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
      case 'video': return (<> <video src={msg.fileURL} controls className="message-video" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
      case 'raw': case 'auto': return (<> <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="message-file"> <FiFile size={24} /> <span>{msg.fileName || 'File Terlampir'}</span> </a> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
      default: return <p className="message-text">{msg.text}</p>;
    }
  };

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
          <div className="message-bubble-wrapper">
            
            {/* === Tombol Opsi (...) & Menu Edit/Hapus === */}
            {msg.senderId === currentUser.uid && !msg.isDeleted && !editingMsgId && (
              <button 
                className="more-btn" 
                title="Opsi"
                onClick={() => setMenuOpenMsgId(msg.id === menuOpenMsgId ? null : msg.id)}
              >
                <FiMoreVertical />
              </button>
            )}
            {menuOpenMsgId === msg.id && (
              <div className="message-menu" ref={menuRef}>
                {/* Hanya izinkan edit pesan teks (bukan caption file) */}
                {msg.text && !msg.fileURL && (
                  <button onClick={() => openEditMode(msg)}><FiEdit2 /> Edit</button>
                )}
                <button onClick={() => handleDelete(msg)} className="delete"><FiTrash2 /> Hapus</button>
              </div>
            )}
            {/* ============================================= */}

            <div className="message-bubble">
              {/* Tombol Reaksi */}
              {!msg.isDeleted && !editingMsgId && (
                <button 
                  className="reaction-btn" 
                  onClick={() => setReactionPickerMsgId(msg.id === reactionPickerMsgId ? null : msg.id)}
                >
                  <FiSmile />
                </button>
              )}
              {reactionPickerMsgId === msg.id && (
                <div className="reaction-picker-popup">
                  <Picker 
                    onEmojiClick={(emoji) => handleReaction(emoji, msg)} 
                    pickerStyle={{ width: '250px', height: '200px' }} 
                    disableSearchBar
                    disableSkinTonePicker
                    groupVisibility={{
                      recently_used: false, smileys_emotion: true, animals_nature: false,
                      food_drink: false, travel_places: false, activities: false,
                      objects: false, symbols: false, flags: false,
                    }}
                    preload
                  />
                </div>
              )}
              
              {/* === Tampilkan Editor atau Konten === */}
              {editingMsgId === msg.id ? (
                <MessageEditor msg={msg} />
              ) : (
                <>
                  {data.isGroup && msg.senderId !== currentUser.uid && !msg.isDeleted && (
                    <p className="message-sender">{msg.senderName || 'User'}</p>
                  )}
                  <MessageContent msg={msg} />
                  <span className="message-time">
                    {formatTime(msg.createdAt)}
                    {/* Tampilkan status (edited) */}
                    {msg.isEdited && !msg.isDeleted && <span className="edited-tag">(edited)</span>}
                  </span>
                </>
              )}
              {/* =================================== */}
            </div>
            
            {/* Render Reaksi */}
            <RenderReactions reactions={msg.reactions} />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

const SendForm = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const pickerRef = useRef(null);

  const onEmojiClick = (emojiObject) => {
    setText(prevText => prevText + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerRef]);
  const handleFileChange = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    let resourceType = 'auto';
    if (file.type.startsWith('image/')) resourceType = 'image';
    if (file.type.startsWith('video/')) resourceType = 'video';
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return { url: data.secure_url, type: data.resource_type, name: file.name };
    } catch (err) { console.error("Cloudinary upload error:", err); return null; }
  };
  
  // Helper function updateLastMessage (dipakai di handleSubmit)
  const updateLastMessageForAll = async (lastMessageData) => {
    if (!data.chatId) return;
    try {
      if (data.isGroup) {
        const groupDoc = await getDoc(doc(db, "groups", data.chatId));
        const members = groupDoc.data().members || [];
        for (const uid of members) {
          await updateDoc(doc(db, "userChats", uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() });
        }
      } else {
        await updateDoc(doc(db, "userChats", currentUser.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() });
        await updateDoc(doc(db, "userChats", data.user.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() });
      }
    } catch (err) {
      console.error("Gagal update lastMessage di SendForm: ", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() === '' && !file) return;
    if (!currentUser || !data.chatId) return;
    setIsUploading(true);
    let fileURL = null, fileType = null, fileName = null;
    if (file) {
      const uploadResult = await uploadFile();
      if (uploadResult) { fileURL = uploadResult.url; fileType = uploadResult.type; fileName = uploadResult.name; }
      else { setIsUploading(false); alert("Gagal mengupload file."); return; }
    }
    const collectionPath = data.isGroup ? "groups" : "chats";
    const messageData = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      createdAt: serverTimestamp(),
      text: text,
      fileURL: fileURL, fileType: fileType, fileName: fileName,
      reactions: {},
      isDeleted: false, // <-- Tambah state awal
      isEdited: false, // <-- Tambah state awal
    };
    try {
      await addDoc(collection(db, collectionPath, data.chatId, "messages"), messageData);
      const lastMessageData = { 
        text: text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? "🖼️ Foto" : "📹 Video")),
        fileType: fileType,
        isDeleted: false // <-- Tambah state awal
      };
      await updateLastMessageForAll(lastMessageData); // Gunakan fungsi helper
    } catch (err) { console.error("Error mengirim pesan: ", err); }
    setText(''); setFile(null);
    if (document.getElementById('file-upload')) document.getElementById('file-upload').value = null;
    setIsUploading(false);
  };

  return (
    <>
      {file && !isUploading && (
        <div className="file-preview">
          <span>File terpilih: {file.name}</span>
          <button onClick={() => { setFile(null); document.getElementById('file-upload').value = null; }}>X</button>
        </div>
      )}
      <div className="send-form-wrapper">
        {showEmojiPicker && (
          <div ref={pickerRef} className="emoji-picker-input-container">
            <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%', boxShadow: 'none' }} preload />
          </div>
        )}
        <form onSubmit={handleSubmit} className="send-form">
          <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
          <label htmlFor="file-upload" className="attach-btn" title="Lampirkan File"><FiPaperclip size={20} /></label>
          <button type="button" className="attach-btn" title="Pilih Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile size={20} /></button>
          <input type="text" placeholder="Ketik pesan atau caption..." value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setShowEmojiPicker(false)} disabled={isUploading} />
          <button type="submit" className="primary" disabled={isUploading}>
            {isUploading ? <FiLoader className="loading-spinner-btn" /> : <FiSend />}
          </button>
        </form>
      </div>
    </>
  );
};

const ChatWindow = () => {
  const { data } = useChat(); 
  if (!data.chatId) {
    return (
      <div className="chat-window placeholder">
        <div className="placeholder-content">
          <FiSend size={50} />
          <h2>Selamat Datang!</h2>
          <p>Pilih obrolan atau buat grup baru untuk memulai.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="chat-window">
      <div className="chat-header">
        <Avatar src={data.user?.photoURL} alt={data.user?.displayName || 'C'} size={40} isGroup={data.isGroup} />
        <h3>{data.user?.displayName || 'Pilih Obrolan'}</h3>
      </div>
      <MessageList />
      <SendForm />
    </div>
  );
};

const ChatHome = () => {
  return (
    <div className="chat-home-container">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatHome;