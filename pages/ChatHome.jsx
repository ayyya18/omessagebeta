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
  FieldValue,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
// Import ikon baru
import {
  FiSearch, FiSend, FiPaperclip, FiLoader, FiFile, FiUser, FiUsers, FiSmile,
  FiMoreVertical, FiEdit2, FiTrash2,
  FiCornerUpLeft, FiX, FiShare,
  FiArchive, FiInbox, FiPin // <-- Ikon untuk Pin & Arsip
} from 'react-icons/fi';

// IMPORT PICKER
import Picker from 'emoji-picker-react';

// IMPORT MODAL
import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';
// Asumsi ForwardMessageModal sudah dipisah ke file sendiri jika diperlukan
// import ForwardMessageModal from '../components/ForwardMessageModal';

// ==========================================
// KONFIGURASI CLOUDINARY
// ==========================================
const CLOUDINARY_CLOUD_NAME = "dca2fjndp";
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset";

// Komponen 'Avatar'
const Avatar = ({ src, alt, size = 44, isGroup = false }) => {
  const placeholder = isGroup ?
    <FiUsers size={size * 0.6} /> :
    (alt?.[0]?.toUpperCase() || '?');
  return (
    <div className="avatar-container" style={{ width: `${size}px`, height: `${size}px` }}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">{placeholder}</div>
      )}
    </div>
  );
};

// ==========================================
// KOMPONEN PENCARIAN (Search) - MODIFIKASI handleSelect
// ==========================================
const Search = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);
  const { currentUser } = useAuth();
  const { dispatch } = useChat();
  const handleSearch = async (e) => { e.preventDefault(); if (!username.trim()) return; const q = query(collection(db, 'users'), where('displayName', '==', username.trim())); try { const querySnapshot = await getDocs(q); if (querySnapshot.empty) { setErr(true); setUser(null); } else { querySnapshot.forEach((doc) => { if (doc.data().uid !== currentUser.uid) setUser(doc.data()); else setUser(null); }); setErr(false); } } catch (err) { console.error(err); setErr(true); } };
  const handleSelect = async () => {
    if (!user) return;
    const combinedId = currentUser.uid > user.uid ? currentUser.uid + user.uid : user.uid + currentUser.uid;
    try {
      const res = await getDoc(doc(db, 'chats', combinedId));
      let chatInfo; // Variabel untuk menyimpan info chat yang akan dikirim ke context
      
      // Hanya buat chat baru jika belum ada
      if (!res.exists()) {
        await setDoc(doc(db, 'chats', combinedId), { messages: [] });
        
        // Buat info untuk user saat ini
        const currentUserChatInfo = {
          userInfo: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' },
          isGroup: false,
          date: serverTimestamp(),
          lastMessage: { text: "" },
          isPinned: false, // Default false
          isArchived: false // Default false
        };
        await updateDoc(doc(db, 'userChats', currentUser.uid), {
          [combinedId]: currentUserChatInfo
        });
        
        // Buat info untuk user lain
        await updateDoc(doc(db, 'userChats', user.uid), {
          [combinedId + '.userInfo']: { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || '' },
          [combinedId + '.isGroup']: false,
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
          [combinedId + '.isPinned']: false, // Default false
          [combinedId + '.isArchived']: false // Default false
        });
        
        chatInfo = currentUserChatInfo; // Gunakan info yang baru dibuat
      } else {
         // Jika chat sudah ada, ambil infonya dari userChats
         const userChatsDoc = await getDoc(doc(db, "userChats", currentUser.uid));
         if(userChatsDoc.exists() && userChatsDoc.data()[combinedId]) {
            chatInfo = userChatsDoc.data()[combinedId];
         } else {
            // Fallback jika tidak ada (seharusnya tidak terjadi)
             chatInfo = {
                userInfo: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' },
                isGroup: false, isPinned: false, isArchived: false
             };
         }
      }
      
      dispatch({ type: 'CHANGE_USER', payload: chatInfo }); // Kirim data chatInfo LENGKAP
    } catch (err) { console.error("Gagal membuat/memilih chat:", err); }
    setUser(null); setUsername('');
  };
  return ( <div className="search-container"> <form onSubmit={handleSearch} className="search-form"> <input type="text" placeholder="Cari pengguna (username)..." value={username} onChange={(e) => setUsername(e.target.value)} /> <button type="submit"><FiSearch /></button> </form> {err && <span className="search-error">Pengguna tidak ditemukan</span>} {user && ( <div className="search-result" onClick={handleSelect}> <Avatar src={user.photoURL} alt={user.displayName} size={40} /> <div className="chat-info"> <span className="chat-name">{user.displayName}</span> <span className="chat-last-msg">Mulai obrolan baru</span> </div> </div> )} </div> );
};

