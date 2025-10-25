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
  FieldValue, // <-- Pastikan ini di-import
} from 'firebase/firestore';
// Import ikon baru
import {
  FiSearch, FiSend, FiPaperclip, FiLoader, FiFile, FiUser, FiUsers, FiSmile,
  FiMoreVertical, FiEdit2, FiTrash2,
  FiCornerUpLeft, FiX // <-- Ikon untuk Balas & Batal
} from 'react-icons/fi';

// IMPORT PICKER
import Picker from 'emoji-picker-react';

// IMPORT MODAL
import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';

// ==========================================
// KONFIGURASI CLOUDINARY
// (Pastikan ini sudah Anda isi!)
// ==========================================
const CLOUDINARY_CLOUD_NAME = "dca2fjndp";
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset";

// Komponen 'Avatar'
const Avatar = ({ src, alt, size = 44, isGroup = false }) => {
  const placeholder = isGroup ?
    <FiUsers size={size * 0.6} /> :
    (alt?.[0]?.toUpperCase() || '?'); // Perbaikan: handle alt kosong & uppercase
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

// ==========================================
// KOMPONEN PENCARIAN (Search)
// ==========================================
const Search = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);
  const { currentUser } = useAuth();
  const { dispatch } = useChat();
  const handleSearch = async (e) => { e.preventDefault(); if (!username.trim()) return; const q = query(collection(db, 'users'), where('displayName', '==', username.trim())); try { const querySnapshot = await getDocs(q); if (querySnapshot.empty) { setErr(true); setUser(null); } else { querySnapshot.forEach((doc) => { if (doc.data().uid !== currentUser.uid) setUser(doc.data()); else setUser(null); }); setErr(false); } } catch (err) { console.error(err); setErr(true); } };
  const handleSelect = async () => { if (!user) return; const combinedId = currentUser.uid > user.uid ? currentUser.uid + user.uid : user.uid + currentUser.uid; try { const res = await getDoc(doc(db, 'chats', combinedId)); if (!res.exists()) { await setDoc(doc(db, 'chats', combinedId), { messages: [] }); await updateDoc(doc(db, 'userChats', currentUser.uid), { [combinedId + '.userInfo']: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' }, [combinedId + '.isGroup']: false, [combinedId + '.date']: serverTimestamp(), [combinedId + '.lastMessage']: { text: "" }, }); await updateDoc(doc(db, 'userChats', user.uid), { [combinedId + '.userInfo']: { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || '' }, [combinedId + '.isGroup']: false, [combinedId + '.date']: serverTimestamp(), [combinedId + '.lastMessage']: { text: "" }, }); } dispatch({ type: 'CHANGE_USER', payload: user }); } catch (err) { console.error("Gagal membuat chat:", err); } setUser(null); setUsername(''); };
  return ( <div className="search-container"> <form onSubmit={handleSearch} className="search-form"> <input type="text" placeholder="Cari pengguna (username)..." value={username} onChange={(e) => setUsername(e.target.value)} /> <button type="submit"><FiSearch /></button> </form> {err && <span className="search-error">Pengguna tidak ditemukan</span>} {user && ( <div className="search-result" onClick={handleSelect}> <Avatar src={user.photoURL} alt={user.displayName} size={40} /> <div className="chat-info"> <span className="chat-name">{user.displayName}</span> <span className="chat-last-msg">Mulai obrolan baru</span> </div> </div> )} </div> );
};

// ==========================================
// KOMPONEN DAFTAR CHAT (ChatList)
// ==========================================
const ChatList = () => {
  const [chats, setChats] = useState([]); const { currentUser } = useAuth(); const { dispatch, data: chatData } = useChat(); useEffect(() => { if (!currentUser?.uid) return; const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => { if (doc.exists()) { const chatEntries = Object.entries(doc.data()); const sortedChats = chatEntries.filter(chat => chat[1] && chat[1].date).sort((a, b) => b[1].date - a[1].date); setChats(sortedChats); } }); return () => unsub(); }, [currentUser?.uid]); const handleSelect = (chatInfo) => { if (chatInfo.isGroup) dispatch({ type: "CHANGE_USER", payload: chatInfo }); else dispatch({ type: "CHANGE_USER", payload: chatInfo.userInfo }); }; const renderLastMessage = (msg) => { if (!msg) return "..."; if (msg.isDeleted) return "Pesan telah dihapus"; if (msg.fileType === 'image') return "🖼️ Foto"; if (msg.fileType === 'video') return "📹 Video"; if (msg.fileType === 'raw' || msg.fileType === 'auto') return "📄 File"; if (msg.text) return msg.text; return "..."; }
  return ( <div className="chat-list"> {chats.length === 0 && <p className="no-chats">Mulai obrolan baru lewat pencarian</p>} {chats.map((chat) => ( <div className={`chat-item ${chat[0] === chatData.chatId ? 'active' : ''}`} key={chat[0]} onClick={() => handleSelect(chat[1])}> <Avatar src={chat[1].userInfo.photoURL} alt={chat[1].userInfo.displayName} isGroup={chat[1].isGroup} /> <div className="chat-info"> <span className="chat-name">{chat[1].userInfo.displayName}</span> <p className="chat-last-msg">{renderLastMessage(chat[1].lastMessage)}</p> </div> </div> ))} </div> );
};

// ==========================================
// KOMPONEN SIDEBAR
// ==========================================
const Sidebar = () => {
  const { currentUser } = useAuth(); const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); const handleLogout = () => { signOut(auth); };
  return ( <> <div className="sidebar"> <div className="sidebar-header"> <div className="sidebar-header-top"> <h3>My Chat App</h3> <button onClick={() => setIsGroupModalOpen(true)} className="profile-btn" title="Buat Grup Baru"><FiUsers /></button> </div> <div className="user-profile"> <Avatar src={currentUser?.photoURL} alt={currentUser?.displayName || 'U'} size={24} /> <span className="user-profile-name">{currentUser?.displayName || 'User'}</span> <button onClick={() => setIsProfileModalOpen(true)} className="profile-btn" title="Atur Profil"><FiUser /></button> <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button> </div> </div> <Search /> <ChatList /> </div> <ProfileModal show={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} /> <CreateGroupModal show={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} /> </> );
};

// ==========================================
// KOMPONEN DAFTAR PESAN (MessageList)
// (Gabungan Emoji/Reaksi + Edit/Hapus + Balas)
// ==========================================
const MessageList = ({ setReplyingTo }) => { // <-- Terima prop setReplyingTo
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const messagesEndRef = useRef(null);

  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const menuRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    setReactionPickerMsgId(null); setMenuOpenMsgId(null); setEditingMsgId(null);
    if (!data.chatId) { setMessages([]); return; }
    const collectionPath = data.isGroup ? "groups" : "chats";
    const q = query(collection(db, collectionPath, data.chatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => { newMessages.push({ id: doc.id, ...doc.data() }); });
      setMessages(newMessages);
    });
    return () => unsub();
  }, [data.chatId, data.isGroup]);

  useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpenMsgId(null); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [menuRef]);

  const updateLastMessageForAll = async (lastMessageData) => { if (!data.chatId) return; try { if (data.isGroup) { const groupDoc = await getDoc(doc(db, "groups", data.chatId)); if (!groupDoc.exists()) return; const members = groupDoc.data().members || []; for (const uid of members) { await updateDoc(doc(db, "userChats", uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp(), }); } } else { await updateDoc(doc(db, "userChats", currentUser.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp(), }); if (data.user?.uid) { await updateDoc(doc(db, "userChats", data.user.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp(), }); } } } catch(err) { console.error("Gagal update lastMessage: ", err); } };
  const handleDelete = async (msg) => { const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); try { await updateDoc(msgRef, { text: "Pesan ini telah dihapus", isDeleted: true, fileURL: null, fileType: null, fileName: null, reactions: {}, }); await updateLastMessageForAll({ text: "Pesan ini telah dihapus", isDeleted: true }); } catch (err) { console.error("Gagal menghapus pesan:", err); } setMenuOpenMsgId(null); };
  const openEditMode = (msg) => { setEditingMsgId(msg.id); setEditingText(msg.text); setMenuOpenMsgId(null); };
  const handleSaveEdit = async (msg) => { if (editingText.trim() === '') return; const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); try { await updateDoc(msgRef, { text: editingText, isEdited: true, editedAt: serverTimestamp() }); await updateLastMessageForAll({ text: editingText, fileType: msg.fileType }); } catch (err) { console.error("Gagal mengedit pesan:", err); } setEditingMsgId(null); setEditingText(""); };
  const MessageEditor = ({ msg }) => ( <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(msg); }}> <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus onBlur={() => setEditingMsgId(null)} /> <div className="edit-form-buttons"> <button type="button" className="cancel" onClick={() => setEditingMsgId(null)}>Batal</button> <button type="submit" className="save">Simpan</button> </div> </form> );
  const handleReaction = async (emoji, msg) => { const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); try { const docSnap = await getDoc(msgRef); if (!docSnap.exists() || docSnap.data().isDeleted) return; const reactionKey = `reactions.${emoji.emoji}`; const reactions = docSnap.data().reactions || {}; const userList = reactions[emoji.emoji] || []; if (userList.includes(currentUser.uid)) { await updateDoc(msgRef, { [reactionKey]: FieldValue.arrayRemove(currentUser.uid) }); const updatedSnap = await getDoc(msgRef); const updatedList = updatedSnap.data().reactions?.[emoji.emoji]; if (updatedList && updatedList.length === 0) { await updateDoc(msgRef, { [`reactions.${emoji.emoji}`]: FieldValue.delete() }); } } else { await updateDoc(msgRef, { [reactionKey]: FieldValue.arrayUnion(currentUser.uid) }); } } catch (err) { console.error("Gagal menambah/menghapus reaksi: ", err); } setReactionPickerMsgId(null); };
  const RenderReactions = ({ reactions }) => { if (!reactions || Object.keys(reactions).length === 0) return null; return ( <div className="reactions-container"> {Object.entries(reactions).filter(([emoji, uids]) => uids && uids.length > 0).map(([emoji, uids]) => ( <span key={emoji} className="reaction-tag">{emoji} {uids.length}</span> ))} </div> ); };
  const formatTime = (timestamp) => { if (!timestamp) return 'Baru saja'; const date = timestamp.toDate(); return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); };

  // --- Fungsi Balas ---
  const handleReply = (msg) => {
    const replyData = {
      messageId: msg.id,
      senderName: msg.senderName || 'User',
      textSnippet: msg.text ? (msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text)
                  : (msg.fileName ? `📄 ${msg.fileName}` : (msg.fileType === 'image' ? '🖼️ Foto' : (msg.fileType === 'video' ? '📹 Video' : 'File'))),
      fileType: msg.fileType
    };
    setReplyingTo(replyData);
  };

  // --- Komponen Kutipan Balasan ---
  const ReplyQuote = ({ replyData }) => {
    if (!replyData) return null;
    let icon = null;
    if (replyData.fileType === 'image') icon = "🖼️ ";
    else if (replyData.fileType === 'video') icon = "📹 ";
    else if (replyData.fileType === 'raw' || replyData.fileType === 'auto') icon = "📄 ";
    return (
      <div className="reply-quote">
        <div className="reply-quote-sender">{replyData.senderName}</div>
        <div className="reply-quote-text">{icon}{replyData.textSnippet}</div>
      </div>
    );
  };

  // Komponen Konten Pesan (Dengan Kutipan Balasan)
  const MessageContent = ({ msg }) => {
    if (msg.isDeleted) { return ( <p className="message-text deleted"> <FiTrash2 size={14} /> Pesan ini telah dihapus </p> ); }
    let originalContent;
    switch (msg.fileType) {
      case 'image': originalContent = (<> <img src={msg.fileURL} alt="Kiriman gambar" className="message-image" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break;
      case 'video': originalContent = (<> <video src={msg.fileURL} controls className="message-video" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break;
      case 'raw': case 'auto': originalContent = (<> <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="message-file"> <FiFile size={24} /> <span>{msg.fileName || 'File Terlampir'}</span> </a> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break;
      default: originalContent = <p className="message-text">{msg.text}</p>; break;
    }
    return ( <> <ReplyQuote replyData={msg.replyingTo} /> {originalContent} </> );
  };

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
          <div className="message-bubble-wrapper">
            {msg.senderId === currentUser.uid && !msg.isDeleted && !editingMsgId && (<button className="more-btn" title="Opsi" onClick={() => setMenuOpenMsgId(msg.id === menuOpenMsgId ? null : msg.id)}><FiMoreVertical /></button>)}
            {menuOpenMsgId === msg.id && (<div className="message-menu" ref={menuRef}> {msg.text && !msg.fileURL && (<button onClick={() => openEditMode(msg)}><FiEdit2 /> Edit</button>)} <button onClick={() => handleDelete(msg)} className="delete"><FiTrash2 /> Hapus</button> </div>)}
            <div className="message-bubble">
              {/* Tombol Balas Baru */}
              {!msg.isDeleted && !editingMsgId && ( <button className="reply-btn" title="Balas" onClick={() => handleReply(msg)}> <FiCornerUpLeft /> </button> )}
              {/* Tombol Reaksi */}
              {!msg.isDeleted && !editingMsgId && ( <button className="reaction-btn" onClick={() => setReactionPickerMsgId(msg.id === reactionPickerMsgId ? null : msg.id)}><FiSmile /></button> )}
              {reactionPickerMsgId === msg.id && ( <div className="reaction-picker-popup"> <Picker onEmojiClick={(emoji) => handleReaction(emoji, msg)} pickerStyle={{ width: '250px', height: '200px' }} disableSearchBar disableSkinTonePicker groupVisibility={{ recently_used: false, smileys_emotion: true, animals_nature: false, food_drink: false, travel_places: false, activities: false, objects: false, symbols: false, flags: false, }} preload /> </div> )}
              {editingMsgId === msg.id ? ( <MessageEditor msg={msg} /> ) : ( <> {data.isGroup && msg.senderId !== currentUser.uid && !msg.isDeleted && (<p className="message-sender">{msg.senderName || 'User'}</p>)} <MessageContent msg={msg} /> <span className="message-time"> {formatTime(msg.createdAt)} {msg.isEdited && !msg.isDeleted && <span className="edited-tag">(edited)</span>} </span> </> )}
            </div>
            <RenderReactions reactions={msg.reactions} />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};


// ==========================================
// KOMPONEN FORM KIRIM (SendForm)
// (MODIFIKASI: Tambah state & preview balasan)
// ==========================================
const SendForm = ({ replyingTo, setReplyingTo }) => { // <-- Terima props
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const pickerRef = useRef(null);
  const inputRef = useRef(null); // Ref untuk fokus input

  useEffect(() => { if (replyingTo) { inputRef.current?.focus(); } }, [replyingTo]);
  const onEmojiClick = (emojiObject) => { setText(prevText => prevText + emojiObject.emoji); setShowEmojiPicker(false); };
  useEffect(() => { const handleClickOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowEmojiPicker(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [pickerRef]);
  const handleFileChange = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };
  const uploadFile = async () => { const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); let resourceType = 'auto'; if (file.type.startsWith('image/')) resourceType = 'image'; if (file.type.startsWith('video/')) resourceType = 'video'; try { const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData }); const data = await res.json(); if (data.error) throw new Error(data.error.message); return { url: data.secure_url, type: data.resource_type, name: file.name }; } catch (err) { console.error("Cloudinary upload error:", err); return null; } };
  const updateLastMessageForAll = async (lastMessageData) => { if (!data.chatId) return; try { if (data.isGroup) { const groupDoc = await getDoc(doc(db, "groups", data.chatId)); if (!groupDoc.exists()) return; const members = groupDoc.data().members || []; for (const uid of members) { await updateDoc(doc(db, "userChats", uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() }); } } else { await updateDoc(doc(db, "userChats", currentUser.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() }); if (data.user?.uid) { await updateDoc(doc(db, "userChats", data.user.uid), { [data.chatId + ".lastMessage"]: lastMessageData, [data.chatId + ".date"]: serverTimestamp() }); } } } catch(err) { console.error("Gagal update lastMessage di SendForm: ", err); } };

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
      isDeleted: false,
      isEdited: false,
      replyingTo: replyingTo // <-- Tambahkan data balasan
    };

    try {
      await addDoc(collection(db, collectionPath, data.chatId, "messages"), messageData);
      const lastMessageData = {
        text: text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? "🖼️ Foto" : "📹 Video")),
        fileType: fileType,
        isDeleted: false
      };
      await updateLastMessageForAll(lastMessageData);
    } catch (err) { console.error("Error mengirim pesan: ", err); }

    setText(''); setFile(null);
    setReplyingTo(null); // <-- Reset state balasan
    if (document.getElementById('file-upload')) document.getElementById('file-upload').value = null;
    setIsUploading(false);
  };

  // Komponen Preview Balasan
  const ReplyPreview = () => {
    if (!replyingTo) return null;
    let icon = null;
    if (replyingTo.fileType === 'image') icon = "🖼️ ";
    else if (replyingTo.fileType === 'video') icon = "📹 ";
    else if (replyingTo.fileType === 'raw' || replyingTo.fileType === 'auto') icon = "📄 ";
    return (
      <div className="reply-preview">
        <div className="reply-preview-content">
          <FiCornerUpLeft className="reply-icon" />
          <div className="reply-text">
            <div className="reply-sender">Membalas kepada {replyingTo.senderName}</div>
            <div className="reply-snippet">{icon}{replyingTo.textSnippet}</div>
          </div>
        </div>
        <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn"><FiX /></button>
      </div>
    );
  };

  return (
    <>
      {file && !isUploading ? ( <div className="file-preview"> <span>File terpilih: {file.name}</span> <button onClick={() => { setFile(null); document.getElementById('file-upload').value = null; }}>X</button> </div> ) : ( <ReplyPreview /> )}
      <div className="send-form-wrapper">
        {showEmojiPicker && ( <div ref={pickerRef} className="emoji-picker-input-container"> <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%', boxShadow: 'none' }} preload /> </div> )}
        <form onSubmit={handleSubmit} className="send-form">
          <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
          <label htmlFor="file-upload" className="attach-btn" title="Lampirkan File"><FiPaperclip size={20} /></label>
          <button type="button" className="attach-btn" title="Pilih Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile size={20} /></button>
          <input ref={inputRef} type="text" placeholder="Ketik pesan atau caption..." value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setShowEmojiPicker(false)} disabled={isUploading} />
          <button type="submit" className="primary" disabled={isUploading}>{isUploading ? <FiLoader className="loading-spinner-btn" /> : <FiSend />}</button>
        </form>
      </div>
    </>
  );
};

// ==========================================
// KOMPONEN CHAT WINDOW
// (MODIFIKASI: Tambah state replyingTo & oper ke children)
// ==========================================
const ChatWindow = () => {
  const { data } = useChat();
  const [replyingTo, setReplyingTo] = useState(null); // <-- State baru

  useEffect(() => { setReplyingTo(null); }, [data.chatId]); // Reset saat chat berubah

  if (!data.chatId) { return ( <div className="chat-window placeholder"> <div className="placeholder-content"> <FiSend size={50} /> <h2>Selamat Datang!</h2> <p>Pilih obrolan atau buat grup baru untuk memulai.</p> </div> </div> ); }
  return (
    <div className="chat-window">
      <div className="chat-header"> <Avatar src={data.user?.photoURL} alt={data.user?.displayName || 'C'} size={40} isGroup={data.isGroup} /> <h3>{data.user?.displayName || 'Pilih Obrolan'}</h3> </div>
      {/* Oper state & setter */}
      <MessageList setReplyingTo={setReplyingTo} />
      <SendForm replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
    </div>
  );
};

// ==========================================
// HALAMAN UTAMA (ChatHome)
// ==========================================
const ChatHome = () => { return ( <div className="chat-home-container"> <Sidebar /> <ChatWindow /> </div> ); };
export default ChatHome;