// ==========================================
// KOMPONEN DAFTAR CHAT (ChatList) - MODIFIKASI handleSelect
// ==========================================
const ChatList = ({ showArchived }) => { // Hapus prop onContextMenu
  const [allChats, setAllChats] = useState([]); // Simpan semua chat
  const { currentUser } = useAuth();
  const { dispatch, data: chatData } = useChat();

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
      if (doc.exists()) {
        const chatEntries = Object.entries(doc.data());
        // Simpan semua chat mentah
        setAllChats(chatEntries);
      } else {
        setAllChats([]);
      }
    }, (error) => {
      console.error("Error fetching chats: ", error);
      setAllChats([]); // Handle error
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleSelect = (chatInfo) => {
    // Pastikan chatInfo dan userInfo ada sebelum dispatch
    if (chatInfo && chatInfo.userInfo) {
      // PERUBAHAN: Selalu kirim chatInfo lengkap
      dispatch({ type: "CHANGE_USER", payload: chatInfo });
    } else {
      console.warn("Invalid chatInfo for selection:", chatInfo);
    }
  };


  const renderLastMessage = (msg) => { if (!msg) return "..."; if (msg.isDeleted) return "Pesan telah dihapus"; if (msg.forwardedFrom) { const content = msg.text || (msg.fileType === 'image' ? "🖼️ Foto" : (msg.fileType === 'video' ? "📹 Video" : "📄 File")); const snippet = content.length > 20 ? content.substring(0, 20) + '...' : content; return `Terusan: ${snippet}`; } if (msg.fileType === 'image') return "🖼️ Foto"; if (msg.fileType === 'video') return "📹 Video"; if (msg.fileType === 'raw' || msg.fileType === 'auto') return "📄 File"; if (msg.text) return msg.text; return "..."; }

  // Filter dan Urutkan Chat
  const sortedChats = allChats
    .filter(([chatId, chatInfo]) => chatInfo && chatInfo.date) // Filter data tidak valid
    .filter(([chatId, chatInfo]) => showArchived ? chatInfo.isArchived === true : chatInfo.isArchived !== true) // Filter berdasarkan status arsip
    .sort(([, a], [, b]) => {
      // Prioritaskan pinned chats (hanya jika tidak di arsip)
      if (!showArchived) {
          if ((a.isPinned === true) && (b.isPinned !== true)) return -1; // a di pin, b tidak -> a duluan
          if ((a.isPinned !== true) && (b.isPinned === true)) return 1;  // b di pin, a tidak -> b duluan
      }
      // Jika status pin sama (atau di arsip), urutkan berdasarkan tanggal
       // Pastikan date adalah objek Timestamp sebelum memanggil toMillis()
       const dateA = a.date?.toMillis ? a.date.toMillis() : 0;
       const dateB = b.date?.toMillis ? b.date.toMillis() : 0;
       return dateB - dateA; // Tanggal terbaru di atas
    });
  
  // HAPUS: handleContextMenu

  return (
    <div className="chat-list">
      {sortedChats.length === 0 && (
        <p className="no-chats">{showArchived ? 'Tidak ada obrolan yang diarsipkan.' : 'Mulai obrolan baru.'}</p>
      )}
      {sortedChats.map(([chatId, chatInfo]) => (
        // Pastikan chatInfo dan userInfo ada sebelum render
        chatInfo && chatInfo.userInfo && (
          <div
            className={`chat-item ${chatId === chatData.chatId ? 'active' : ''} ${chatInfo.isPinned && !showArchived ? 'pinned' : ''}`} // Tambah class 'pinned'
            key={chatId}
            onClick={() => handleSelect(chatInfo)}
            // HAPUS: onContextMenu
          >
            {/* Tampilkan ikon pin jika di-pin & tidak di arsip */}
            {chatInfo.isPinned && !showArchived && <FiPin size={14} className="pin-icon" />}
            <Avatar
              src={chatInfo.userInfo.photoURL}
              alt={chatInfo.userInfo.displayName}
              isGroup={chatInfo.isGroup}
            />
            <div className="chat-info">
              <span className="chat-name">{chatInfo.userInfo.displayName}</span>
              <p className="chat-last-msg">{renderLastMessage(chatInfo.lastMessage)}</p>
            </div>
          </div>
        )
      ))}
    </div>
  );
};

// ==========================================
// KOMPONEN SIDEBAR - HAPUS LOGIC CONTEXT MENU
// ==========================================
const Sidebar = () => {
  const { currentUser } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // --- State Baru untuk Pin/Arsip ---
  const [showArchived, setShowArchived] = useState(false); // Tampilkan daftar arsip?
  
  // --- HAPUS SEMUA STATE & REF CONTEXT MENU ---
  // const [contextMenu, setContextMenu] = useState(...);
  // const contextMenuRef = useRef(null);
  // ----------------------------------

  const handleLogout = () => { signOut(auth); };

  // --- HAPUS SEMUA FUNGSI CONTEXT MENU ---
  // handleShowContextMenu
  // handleCloseContextMenu
  // useEffect (handleClickOutside)
  // handleTogglePin
  // handleToggleArchive
  // ---------------------------------------

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
           <div className="sidebar-header-top"> <h3>My Chat App</h3> <button onClick={() => setIsGroupModalOpen(true)} className="profile-btn" title="Buat Grup Baru"><FiUsers /></button> </div>
           <div className="user-profile"> <Avatar src={currentUser?.photoURL} alt={currentUser?.displayName || 'U'} size={24} /> <span className="user-profile-name">{currentUser?.displayName || 'User'}</span> <button onClick={() => setIsProfileModalOpen(true)} className="profile-btn" title="Atur Profil"><FiUser /></button> <button onClick={handleLogout} className="logout-btn" title="Logout">Logout</button> </div>
        </div>

        {/* --- Tombol Switch Arsip --- */}
        <div className="archive-toggle-container">
           <button onClick={() => setShowArchived(!showArchived)} className={`archive-toggle-btn ${showArchived ? 'active' : ''}`}>
             {showArchived ? <><FiInbox size={18}/> Kembali ke Inbox</> : <><FiArchive size={18} /> Obrolan Diarsipkan</>}
           </button>
        </div>
        {/* --------------------------- */}

        <Search />
        {/* Kirim prop showArchived & HAPUS onContextMenu */}
        <ChatList showArchived={showArchived} />
      </div>

      {/* --- HAPUS RENDER CONTEXT MENU --- */}
      {/* {contextMenu.visible && ( ... )} */}
      {/* ------------------------- */}

      <ProfileModal show={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <CreateGroupModal show={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </>
  );
};


// ==========================================
// KOMPONEN DAFTAR PESAN (MessageList)
// ==========================================
const MessageList = ({ setReplyingTo, onForward }) => {
  // ... (Kode MessageList tetap sama seperti sebelumnya)
   const [messages, setMessages] = useState([]); const { currentUser } = useAuth(); const { data } = useChat(); const messagesEndRef = useRef(null); const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null); const [menuOpenMsgId, setMenuOpenMsgId] = useState(null); const [editingMsgId, setEditingMsgId] = useState(null); const [editingText, setEditingText] = useState(""); const menuRef = useRef(null); useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]); useEffect(() => { setReactionPickerMsgId(null); setMenuOpenMsgId(null); setEditingMsgId(null); if (!data.chatId) { setMessages([]); return; } const collectionPath = data.isGroup ? "groups" : "chats"; const q = query(collection(db, collectionPath, data.chatId, "messages"), orderBy("createdAt")); const unsub = onSnapshot(q, (querySnapshot) => { const newMessages = []; querySnapshot.forEach((doc) => { newMessages.push({ id: doc.id, ...doc.data() }); }); setMessages(newMessages); }, (error) => { console.error("Error fetching messages:", error); }); return () => unsub(); }, [data.chatId, data.isGroup]); useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.more-btn')) setMenuOpenMsgId(null); }; if (menuOpenMsgId) { document.addEventListener('click', handleClickOutside); document.addEventListener('contextmenu', handleClickOutside); } return () => { document.removeEventListener('click', handleClickOutside); document.removeEventListener('contextmenu', handleClickOutside); }; }, [menuOpenMsgId]); const updateLastMessageForAll = async (lastMessageData) => { if (!data.chatId) return; try { if (data.isGroup) { const groupDoc = await getDoc(doc(db, "groups", data.chatId)); if (!groupDoc.exists()) return; const members = groupDoc.data().members || []; for (const uid of members) { const userChatDocRef = doc(db, "userChats", uid); const userChatSnap = await getDoc(userChatDocRef); if(userChatSnap.exists() && userChatSnap.data()[data.chatId]) { await updateDoc(userChatDocRef, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } } } else { const userChatRefSelf = doc(db, "userChats", currentUser.uid); const userChatSnapSelf = await getDoc(userChatRefSelf); if (userChatSnapSelf.exists() && userChatSnapSelf.data()[data.chatId]) { await updateDoc(userChatRefSelf, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } if (data.user?.uid) { const userChatRefOther = doc(db, "userChats", data.user.uid); const userChatSnapOther = await getDoc(userChatRefOther); if (userChatSnapOther.exists() && userChatSnapOther.data()[data.chatId]) { await updateDoc(userChatRefOther, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } } } } catch(err) { console.error("Gagal update lastMessage: ", err); } }; const handleDelete = async (msg) => { const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); try { await updateDoc(msgRef, { text: "Pesan ini telah dihapus", isDeleted: true, fileURL: null, fileType: null, fileName: null, reactions: {}, replyingTo: null }); await updateLastMessageForAll({ text: "Pesan ini telah dihapus", isDeleted: true }); } catch (err) { console.error("Gagal menghapus pesan:", err); } setMenuOpenMsgId(null); }; const openEditMode = (msg) => { setEditingMsgId(msg.id); setEditingText(msg.text); setMenuOpenMsgId(null); }; const handleSaveEdit = async (msg) => { if (editingText.trim() === '') return; const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); try { await updateDoc(msgRef, { text: editingText, isEdited: true, editedAt: serverTimestamp() }); await updateLastMessageForAll({ text: editingText, fileType: msg.fileType }); } catch (err) { console.error("Gagal mengedit pesan:", err); } setEditingMsgId(null); setEditingText(""); }; const MessageEditor = ({ msg }) => ( <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(msg); }}> <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus onBlur={() => setEditingMsgId(null)} /> <div className="edit-form-buttons"> <button type="button" className="cancel" onClick={() => setEditingMsgId(null)}>Batal</button> <button type="submit" className="save">Simpan</button> </div> </form> ); const handleReaction = async (emojiObject, msg) => { const emoji = emojiObject.emoji; const collectionPath = data.isGroup ? "groups" : "chats"; const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id); const reactionKey = `reactions.${emoji}`; try { const docSnap = await getDoc(msgRef); if (!docSnap.exists() || docSnap.data().isDeleted) return; const reactions = docSnap.data().reactions || {}; const userList = reactions[emoji] || []; if (userList.includes(currentUser.uid)) { await updateDoc(msgRef, { [reactionKey]: arrayRemove(currentUser.uid) }); const updatedSnap = await getDoc(msgRef); const updatedReactions = updatedSnap.data()?.reactions || {}; const updatedList = updatedReactions[emoji]; if (updatedList && updatedList.length === 0 && updatedReactions.hasOwnProperty(emoji)) { await updateDoc(msgRef, { [reactionKey]: FieldValue.delete() }); } } else { await updateDoc(msgRef, { [reactionKey]: arrayUnion(currentUser.uid) }); } } catch (err) { console.error("Gagal menambah/menghapus reaksi: ", err); } setReactionPickerMsgId(null); }; const RenderReactions = ({ reactions }) => { if (!reactions || Object.keys(reactions).length === 0) return null; return ( <div className="reactions-container"> {Object.entries(reactions).filter(([emoji, uids]) => uids && uids.length > 0).map(([emoji, uids]) => ( <span key={emoji} className="reaction-tag">{emoji} {uids.length}</span> ))} </div> ); }; const formatTime = (timestamp) => { if (!timestamp) return 'Baru saja'; const date = timestamp.toDate(); return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }; const handleReply = (msg) => { const replyData = { messageId: msg.id, senderName: msg.senderName || 'User', textSnippet: msg.text ? (msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text) : (msg.fileName ? `📄 ${msg.fileName}` : (msg.fileType === 'image' ? '🖼️ Foto' : (msg.fileType === 'video' ? '📹 Video' : 'File'))), fileType: msg.fileType }; setReplyingTo(replyData); }; const ReplyQuote = ({ replyData }) => { if (!replyData) return null; let icon = null; if (replyData.fileType === 'image') icon = "🖼️ "; else if (replyData.fileType === 'video') icon = "📹 "; else if (replyData.fileType === 'raw' || replyData.fileType === 'auto') icon = "📄 "; return ( <div className="reply-quote"> <div className="reply-quote-sender">{replyData.senderName}</div> <div className="reply-quote-text">{icon}{replyData.textSnippet}</div> </div> ); }; const ForwardedLabel = ({ forwardedFrom }) => { if (!forwardedFrom) return null; return <div className="forwarded-label"><FiShare size={12} /> Diteruskan dari {forwardedFrom}</div>; };
   const MessageContent = ({ msg }) => { if (msg.isDeleted) { return ( <p className="message-text deleted"> <FiTrash2 size={14} /> Pesan ini telah dihapus </p> ); } let originalContent; switch (msg.fileType) { case 'image': originalContent = (<> <img src={msg.fileURL} alt="Kiriman gambar" className="message-image" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break; case 'video': originalContent = (<> <video src={msg.fileURL} controls className="message-video" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break; case 'raw': case 'auto': originalContent = (<> <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="message-file"> <FiFile size={24} /> <span>{msg.fileName || 'File Terlampir'}</span> </a> {msg.text && <p className="message-text caption">{msg.text}</p>} </>); break; default: originalContent = <p className="message-text">{msg.text}</p>; break; } return ( <> <ForwardedLabel forwardedFrom={msg.forwardedFrom} /> <ReplyQuote replyData={msg.replyingTo} /> {originalContent} </> ); };

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
          <div className="message-bubble-wrapper">
            {!msg.isDeleted && !editingMsgId && (<button className="more-btn" title="Opsi" onClick={() => setMenuOpenMsgId(msg.id === menuOpenMsgId ? null : msg.id)}><FiMoreVertical /></button>)}
            {menuOpenMsgId === msg.id && (<div className="message-menu" ref={menuRef}> <button onClick={() => {onForward(msg); setMenuOpenMsgId(null);}}><FiShare /> Teruskan</button> {msg.senderId === currentUser.uid && msg.text && !msg.fileURL && (<button onClick={() => openEditMode(msg)}><FiEdit2 /> Edit</button>)} {msg.senderId === currentUser.uid && (<button onClick={() => handleDelete(msg)} className="delete"><FiTrash2 /> Hapus</button>)} </div>)}
            <div className="message-bubble">
              {!msg.isDeleted && !editingMsgId && ( <button className="reply-btn" title="Balas" onClick={() => handleReply(msg)}> <FiCornerUpLeft /> </button> )}
              {!msg.isDeleted && !editingMsgId && ( <button className="reaction-btn" title="Bereaksi" onClick={() => setReactionPickerMsgId(msg.id === reactionPickerMsgId ? null : msg.id)}><FiSmile /></button> )}
              {reactionPickerMsgId === msg.id && ( <div className="reaction-picker-popup"> <Picker onEmojiClick={(emojiObject) => handleReaction(emojiObject, msg)} pickerStyle={{ width: '250px', height: '200px' }} disableSearchBar disableSkinTonePicker groupVisibility={{ recently_used: false, smileys_emotion: true, animals_nature: false, food_drink: false, travel_places: false, activities: false, objects: false, symbols: false, flags: false, }} preload /> </div> )}
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
// ==========================================
const SendForm = ({ replyingTo, setReplyingTo }) => {
  // ... (Kode SendForm tetap sama)
   const [text, setText] = useState(''); const [file, setFile] = useState(null); const [isUploading, setIsUploading] = useState(false); const [showEmojiPicker, setShowEmojiPicker] = useState(false); const { currentUser } = useAuth(); const { data } = useChat(); const pickerRef = useRef(null); const inputRef = useRef(null); useEffect(() => { if (replyingTo) { inputRef.current?.focus(); } }, [replyingTo]); const onEmojiClick = (emojiObject) => { setText(prevText => prevText + emojiObject.emoji); setShowEmojiPicker(false); }; useEffect(() => { const handleClickOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowEmojiPicker(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [pickerRef]); const handleFileChange = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); }; const uploadFile = async () => { const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); let resourceType = 'auto'; if (file.type.startsWith('image/')) resourceType = 'image'; if (file.type.startsWith('video/')) resourceType = 'video'; try { const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData }); const data = await res.json(); if (data.error) throw new Error(data.error.message); return { url: data.secure_url, type: data.resource_type, name: file.name }; } catch (err) { console.error("Cloudinary upload error:", err); return null; } }; const updateLastMessageForAll = async (lastMessageData) => { if (!data.chatId) return; try { if (data.isGroup) { const groupDoc = await getDoc(doc(db, "groups", data.chatId)); if (!groupDoc.exists()) return; const members = groupDoc.data().members || []; for (const uid of members) { const userChatDocRef = doc(db, "userChats", uid); const userChatSnap = await getDoc(userChatDocRef); if(userChatSnap.exists() && userChatSnap.data()[data.chatId]) { await updateDoc(userChatDocRef, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } } } else { const userChatRefSelf = doc(db, "userChats", currentUser.uid); const userChatSnapSelf = await getDoc(userChatRefSelf); if (userChatSnapSelf.exists() && userChatSnapSelf.data()[data.chatId]) { await updateDoc(userChatRefSelf, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } if (data.user?.uid) { const userChatRefOther = doc(db, "userChats", data.user.uid); const userChatSnapOther = await getDoc(userChatRefOther); if (userChatSnapOther.exists() && userChatSnapOther.data()[data.chatId]) { await updateDoc(userChatRefOther, { [`${data.chatId}.lastMessage`]: lastMessageData, [`${data.chatId}.date`]: serverTimestamp() }); } } } } catch(err) { console.error("Gagal update lastMessage di SendForm: ", err); } };
   const handleSubmit = async (e) => { e.preventDefault(); if (text.trim() === '' && !file) return; if (!currentUser || !data.chatId) return; setIsUploading(true); let fileURL = null, fileType = null, fileName = null; if (file) { const uploadResult = await uploadFile(); if (uploadResult) { fileURL = uploadResult.url; fileType = uploadResult.type; fileName = uploadResult.name; } else { setIsUploading(false); alert("Gagal mengupload file."); return; } } const collectionPath = data.isGroup ? "groups" : "chats"; const messageData = { senderId: currentUser.uid, senderName: currentUser.displayName, createdAt: serverTimestamp(), text: text, fileURL: fileURL, fileType: fileType, fileName: fileName, reactions: {}, isDeleted: false, isEdited: false, replyingTo: replyingTo }; try { await addDoc(collection(db, collectionPath, data.chatId, "messages"), messageData); const lastMessageData = { text: text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? "🖼️ Foto" : "📹 Video")), fileType: fileType, isDeleted: false }; await updateLastMessageForAll(lastMessageData); } catch (err) { console.error("Error mengirim pesan: ", err); } setText(''); setFile(null); setReplyingTo(null); if (document.getElementById('file-upload')) document.getElementById('file-upload').value = null; setIsUploading(false); };
   const ReplyPreview = () => { if (!replyingTo) return null; let icon = null; if (replyingTo.fileType === 'image') icon = "🖼️ "; else if (replyingTo.fileType === 'video') icon = "📹 "; else if (replyingTo.fileType === 'raw' || replyingTo.fileType === 'auto') icon = "📄 "; return ( <div className="reply-preview"> <div className="reply-preview-content"> <FiCornerUpLeft className="reply-icon" /> <div className="reply-text"> <div className="reply-sender">Membalas kepada {replyingTo.senderName}</div> <div className="reply-snippet">{icon}{replyingTo.textSnippet}</div> </div> </div> <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn"><FiX /></button> </div> ); };
   return ( <> {file && !isUploading ? ( <div className="file-preview"> <span>File terpilih: {file.name}</span> <button onClick={() => { setFile(null); document.getElementById('file-upload').value = null; }}>X</button> </div> ) : ( <ReplyPreview /> )} <div className="send-form-wrapper"> {showEmojiPicker && ( <div ref={pickerRef} className="emoji-picker-input-container"> <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%', boxShadow: 'none' }} preload /> </div> )} <form onSubmit={handleSubmit} className="send-form"> <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} /> <label htmlFor="file-upload" className="attach-btn" title="Lampirkan File"><FiPaperclip size={20} /></label> <button type="button" className="attach-btn" title="Pilih Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile size={20} /></button> <input ref={inputRef} type="text" placeholder="Ketik pesan atau caption..." value={text} onChange={(e) => setText(e.target.value)} onFocus={() => setShowEmojiPicker(false)} disabled={isUploading} /> <button type="submit" className="primary" disabled={isUploading}>{isUploading ? <FiLoader className="loading-spinner-btn" /> : <FiSend />}</button> </form> </div> </> );
};

// ==========================================
// --- KOMPONEN BARU: Forward Message Modal ---
// ==========================================
const ForwardMessageModal = ({ show, onClose, messageToForward }) => {
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (show && currentUser?.uid) {
      setIsLoading(true);
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        if (doc.exists()) {
          const chatEntries = Object.entries(doc.data());
          const sortedChats = chatEntries.filter(chat => chat[1] && chat[1].date).sort((a, b) => {
            const dateA = a[1].date?.toMillis ? a[1].date.toMillis() : 0;
            const dateB = b[1].date?.toMillis ? b[1].date.toMillis() : 0;
            return dateB - dateA;
          });
          setChats(sortedChats);
        } else { setChats([]); }
        setIsLoading(false);
      }, (err) => { console.error("Error fetching user chats:", err); setError("Gagal memuat daftar obrolan."); setChats([]); setIsLoading(false); });
      return () => unsub();
    } else { setChats([]); setSelectedChats([]); setError(''); }
  }, [show, currentUser?.uid]);

  const handleSelectChat = (chatId) => { setSelectedChats(prev => prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]); };

  const updateLastMessage = async (targetChatId, targetChatInfo, lastMessageData) => {
     // ... (Kode updateLastMessage helper tetap sama)
     try { if (targetChatInfo.isGroup) { const groupDoc = await getDoc(doc(db, "groups", targetChatId)); if (!groupDoc.exists()) return; const members = groupDoc.data().members || []; for (const uid of members) { const userChatDocRef = doc(db, "userChats", uid); const userChatSnap = await getDoc(userChatDocRef); if(userChatSnap.exists() && userChatSnap.data()[targetChatId]) { await updateDoc(userChatDocRef, { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() }); } } } else { const recipientUid = targetChatInfo.userInfo.uid; const senderChatDocRef = doc(db, "userChats", currentUser.uid); const senderChatSnap = await getDoc(senderChatDocRef); if (senderChatSnap.exists() && senderChatSnap.data()[targetChatId]) { await updateDoc(senderChatDocRef, { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() }); } if (recipientUid && recipientUid !== currentUser.uid) { const recipientChatDocRef = doc(db, "userChats", recipientUid); const recipientChatSnap = await getDoc(recipientChatDocRef); if (recipientChatSnap.exists() && recipientChatSnap.data()[targetChatId]) { await updateDoc(recipientChatDocRef, { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() }); } } } } catch (err) { console.error(`Gagal update lastMessage for chat ${targetChatId}: `, err); }
  };


  const handleForward = async () => {
    if (selectedChats.length === 0 || !messageToForward) return;
    setIsLoading(true); setError('');
    const forwardedMessageData = { senderId: currentUser.uid, senderName: currentUser.displayName, createdAt: serverTimestamp(), text: messageToForward.text, fileURL: messageToForward.fileURL || null, fileType: messageToForward.fileType || null, fileName: messageToForward.fileName || null, reactions: {}, isDeleted: false, isEdited: false, replyingTo: null, forwardedFrom: messageToForward.senderName || 'User Tidak Dikenal' };
    try {
      const batch = writeBatch(db);
      const updatePromises = [];
      for (const chatId of selectedChats) {
        const chatEntry = chats.find(chat => chat[0] === chatId);
        const chatInfo = chatEntry ? chatEntry[1] : null;
        if (!chatInfo) { console.warn(`Chat info not found for chatId: ${chatId}. Skipping.`); continue; }
        const collectionPath = chatInfo.isGroup ? "groups" : "chats";
        const messagesColRef = collection(db, collectionPath, chatId, "messages");
        const newMessageRef = doc(messagesColRef);
        batch.set(newMessageRef, forwardedMessageData);
        const lastMessageData = { text: forwardedMessageData.text || (forwardedMessageData.fileName ? `📄 ${forwardedMessageData.fileName}` : (forwardedMessageData.fileType === 'image' ? "🖼️ Foto" : "📹 Video")), fileType: forwardedMessageData.fileType, isDeleted: false, forwardedFrom: forwardedMessageData.forwardedFrom };
        updatePromises.push(updateLastMessage(chatId, chatInfo, lastMessageData));
      }
      await batch.commit();
      await Promise.all(updatePromises);
      setIsLoading(false); onClose();
    } catch (err) { console.error("Gagal meneruskan pesan:", err); setError("Gagal meneruskan pesan. Silakan coba lagi."); setIsLoading(false); }
  };

  if (!show || !messageToForward) return null;
  const renderForwardPreview = (msg) => { let content; switch (msg.fileType) { case 'image': content = (<> <img src={msg.fileURL} alt="Preview" className="message-image small-preview" /> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break; case 'video': content = (<> <video src={msg.fileURL} className="message-video small-preview" /> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break; case 'raw': case 'auto': content = (<> <div className="message-file small-preview"> <FiFile size={18} /> <span>{msg.fileName || 'File'}</span> </div> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break; default: content = <p className="message-text small-preview">{msg.text}</p>; break; } return <div className="forward-preview-bubble">{content}</div>; };

  return (
    <div className="modal-overlay">
      <div className="modal-content forward-modal">
        <div className="modal-header"> <h3>Teruskan Pesan Ke...</h3> <button onClick={onClose} className="modal-close-btn"><FiX /></button> </div>
        <div className="modal-body">
          <div className="forward-message-preview"> <p>Pesan dari: {messageToForward.senderName || 'User'}</p> {renderForwardPreview(messageToForward)} </div> <hr className="divider" /> <label className="forward-label">Pilih Tujuan:</label>
          <div className="forward-chat-list">
            {isLoading && chats.length === 0 && <p className="no-chats">Memuat...</p>}
            {!isLoading && chats.length === 0 && <p className="no-chats">Tidak ada obrolan.</p>}
            {chats.map(([chatId, chatInfo]) => ( <div key={chatId} className={`forward-chat-item ${selectedChats.includes(chatId) ? 'selected' : ''}`} onClick={() => handleSelectChat(chatId)}> <Avatar src={chatInfo.userInfo.photoURL} alt={chatInfo.userInfo.displayName} size={40} isGroup={chatInfo.isGroup} /> <span className="forward-chat-name">{chatInfo.userInfo.displayName}</span> <div className={`checkbox ${selectedChats.includes(chatId) ? 'checked' : ''}`}></div> </div> ))}
          </div>
        </div>
        <div className="modal-footer"> {error && <p className="error-message">{error}</p>} <button onClick={handleForward} className="primary" disabled={isLoading || selectedChats.length === 0}> {isLoading ? <FiLoader className="loading-spinner-btn" /> : `Kirim ke ${selectedChats.length} tujuan`} </button> </div>
      </div>
    </div>
  );
};
// ==========================================


// ==========================================
// KOMPONEN CHAT WINDOW - MODIFIKASI BESAR
// ==========================================
const ChatWindow = () => {
  const { data, dispatch } = useChat(); // Ambil data LENGKAP dari context
  const { currentUser } = useAuth(); // Ambil currentUser
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  // --- LOGIKA BARU UNTUK MENU HEADER ---
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  
  useEffect(() => {
    // Reset semua state saat chat berubah
    setReplyingTo(null);
    setMessageToForward(null);
    setShowForwardModal(false);
    setIsHeaderMenuOpen(false); // <-- Reset menu
  }, [data.chatId]);

  // Efek untuk menutup menu header saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cek apakah klik di luar menu DAN bukan di tombol pembukanya
      if (
        headerMenuRef.current && 
        !headerMenuRef.current.contains(event.target) && 
        !event.target.closest('.chat-header-more-btn')
      ) {
        setIsHeaderMenuOpen(false);
      }
    };
    if (isHeaderMenuOpen) {
       document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isHeaderMenuOpen]);


  const handleOpenForwardModal = (message) => { setMessageToForward(message); setShowForwardModal(true); };
  
  // --- FUNGSI BARU (PINDAHAN DARI SIDEBAR) ---
  const handleTogglePin = async () => {
    if (!data.chatId || !currentUser?.uid) return;
    const userChatRef = doc(db, 'userChats', currentUser.uid);
    try {
      await updateDoc(userChatRef, {
        [`${data.chatId}.isPinned`]: !data.isPinned // Toggle nilai dari context
      });
      // Perbarui context secara lokal agar UI update instan
      dispatch({ type: "CHANGE_USER", payload: { ...data, ...data.user, isPinned: !data.isPinned, userInfo: data.user } });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
    setIsHeaderMenuOpen(false); // Tutup menu
  };

  const handleToggleArchive = async () => {
    if (!data.chatId || !currentUser?.uid) return;
    const userChatRef = doc(db, 'userChats', currentUser.uid);
    const newArchivedStatus = !data.isArchived;
    try {
      const updates = {
         [`${data.chatId}.isArchived`]: newArchivedStatus // Toggle nilai dari context
      };
      // Jika mengarsipkan, pastikan juga di-unpin
      if (newArchivedStatus) {
          updates[`${data.chatId}.isPinned`] = false;
      }
      await updateDoc(userChatRef, updates);
      
      // Reset context karena chat ini akan hilang dari daftar
      dispatch({ type: "RESET" }); 
      
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
    setIsHeaderMenuOpen(false); // Tutup menu
  };
  // ----------------------------------------


  if (!data.chatId) { return ( <div className="chat-window placeholder"> <div className="placeholder-content"> <FiSend size={50} /> <h2>Selamat Datang!</h2> <p>Pilih obrolan atau buat grup baru untuk memulai.</p> </div> </div> ); }
  return (
    <>
      <div className="chat-window">
        <div className="chat-header">
          <Avatar 
            src={data.user?.photoURL} 
            alt={data.user?.displayName || 'C'} 
            size={40} 
            isGroup={data.isGroup} 
          />
          <h3>{data.user?.displayName || 'Pilih Obrolan'}</h3>
          
          {/* --- TOMBOL MENU BARU --- */}
          <div className="chat-header-menu-container">
            <button
              className="chat-header-more-btn"
              onClick={() => setIsHeaderMenuOpen(prev => !prev)}
              title="Opsi Obrolan"
            >
              <FiMoreVertical />
            </button>
            {isHeaderMenuOpen && (
              <div className="chat-header-menu" ref={headerMenuRef}>
                <button onClick={handleToggleArchive}>
                  {data.isArchived ? <><FiInbox size={16}/> Batal Arsip</> : <><FiArchive size={16}/> Arsipkan</>}
                </button>
                {/* Opsi Pin hanya muncul jika TIDAK diarsipkan */}
                {!data.isArchived && (
                  <button onClick={handleTogglePin}>
                    {data.isPinned ? <> <FiX className="unpin-icon" size={16}/> Lepas Pin</> : <><FiPin size={16}/> Pin Obrolan</>}
                  </button>
                )}
                {/* Tambah tombol lain di sini, misal "Info Kontak" atau "Hapus Chat" */}
              </div>
            )}
          </div>
          {/* --- AKHIR TOMBOL MENU BARU --- */}
          
        </div>
        <MessageList setReplyingTo={setReplyingTo} onForward={handleOpenForwardModal} />
        <SendForm replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
      </div>
      <ForwardMessageModal show={showForwardModal} onClose={() => setShowForwardModal(false)} messageToForward={messageToForward} />
    </>
  );
};

// ==========================================
// HALAMAN UTAMA (ChatHome)
// ==========================================
const ChatHome = () => { return ( <div className="chat-home-container"> <Sidebar /> <ChatWindow /> </div> ); };
export default ChatHome;