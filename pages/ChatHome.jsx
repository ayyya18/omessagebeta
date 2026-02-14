import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Avatar from '../components/Avatar';
import ChatListItem from '../components/ChatListItem';
import { auth, db, dbRealtime } from '../firebase';
import { signOut } from 'firebase/auth';
import './DashboardHome.css';
import './ChatHome.css';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import useI18n from '../hooks/useI18n';
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
  limitToLast,
  addDoc,
  deleteField,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';

// Helper component for Header Info
const ChatHeaderInfo = ({ data, typingUsers, typingText }) => {
  const [status, setStatus] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const { currentUser } = useAuth();

  // Listen to status for Direct Chat
  useEffect(() => {
    if (data.isGroup || !data.user?.uid) {
      setStatus(null);
      return;
    }

    const statusRef = ref(dbRealtime, `/status/${data.user.uid}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.val());
      } else {
        setStatus({ state: 'offline' });
      }
    });

    return () => unsubscribe();
  }, [data.chatId, data.user?.uid, data.isGroup]);

  // Fetch group members (without online status)
  useEffect(() => {
    if (!data.isGroup || !data.chatId) {
      setGroupMembers([]);
      return;
    }

    const fetchGroupInfo = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', data.chatId));
        if (groupDoc.exists()) {
          const memberIds = groupDoc.data().members || [];
          // Filter out current user
          const otherMemberIds = memberIds.filter(id => id !== currentUser.uid);

          // Fetch member profiles
          if (otherMemberIds.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('uid', 'in', otherMemberIds.slice(0, 10))); // Limit 10
            const userSnaps = await getDocs(usersQuery);
            const names = userSnaps.docs.map(d => d.data().displayName);
            setGroupMembers(names);
          }
        }
      } catch (err) {
        console.error("Error fetching group info:", err);
      }
    };

    fetchGroupInfo();
  }, [data.chatId, data.isGroup, currentUser.uid]);

  if (!data.chatId) return <h3>Pilih Obrolan</h3>;

  return (
    <div className="chat-header-info">
      <h3 className="chat-header-title">{data.user?.displayName || 'Chat'}</h3>

      {/* DIRECT CHAT STATUS */}
      {!data.isGroup && (
        <div className="chat-header-status">
          {typingUsers.length > 0 ? (
            <span className="typing-text-active">{typingText}</span>
          ) : (
            <span className={`status-text ${status?.state === 'online' ? 'online' : 'offline'}`}>
              {status?.state === 'online' ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
      )}

      {/* GROUP CHAT INFO */}
      {data.isGroup && (
        <div className="chat-header-group-details">
          {typingUsers.length > 0 ? (
            <span className="typing-text-active">{typingText}</span>
          ) : (
            <div className="group-members-list">
              {groupMembers.join(', ')}{groupMembers.length > 0 ? '...' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ... inside ChatWindow ...
// Replace existing header content with:
/*
<div className="chat-header">
  {onBack && (
    <button className="back-button" onClick={onBack} aria-label="Kembali">
      <FiArrowLeft size={24} />
    </button>
  )}
  <Avatar ... />
  
  <ChatHeaderInfo data={data} typingUsers={typingUsers} typingText={typingText} />
  
  <div className="chat-header-menu-container">...</div>
</div>
*/
// Backwards-compat helper
const FieldValue = { delete: deleteField };

// Import ikon
import {
  FiSearch, FiSend, FiPaperclip, FiLoader, FiFile, FiUser, FiUsers, FiSmile,
  FiMoreVertical, FiEdit2, FiTrash2,
  FiCornerUpLeft, FiX, FiShare, FiArrowLeft,
  FiArchive, FiInbox, FiMapPin,
  FiSun, FiMoon, FiSettings, FiUserPlus, FiPlus
} from 'react-icons/fi';

import { increment } from 'firebase/firestore';

import ChatBubble from '../components/ChatBubble';

// IMPORT PICKER
import Picker from 'emoji-picker-react';
import ReactionPicker from '../components/ReactionPicker';

import Fuse from 'fuse.js';
import { indexChat, deleteChatIndex } from '../utils/searchIndex';

// IMPORT MODAL
import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';
import SettingsModal from '../components/Settings/SettingsModal';

// KONFIGURASI CLOUDINARY
const CLOUDINARY_CLOUD_NAME = "dca2fjndp";
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset";

// Avatar and ChatListItem are in components for reuse

// ==========================================
// 2. KOMPONEN SEARCH (DIPERBAIKI: Dibungkus function)
// ==========================================
const Search = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);
  const [friends, setFriends] = useState([]);
  const { currentUser } = useAuth();
  const { dispatch } = useChat();

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) setFriends(snap.data().friends || []);
      else setFriends([]);
    }, (err) => { console.warn('Failed to listen user friends', err); setFriends([]); });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const term = username.trim();
      const q = term.startsWith('@')
        ? query(collection(db, 'users'), where('handle', '==', term))
        : query(collection(db, 'users'), where('displayName', '==', term));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErr(true);
        setUser(null);
      } else {
        querySnapshot.forEach((doc) => {
          if (doc.data().uid !== currentUser.uid) setUser(doc.data());
          else setUser(null);
        });
        setErr(false);
      }
    } catch (err) {
      console.error(err);
      setErr(true);
    }
  };

  const handleSelect = async () => {
    if (!user) return;
    if (!friends.includes(user.uid)) {
      console.warn('Must add friend before chatting');
      return; // UI logic handled by button visibility
    }

    // ID kombinasi untuk chat 1-on-1
    const combinedId = currentUser.uid > user.uid ? currentUser.uid + user.uid : user.uid + currentUser.uid;

    try {
      const res = await getDoc(doc(db, 'chats', combinedId));
      let chatInfo;

      if (!res.exists()) {
        await setDoc(doc(db, 'chats', combinedId), { messages: [] });

        const currentUserChatInfo = {
          userInfo: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' },
          isGroup: false,
          date: serverTimestamp(),
          lastMessage: { text: "" },
          isPinned: false,
          isArchived: false
        };

        // Update userChats currentUser
        await updateDoc(doc(db, 'userChats', currentUser.uid), {
          [combinedId]: currentUserChatInfo
        });

        // Update userChats user lawan
        await updateDoc(doc(db, 'userChats', user.uid), {
          [combinedId + '.userInfo']: { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || '' },
          [combinedId + '.isGroup']: false,
          [combinedId + '.date']: serverTimestamp(),
          [combinedId + '.lastMessage']: { text: "" },
          [combinedId + '.isPinned']: false,
          [combinedId + '.isArchived']: false
        });
        // Index the new direct chat for search
        try { await indexChat(combinedId, { isGroup: false, userInfo: currentUserChatInfo.userInfo, lastMessage: { text: '' }, date: serverTimestamp() }); } catch (err) { console.error('indexChat create direct chat failed', err); }

        chatInfo = currentUserChatInfo;
      } else {
        const userChatsDoc = await getDoc(doc(db, "userChats", currentUser.uid));
        if (userChatsDoc.exists() && userChatsDoc.data()[combinedId]) {
          chatInfo = userChatsDoc.data()[combinedId];
        } else {
          chatInfo = {
            userInfo: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL || '' },
            isGroup: false, isPinned: false, isArchived: false
          };
        }
      }

      dispatch({ type: 'CHANGE_USER', payload: chatInfo });
    } catch (err) { console.error("Gagal membuat/memilih chat:", err); }
    setUser(null); setUsername('');
  };

  const addFriend = async () => {
    if (!currentUser || !user) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayUnion(user.uid) });
      await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(currentUser.uid) });
    } catch (err) { console.error('Gagal menambahkan teman:', err); }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input type="text" placeholder="Cari pengguna (username atau @handle)..." value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="submit"><FiSearch /></button>
      </form>
      {err && <span className="search-error">Pengguna tidak ditemukan</span>}
      {user && (
        <div className="search-result">
          <Avatar src={user.photoURL} alt={user.displayName} size={40} />
          <div className="chat-info">
            <span className="chat-name">{user.displayName} {user.handle && <small className="handle">{user.handle}</small>}</span>
            <span className="chat-last-msg">{friends.includes(user.uid) ? 'Teman Anda' : 'Bukan teman'}</span>
          </div>
          <div className="search-actions">
            {!friends.includes(user.uid) ? (
              <button className="add-friend-btn" onClick={addFriend}>Tambah Teman</button>
            ) : (
              <button className="start-chat-btn" onClick={handleSelect}>Mulai Chat</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. KOMPONEN CHAT LIST
// ==========================================
const ChatList = ({ showArchived, searchQuery = '' }) => {
  const [allChats, setAllChats] = useState([]);
  // Chat search is now controlled by parent on mobile, or internal on desktop? I should make it controlled always for simplicity if possible.
  // Actually let's keep internal state for desktop if needed, OR just controll via props.
  // Let's control via props if provided, else use potentially internal (but safer to just use props here since we lift it).
  // Wait, if I change it to use a Prop, I must pass it from ChatSidebar.
  // Let's rename the prop to `filterText`.
  const { currentUser } = useAuth();
  const { dispatch, data: chatData } = useChat();

  // Toggle pin/archive/delete actions
  const togglePin = async (chatId, chatInfo) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, 'userChats', currentUser.uid), {
        [`${chatId}.isPinned`]: !chatInfo.isPinned,
        [`${chatId}.date`]: serverTimestamp()
      });
    } catch (err) { console.error('Gagal toggle pin:', err); }
  };

  const toggleArchive = async (chatId, chatInfo) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, 'userChats', currentUser.uid), {
        [`${chatId}.isArchived`]: !chatInfo.isArchived,
        [`${chatId}.date`]: serverTimestamp()
      });
    } catch (err) { console.error('Gagal toggle archive:', err); }
  };

  const deleteChatForMe = async (chatId, chatInfo) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, 'userChats', currentUser.uid), { [chatId]: FieldValue.delete() });
      // If it's a one-on-one chat remove other user's pointer as well when available
      const otherUid = chatInfo?.userInfo?.uid;
      if (otherUid && otherUid !== currentUser.uid) {
        await updateDoc(doc(db, 'userChats', otherUid), { [chatId]: FieldValue.delete() });
        // after removing other user's pointer, check if chat still exists for other user
        try {
          const otherSnap = await getDoc(doc(db, 'userChats', otherUid));
          const stillThere = otherSnap.exists() && otherSnap.data()[chatId];
          if (!stillThere) {
            // remove from search index
            try { await deleteChatIndex(chatId); } catch (e) { console.error('deleteChatIndex failed', e); }
          }
        } catch (e) { console.error('check other userChats failed', e); }
      }
      // If currently open chat was deleted, clear selection
      if (chatData.chatId === chatId) dispatch({ type: 'CHANGE_USER', payload: {} });
      // If this was a direct chat and otherUid missing, also remove search index
      if (!chatInfo?.isGroup && !chatInfo?.userInfo?.uid) {
        try { await import('../utils/searchIndex').then(m => m.deleteChatIndex(chatId)); } catch (e) { console.error('deleteChatIndex failed', e); }
      }
    } catch (err) { console.error('Gagal menghapus chat:', err); }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
      if (doc.exists()) {
        const chatEntries = Object.entries(doc.data());
        setAllChats(chatEntries);
      } else {
        setAllChats([]);
      }
    }, (error) => {
      console.error("Error fetching chats: ", error);
      setAllChats([]);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleSelect = (chatInfo) => {
    if (chatInfo && chatInfo.userInfo) {
      dispatch({ type: "CHANGE_USER", payload: chatInfo });
    }
  };

  const renderLastMessage = (msg) => {
    if (!msg) return "...";
    if (msg.isDeleted) return "Pesan telah dihapus";
    if (msg.forwardedFrom) {
      const content = msg.text || (msg.fileType === 'image' ? "🖼️ Foto" : (msg.fileType === 'video' ? "📹 Video" : "📄 File"));
      const snippet = content.length > 20 ? content.substring(0, 20) + '...' : content;
      return `Terusan: ${snippet}`;
    }
    if (msg.fileType === 'image') return "🖼️ Foto";
    if (msg.fileType === 'video') return "📹 Video";
    if (msg.fileType === 'raw' || msg.fileType === 'auto') return "📄 File";
    if (msg.text) return msg.text;
    return "...";
  }

  // Filter dan Urutkan Chat
  const sortedChats = allChats
    .filter(([chatId, chatInfo]) => chatInfo && chatInfo.date)
    .filter(([chatId, chatInfo]) => showArchived ? chatInfo.isArchived === true : chatInfo.isArchived !== true)
    .sort(([, a], [, b]) => {
      if (!showArchived) {
        if ((a.isPinned === true) && (b.isPinned !== true)) return -1;
        if ((a.isPinned !== true) && (b.isPinned === true)) return 1;
      }
      const dateA = a.date?.toMillis ? a.date.toMillis() : 0;
      const dateB = b.date?.toMillis ? b.date.toMillis() : 0;
      return dateB - dateA;
    });

  const chatItems = sortedChats.map(([chatId, chatInfo]) => ({ chatId, chatInfo, displayName: chatInfo.userInfo?.displayName || '', lastText: chatInfo.lastMessage?.text || '' }));
  const fuse = new Fuse(chatItems, { keys: ['displayName', 'lastText'], threshold: 0.4 });
  const filtered = searchQuery.trim() ? fuse.search(searchQuery.trim()).map(r => r.item) : chatItems;

  return (
    <div className="chat-list" role="navigation" aria-label="Daftar obrolan">
      {sortedChats.length === 0 && (
        <p className="no-chats">{showArchived ? 'Tidak ada obrolan yang diarsipkan.' : 'Mulai obrolan baru.'}</p>
      )}
      {filtered.map(({ chatId, chatInfo }) => (
        chatInfo && chatInfo.userInfo && (
          <ChatListItem
            key={chatId}
            chatId={chatId}
            chatInfo={{ ...chatInfo, lastMessage: chatInfo.lastMessage }}
            isActive={chatId === chatData.chatId}
            onSelect={handleSelect}
            onTogglePin={togglePin}
            onToggleArchive={toggleArchive}
            onDelete={deleteChatForMe}
          />
        )
      ))
      }
    </div >
  );
};

// ==========================================
// 4. KOMPONEN DASHBOARD LAYOUT (SIDENAV + CHATLIST)
// ==========================================

const ChatSidebar = ({ className }) => {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [isChatSearchVisible, setIsChatSearchVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => { signOut(auth); };

  return (
    <>
      <div className={`chat-sidebar-column ${className || ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h3>Obrolan Saya</h3>
            <div className="sidebar-header-actions">
              <button
                onClick={() => setShowSearchModal(true)}
                className="action-btn"
                title="Tambah Teman / Cari Pengguna"
              >
                <FiPlus size={20} />
              </button>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="action-btn"
                title="Buat Grup Baru"
              >
                <FiUsers size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Search Input Area (only visible when toggled) */}
        {isChatSearchVisible && (
          <div className="chat-search-container">
            <div className="chat-search-input-wrapper">
              <FiSearch className="search-icon-input" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="Cari chat..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
              />
              <button onClick={() => { setIsChatSearchVisible(false); setChatSearch(''); }} className="close-search-btn">
                <FiX size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Chat List Area */}
        <div className="chat-list-container">
          {showArchived && <div className="archive-banner"><FiArchive size={14} /> Arsip Obrolan</div>}
          <ChatList showArchived={showArchived} searchQuery={chatSearch} />
        </div>

        {/* Floating Action Buttons (Mobile) */}
        <div className="chat-fab-container">
          <button
            className={`chat-fab ${showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(!showArchived)}
            title={showArchived ? "Tampilkan Chat Aktif" : "Arsip"}
          >
            {showArchived ? <FiInbox size={20} /> : <FiArchive size={20} />}
          </button>

          <button
            className={`chat-fab ${isChatSearchVisible ? 'active' : ''}`}
            onClick={() => {
              setIsChatSearchVisible(!isChatSearchVisible);
              if (!isChatSearchVisible) setChatSearch('');
            }}
            title="Cari Obrolan"
          >
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      <ProfileModal show={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <CreateGroupModal show={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <SettingsModal show={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* User Search Modal (Reused for both Desktop & Mobile) */}
      {showSearchModal && (
        <div className="mobile-search-modal">
          <div className="mobile-search-content">
            <div className="mobile-search-header">
              <h3>Cari Pengguna</h3>
              <button onClick={() => setShowSearchModal(false)} className="close-modal-btn">
                <FiX size={24} />
              </button>
            </div>
            <Search />
          </div>
        </div>
      )}
    </>
  );
};




// ==========================================
// 5. KOMPONEN MESSAGE LIST (DIPERBAIKI: Formatting & Scope)
// ==========================================
const MessageList = ({ setReplyingTo, onForward }) => {
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const messagesEndRef = useRef(null);
  const liveRegionRef = useRef(null);
  const prevMessagesCountRef = useRef(0);

  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const menuRef = useRef(null);

  // Helper untuk Reaksi yang bisa diklik (Dipindahkan ke dalam komponen atau sebagai konstanta jika tidak butuh state)
  const RenderReactionsClickable = ({ reactions, msg }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    return (
      <div className="reactions-container">
        {Object.entries(reactions)
          .filter(([emoji, uids]) => uids && uids.length > 0)
          .map(([emoji, uids]) => (
            <span
              key={emoji}
              className={`reaction-tag ${uids && uids.includes(currentUser.uid) ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              data-emoji={emoji}
              aria-pressed={uids && uids.includes(currentUser.uid) ? 'true' : 'false'}
              title={`${uids.length} reaksi`}
              onClick={() => handleReaction({ emoji }, msg)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleReaction({ emoji }, msg); } }}
            >
              {emoji} {uids.length}
            </span>
          ))}
      </div>
    );
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    setReactionPickerMsgId(null);
    setMenuOpenMsgId(null);
    setEditingMsgId(null);

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
      // Announce new incoming messages for screen reader users
      try {
        const prev = prevMessagesCountRef.current || 0;
        const curr = newMessages.length;
        if (curr > prev) {
          const last = newMessages[newMessages.length - 1];
          if (last && last.senderId !== currentUser.uid) {
            const text = last.text ? (last.text.length > 80 ? last.text.substring(0, 80) + '...' : last.text) : (last.fileType === 'image' ? 'Gambar' : last.fileType === 'video' ? 'Video' : 'File');
            if (liveRegionRef.current) {
              liveRegionRef.current.textContent = `Pesan baru dari ${last.senderName || 'Pengguna'}: ${text}`;
              setTimeout(() => { if (liveRegionRef.current) liveRegionRef.current.textContent = ''; }, 4000);
            }
          }
        }
        prevMessagesCountRef.current = curr;
      } catch (e) { /* ignore */ }
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsub();
  }, [data.chatId, data.isGroup]);

  // Tutup menu saat klik luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.more-btn')) {
        setMenuOpenMsgId(null);
      }
    };
    if (menuOpenMsgId) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [menuOpenMsgId]);

  // Fungsi Update Last Message Helper
  const updateLastMessageForAll = async (lastMessageData) => {
    if (!data.chatId) return;
    try {
      if (data.isGroup) {
        const groupDoc = await getDoc(doc(db, "groups", data.chatId));
        if (!groupDoc.exists()) return;
        const members = groupDoc.data().members || [];
        for (const uid of members) {
          const userChatDocRef = doc(db, "userChats", uid);
          const userChatSnap = await getDoc(userChatDocRef);
          if (userChatSnap.exists() && userChatSnap.data()[data.chatId]) {
            await updateDoc(userChatDocRef, {
              [`${data.chatId}.lastMessage`]: lastMessageData,
              [`${data.chatId}.date`]: serverTimestamp()
            });
          }
        }
        // update search index for this group
        try { await indexChat(data.chatId, { isGroup: true, groupName: groupDoc.data().groupName || '', lastMessage: lastMessageData, date: serverTimestamp() }); } catch (err) { console.error('indexChat updateLastMessageForAll group', err); }
      } else {
        const userChatRefSelf = doc(db, "userChats", currentUser.uid);
        const userChatSnapSelf = await getDoc(userChatRefSelf);
        if (userChatSnapSelf.exists() && userChatSnapSelf.data()[data.chatId]) {
          await updateDoc(userChatRefSelf, {
            [`${data.chatId}.lastMessage`]: lastMessageData,
            [`${data.chatId}.date`]: serverTimestamp()
          });
        }
        if (data.user?.uid) {
          const userChatRefOther = doc(db, "userChats", data.user.uid);
          const userChatSnapOther = await getDoc(userChatRefOther);
          if (userChatSnapOther.exists() && userChatSnapOther.data()[data.chatId]) {
            await updateDoc(userChatRefOther, {
              [`${data.chatId}.lastMessage`]: lastMessageData,
              [`${data.chatId}.date`]: serverTimestamp()
            });
          }
        }
        // update search index for direct chat
        try { await indexChat(data.chatId, { isGroup: false, userInfo: data.user || {}, lastMessage: lastMessageData, date: serverTimestamp() }); } catch (err) { console.error('indexChat updateLastMessageForAll direct', err); }
      }
    } catch (err) { console.error("Gagal update lastMessage: ", err); }
  };

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
        reactions: {},
        replyingTo: null
      });
      await updateLastMessageForAll({ text: "Pesan ini telah dihapus", isDeleted: true });
    } catch (err) { console.error("Gagal menghapus pesan:", err); }
    setMenuOpenMsgId(null);
  };

  const openEditMode = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
    setMenuOpenMsgId(null);
  };

  const handleSaveEdit = async (msg) => {
    if (editingText.trim() === '') return;
    const collectionPath = data.isGroup ? "groups" : "chats";
    const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id);
    try {
      await updateDoc(msgRef, { text: editingText, isEdited: true, editedAt: serverTimestamp() });
      await updateLastMessageForAll({ text: editingText, fileType: msg.fileType });
    } catch (err) { console.error("Gagal mengedit pesan:", err); }
    setEditingMsgId(null);
    setEditingText("");
  };

  const MessageEditor = ({ msg }) => (
    <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(msg); }}>
      <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} autoFocus onBlur={() => setEditingMsgId(null)} />
      <div className="edit-form-buttons">
        <button type="button" className="cancel" onClick={() => setEditingMsgId(null)}>Batal</button>
        <button type="submit" className="save">Simpan</button>
      </div>
    </form>
  );

  const handleReaction = async (emojiObject, msg) => {
    const emoji = emojiObject.emoji;
    const collectionPath = data.isGroup ? "groups" : "chats";
    const msgRef = doc(db, collectionPath, data.chatId, "messages", msg.id);
    const reactionKey = `reactions.${emoji}`;
    try {
      const docSnap = await getDoc(msgRef);
      if (!docSnap.exists() || docSnap.data().isDeleted) return;
      const reactions = docSnap.data().reactions || {};
      const userList = reactions[emoji] || [];

      if (userList.includes(currentUser.uid)) {
        await updateDoc(msgRef, { [reactionKey]: arrayRemove(currentUser.uid) });
        // Cleanup jika kosong (opsional)
        const updatedSnap = await getDoc(msgRef);
        const updatedReactions = updatedSnap.data()?.reactions || {};
        const updatedList = updatedReactions[emoji];
        if (updatedList && updatedList.length === 0 && updatedReactions.hasOwnProperty(emoji)) {
          await updateDoc(msgRef, { [reactionKey]: FieldValue.delete() });
        }
      } else {
        await updateDoc(msgRef, { [reactionKey]: arrayUnion(currentUser.uid) });
      }
    } catch (err) { console.error("Gagal menambah/menghapus reaksi: ", err); }
    setReactionPickerMsgId(null);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Baru saja';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const handleReply = (msg) => {
    const replyData = {
      messageId: msg.id,
      senderName: msg.senderName || 'User',
      textSnippet: msg.text ? (msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text) : (msg.fileName ? `📄 ${msg.fileName}` : (msg.fileType === 'image' ? '🖼️ Foto' : (msg.fileType === 'video' ? '📹 Video' : 'File'))),
      fileType: msg.fileType
    };
    setReplyingTo(replyData);
  };

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

  const ForwardedLabel = ({ forwardedFrom }) => {
    if (!forwardedFrom) return null;
    return <div className="forwarded-label"><FiShare size={12} /> Diteruskan dari {forwardedFrom}</div>;
  };

  const MessageContent = ({ msg }) => {
    if (msg.isDeleted) {
      return (
        <p className="message-text deleted">
          <FiTrash2 size={14} /> Pesan ini telah dihapus
        </p>
      );
    }
    let originalContent;
    switch (msg.fileType) {
      case 'image':
        originalContent = (<> <img src={msg.fileURL} alt="Kiriman gambar" className="message-image" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
        break;
      case 'video':
        originalContent = (<> <video src={msg.fileURL} controls className="message-video" /> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
        break;
      case 'raw':
      case 'auto':
        originalContent = (<> <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="message-file"> <FiFile size={24} /> <span>{msg.fileName || 'File Terlampir'}</span> </a> {msg.text && <p className="message-text caption">{msg.text}</p>} </>);
        break;
      default:
        originalContent = <p className="message-text">{msg.text}</p>;
        break;
    }
    return (
      <>
        <ForwardedLabel forwardedFrom={msg.forwardedFrom} />
        <ReplyQuote replyData={msg.replyingTo} />
        {originalContent}
      </>
    );
  };

  // Click handler untuk menambah reaksi cepat
  useEffect(() => {
    const onDocClick = (e) => {
      const tag = e.target.closest('.reaction-tag');
      if (!tag) return;
      const emoji = tag.textContent.trim().split(' ')[0];
      const msgEl = tag.closest('[data-msgid]');
      const msgId = msgEl?.getAttribute('data-msgid');
      if (!msgId) return;
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;
      handleReaction({ emoji }, msg);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [messages]);

  return (
    <div className="message-list" role="list" aria-label="Daftar pesan">
      <div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="true"></div>
      {messages.map((msg) => (
        <div key={msg.id} data-msgid={msg.id} role="listitem" className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
          <div className="message-bubble-wrapper">
            {!msg.isDeleted && !editingMsgId && (
              <button className="more-btn" title="Opsi" aria-label="Opsi pesan" onClick={() => setMenuOpenMsgId(msg.id === menuOpenMsgId ? null : msg.id)}>
                <FiMoreVertical />
              </button>
            )}

            {menuOpenMsgId === msg.id && (
              <div className="message-menu" ref={menuRef} role="menu" aria-label="Menu pesan">
                <button role="menuitem" aria-label="Teruskan pesan" onClick={() => { onForward(msg); setMenuOpenMsgId(null); }}><FiShare /> Teruskan</button>
                {msg.senderId === currentUser.uid && msg.text && !msg.fileURL && (
                  <button role="menuitem" aria-label="Edit pesan" onClick={() => openEditMode(msg)}><FiEdit2 /> Edit</button>
                )}
                {msg.senderId === currentUser.uid && (
                  <button role="menuitem" aria-label="Hapus pesan" onClick={() => handleDelete(msg)} className="delete"><FiTrash2 /> Hapus</button>
                )}
              </div>
            )}

            <div className="message-bubble">
              {!msg.isDeleted && !editingMsgId && (
                <button className="reply-btn" title="Balas" aria-label="Balas pesan" onClick={() => handleReply(msg)}>
                  <FiCornerUpLeft />
                </button>
              )}
              {!msg.isDeleted && !editingMsgId && (
                <button className="reaction-btn" title="Bereaksi" aria-label="Tambahkan reaksi" onClick={() => setReactionPickerMsgId(msg.id === reactionPickerMsgId ? null : msg.id)}>
                  <FiSmile />
                </button>
              )}

              {reactionPickerMsgId === msg.id && (
                <ReactionPicker
                  onSelect={(emojiObject) => handleReaction(emojiObject, msg)}
                  onClose={() => setReactionPickerMsgId(null)}
                  pickerStyle={{ width: 250, height: 200 }}
                />
              )}

              {editingMsgId === msg.id ? (
                <MessageEditor msg={msg} />
              ) : (
                <>
                  {data.isGroup && msg.senderId !== currentUser.uid && !msg.isDeleted && (
                    <p className="message-sender">{msg.senderName || 'User'}</p>
                  )}
                  <ChatBubble msg={msg} isSent={msg.senderId === currentUser.uid} />
                </>
              )}
            </div>

            <RenderReactionsClickable reactions={msg.reactions} msg={msg} />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};


// ==========================================
// 6. KOMPONEN SEND FORM
// ==========================================
const SendForm = ({ replyingTo, setReplyingTo }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { currentUser } = useAuth();
  const { data } = useChat();
  const { createNotification, createBulkNotifications } = useNotification();
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => { if (replyingTo) inputRef.current?.focus(); }, [replyingTo]);

  const onEmojiClick = (emojiObject) => { setText(prev => prev + emojiObject.emoji); setShowEmojiPicker(false); };

  useEffect(() => {
    const handleClickOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowEmojiPicker(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    let resourceType = 'auto';
    if (file.type.startsWith('image/')) resourceType = 'image';
    if (file.type.startsWith('video/')) resourceType = 'video';
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return { url: data.secure_url, type: data.resource_type, name: file.name };
    } catch (err) { console.error('Cloudinary upload error:', err); return null; }
  };

  // Helper untuk update last message di SendForm
  const updateLastMessageForAll = async (lastMessageData) => {
    if (!data.chatId) return;
    try {
      if (data.isGroup) {
        const groupDoc = await getDoc(doc(db, 'groups', data.chatId));
        if (!groupDoc.exists()) return;
        const members = groupDoc.data().members || [];
        for (const uid of members) {
          const userChatDocRef = doc(db, 'userChats', uid);
          const userChatSnap = await getDoc(userChatDocRef);
          if (userChatSnap.exists() && userChatSnap.data()[data.chatId]) {
            await updateDoc(userChatDocRef, {
              [`${data.chatId}.lastMessage`]: lastMessageData,
              [`${data.chatId}.date`]: serverTimestamp(),
              [`${data.chatId}.unreadCount`]: increment(1)
            });
          }
        }
      } else {
        const userChatRefSelf = doc(db, 'userChats', currentUser.uid);
        const userChatSnapSelf = await getDoc(userChatRefSelf);
        if (userChatSnapSelf.exists() && userChatSnapSelf.data()[data.chatId]) {
          await updateDoc(userChatRefSelf, {
            [`${data.chatId}.lastMessage`]: lastMessageData,
            [`${data.chatId}.date`]: serverTimestamp()
            // Do not increment for self
          });
        }
        if (data.user?.uid) {
          const userChatRefOther = doc(db, 'userChats', data.user.uid);
          const userChatSnapOther = await getDoc(userChatRefOther);
          if (userChatSnapOther.exists() && userChatSnapOther.data()[data.chatId]) {
            await updateDoc(userChatRefOther, {
              [`${data.chatId}.lastMessage`]: lastMessageData,
              [`${data.chatId}.date`]: serverTimestamp(),
              [`${data.chatId}.unreadCount`]: increment(1)
            });
          }
        }
      }
    } catch (err) { console.error('Gagal update lastMessage di SendForm: ', err); }
  };

  const setTypingStatus = async (isTyping) => {
    try {
      if (!data.chatId || !currentUser?.uid) return;
      const typingDocRef = doc(db, 'typing', data.chatId);
      if (isTyping) {
        await setDoc(typingDocRef, { [currentUser.uid]: currentUser.displayName || 'User' }, { merge: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(async () => { try { await updateDoc(typingDocRef, { [currentUser.uid]: FieldValue.delete() }); } catch (e) { } }, 3000);
      } else {
        if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
        try { await updateDoc(typingDocRef, { [currentUser.uid]: FieldValue.delete() }); } catch (e) { }
      }
    } catch (err) { }
  };

  const handleInputChange = (e) => { const v = e.target.value; setText(v); setTypingStatus(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() === '' && !file) return;
    if (!currentUser || !data.chatId) return;

    if (!data.isGroup && data.user?.uid) {
      try {
        const me = await getDoc(doc(db, 'users', currentUser.uid));
        const myFriends = me.exists() ? (me.data().friends || []) : [];
        if (!myFriends.includes(data.user.uid) && data.user.uid !== currentUser.uid) { alert('Anda harus menambahkan pengguna sebagai teman sebelum mengirim pesan.'); return; }
      } catch (err) { console.warn('Tidak dapat memverifikasi daftar teman:', err); }
    }

    setIsUploading(true);
    let fileURL = null, fileType = null, fileName = null;
    if (file) {
      const uploadResult = await uploadFile();
      if (uploadResult) { fileURL = uploadResult.url; fileType = uploadResult.type; fileName = uploadResult.name; } else { setIsUploading(false); alert('Gagal mengupload file.'); return; }
    }
    const collectionPath = data.isGroup ? 'groups' : 'chats';
    const messageData = { senderId: currentUser.uid, senderName: currentUser.displayName, createdAt: serverTimestamp(), text: text, fileURL, fileType, fileName, reactions: {}, isDeleted: false, isEdited: false, replyingTo };
    try {
      await addDoc(collection(db, collectionPath, data.chatId, 'messages'), messageData);
      const lastMessageData = { text: text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? '🖼️ Foto' : '📹 Video')), fileType, isDeleted: false };
      await updateLastMessageForAll(lastMessageData);

      // Send notifications to recipients
      if (data.isGroup) {
        // Group message - notify all members except sender
        try {
          const groupDoc = await getDoc(doc(db, 'groups', data.chatId));
          if (groupDoc.exists()) {
            const members = groupDoc.data().members || [];
            const recipientIds = members.filter(uid => uid !== currentUser.uid);

            if (recipientIds.length > 0) {
              const messagePreview = text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? '🖼️ Photo' : fileType === 'video' ? '📹 Video' : 'File'));
              await createBulkNotifications(recipientIds, {
                type: 'group_message',
                message: `${currentUser.displayName || 'Someone'} in ${data.groupName || 'Group'}`,
                actionUrl: '/chat',
                chatId: data.chatId
              });
            }
          }
        } catch (err) {
          console.error('Error sending group message notifications:', err);
        }
      } else if (data.user?.uid) {
        // Direct message - notify the other person
        try {
          const messagePreview = text || (fileName ? `📄 ${fileName}` : (fileType === 'image' ? '🖼️ Photo' : fileType === 'video' ? '📹 Video' : 'File'));
          await createNotification(data.user.uid, {
            type: 'personal_message',
            message: `New message from ${currentUser.displayName || 'Someone'}`,
            actionUrl: '/chat',
            chatId: data.chatId,
            senderId: currentUser.uid
          });
        } catch (err) {
          console.error('Error sending direct message notification:', err);
        }
      }
    } catch (err) { console.error('Error mengirim pesan: ', err); }

    setText(''); setFile(null); setReplyingTo(null); if (document.getElementById('file-upload')) document.getElementById('file-upload').value = null; setIsUploading(false);
    try { if (data.chatId && currentUser?.uid) await updateDoc(doc(db, 'typing', data.chatId), { [currentUser.uid]: FieldValue.delete() }); } catch (e) { }
  };

  const ReplyPreview = () => {
    if (!replyingTo) return null;
    let icon = null;
    if (replyingTo.fileType === 'image') icon = '🖼️ ';
    else if (replyingTo.fileType === 'video') icon = '📹 ';
    else if (replyingTo.fileType === 'raw' || replyingTo.fileType === 'auto') icon = '📄 ';
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
      {file && !isUploading ? (
        <div className="file-preview">
          <span>File terpilih: {file.name}</span>
          <button onClick={() => { setFile(null); document.getElementById('file-upload').value = null; }}>X</button>
        </div>
      ) : (
        <ReplyPreview />
      )}

      <div className="send-form-wrapper">
        {showEmojiPicker && (
          <div ref={pickerRef} className="emoji-picker-input-container">
            <Picker onEmojiClick={onEmojiClick} pickerStyle={{ width: '100%', boxShadow: 'none' }} preload />
          </div>
        )}

        <form onSubmit={handleSubmit} className="send-form">
          <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
          <label htmlFor="file-upload" className="attach-btn" title="Lampirkan File" aria-label="Lampirkan file"><FiPaperclip size={20} /></label>
          <button type="button" className="attach-btn" title="Pilih Emoji" aria-label="Pilih Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile size={20} /></button>
          <input ref={inputRef} aria-label="Ketik pesan" type="text" placeholder="Ketik pesan atau caption..." value={text} onChange={handleInputChange} onFocus={() => setShowEmojiPicker(false)} disabled={isUploading} />
          <button type="submit" className="primary" disabled={isUploading}>{isUploading ? <FiLoader className="loading-spinner-btn" /> : <FiSend />}</button>
        </form>
      </div>
    </>
  );
};

// ==========================================
// 7. KOMPONEN FORWARD MESSAGE MODAL
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

  // Helper update last message khusus forward
  const updateLastMessage = async (targetChatId, targetChatInfo, lastMessageData) => {
    // Sama seperti updateLastMessageForAll tapi bisa target spesifik
    const collectionPath = targetChatInfo.isGroup ? 'groups' : 'chats';
    try {
      if (targetChatInfo.isGroup) {
        const groupDoc = await getDoc(doc(db, 'groups', targetChatId));
        if (!groupDoc.exists()) return;
        const members = groupDoc.data().members || [];
        for (const uid of members) {
          const userChatDocRef = doc(db, 'userChats', uid);
          await updateDoc(userChatDocRef, { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() });
        }
        // update search index for group
        try { await indexChat(targetChatId, { isGroup: true, groupName: groupDoc.data().groupName || '', lastMessage: lastMessageData, date: serverTimestamp() }); } catch (err) { console.error('indexChat group update', err); }
      } else {
        // Update diri sendiri
        await updateDoc(doc(db, 'userChats', currentUser.uid), { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() });
        // Update lawan
        if (targetChatInfo.userInfo && targetChatInfo.userInfo.uid) {
          await updateDoc(doc(db, 'userChats', targetChatInfo.userInfo.uid), { [`${targetChatId}.lastMessage`]: lastMessageData, [`${targetChatId}.date`]: serverTimestamp() });
        }
        // update search index for direct chat
        try { await indexChat(targetChatId, { userInfo: targetChatInfo.userInfo, isGroup: false, lastMessage: lastMessageData, date: Date.now() }); } catch (err) { console.error('indexChat direct chat update', err); }
      }
    } catch (err) { console.error(err); }
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

  const renderForwardPreview = (msg) => {
    let content;
    switch (msg.fileType) {
      case 'image': content = (<> <img src={msg.fileURL} alt="Preview" className="message-image small-preview" /> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break;
      case 'video': content = (<> <video src={msg.fileURL} className="message-video small-preview" /> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break;
      case 'raw': case 'auto': content = (<> <div className="message-file small-preview"> <FiFile size={18} /> <span>{msg.fileName || 'File'}</span> </div> {msg.text && <p className="message-text caption small-preview">{msg.text}</p>} </>); break;
      default: content = <p className="message-text small-preview">{msg.text}</p>; break;
    }
    return <div className="forward-preview-bubble">{content}</div>;
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="forward-modal-title" tabIndex={-1}>
      <div className="modal-content forward-modal">
        <div className="modal-header"> <h3 id="forward-modal-title">Teruskan Pesan Ke...</h3> <button onClick={onClose} className="modal-close-btn" aria-label="Tutup"><FiX /></button> </div>
        <div className="modal-body">
          <div className="forward-message-preview"> <p>Pesan dari: {messageToForward.senderName || 'User'}</p> {renderForwardPreview(messageToForward)} </div> <hr className="divider" /> <label className="forward-label">Pilih Tujuan:</label>
          <div className="forward-chat-list">
            {isLoading && chats.length === 0 && <p className="no-chats">Memuat...</p>}
            {!isLoading && chats.length === 0 && <p className="no-chats">Tidak ada obrolan.</p>}
            {chats.map(([chatId, chatInfo]) => (<div key={chatId} className={`forward-chat-item ${selectedChats.includes(chatId) ? 'selected' : ''}`} onClick={() => handleSelectChat(chatId)}> <Avatar src={chatInfo.userInfo.photoURL} alt={chatInfo.userInfo.displayName} size={40} isGroup={chatInfo.isGroup} /> <span className="forward-chat-name">{chatInfo.userInfo.displayName}</span> <div className={`checkbox ${selectedChats.includes(chatId) ? 'checked' : ''}`}></div> </div>))}
          </div>
        </div>
        <div className="modal-footer"> {error && <p className="error-message">{error}</p>} <button aria-label={`Kirim ke ${selectedChats.length} tujuan`} onClick={handleForward} className="primary" disabled={isLoading || selectedChats.length === 0}> {isLoading ? <FiLoader className="loading-spinner-btn" /> : `Kirim ke ${selectedChats.length} tujuan`} </button> </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. KOMPONEN CHAT WINDOW
// ==========================================
const ChatWindow = ({ className, onBack }) => {
  const { data, dispatch } = useChat();
  const { currentUser } = useAuth();

  const [replyingTo, setReplyingTo] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    setReplyingTo(null);
    setMessageToForward(null);
    setShowForwardModal(false);
    setIsHeaderMenuOpen(false);
  }, [data.chatId]);

  useEffect(() => {
    if (!data.chatId) { setTypingUsers([]); return; }
    const typingDocRef = doc(db, 'typing', data.chatId);
    const unsub = onSnapshot(typingDocRef, (snap) => {
      const d = snap.exists() ? snap.data() : {};
      const names = Object.entries(d || {}).map(([uid, name]) => ({ uid, name })).filter(x => x.uid !== currentUser?.uid).map(x => x.name);
      setTypingUsers(names);
    }, (err) => { console.warn('typing listen failed', err); setTypingUsers([]); });
    return () => unsub();
  }, [data.chatId, currentUser?.uid]);

  useEffect(() => {
    if (!data.chatId) return;
    const collectionPath = data.isGroup ? 'groups' : 'chats';
    const q = query(collection(db, collectionPath, data.chatId, 'messages'), orderBy('createdAt'), limitToLast(1));
    const unsub = onSnapshot(q, (snap) => {
      snap.forEach(async (docSnap) => {
        const msg = { id: docSnap.id, ...docSnap.data() };
        if (!msg) return;
        if (msg.senderId !== currentUser.uid) {
          try {
            await updateDoc(doc(db, collectionPath, data.chatId, 'messages', msg.id), { seenBy: arrayUnion(currentUser.uid) });
          } catch (e) { /* ignore */ }
        }
      });
    });

    // Reset unread count for this chat
    const resetUnreadCount = async () => {
      try {
        const userChatRef = doc(db, 'userChats', currentUser.uid);
        // We need to use updateDoc with dot notation to specific field, avoiding overwrite
        // But we don't know the exact object structure easily without reading.
        // Actually we do: [data.chatId].unreadCount.
        await updateDoc(userChatRef, {
          [`${data.chatId}.unreadCount`]: 0
        });
      } catch (err) {
        console.error("Error resetting unread count:", err);
      }
    };
    resetUnreadCount();

    return () => unsub();
  }, [data.chatId, data.isGroup, currentUser?.uid]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target) && !event.target.closest('.chat-header-more-btn')) {
        setIsHeaderMenuOpen(false);
      }
    };
    if (isHeaderMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isHeaderMenuOpen]);

  const typingText = (() => {
    const n = typingUsers.length;
    if (n === 1) return `${typingUsers[0]} sedang mengetik`;
    if (n === 2) return `${typingUsers[0]} dan ${typingUsers[1]} sedang mengetik`;
    return `${typingUsers[0]} dan ${n - 1} lainnya sedang mengetik`;
  })();
  const typingFull = typingUsers.join(', ');

  const handleOpenForwardModal = (message) => { setMessageToForward(message); setShowForwardModal(true); };

  const handleTogglePin = async () => {
    if (!data.chatId || !currentUser?.uid) return;
    const userChatRef = doc(db, 'userChats', currentUser.uid);
    const newPinnedStatus = !data.isPinned;
    try {
      await updateDoc(userChatRef, {
        [`${data.chatId}.isPinned`]: newPinnedStatus
      });
      const newPayload = {
        userInfo: data.user,
        isGroup: data.isGroup,
        isPinned: newPinnedStatus,
        isArchived: data.isArchived
      };
      dispatch({ type: "CHANGE_USER", payload: newPayload });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
    setIsHeaderMenuOpen(false);
  };

  const handleToggleArchive = async () => {
    if (!data.chatId || !currentUser?.uid) return;
    const userChatRef = doc(db, 'userChats', currentUser.uid);
    const newArchivedStatus = !data.isArchived;
    try {
      const updates = {
        [`${data.chatId}.isArchived`]: newArchivedStatus
      };
      if (newArchivedStatus) {
        updates[`${data.chatId}.isPinned`] = false;
      }
      await updateDoc(userChatRef, updates);
      dispatch({ type: "RESET" });
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
    setIsHeaderMenuOpen(false);
  };

  if (!data.chatId) { return (<div className={`chat-window placeholder ${className || ''}`}> <div className="placeholder-content"> <FiSend size={50} /> <h2>Selamat Datang!</h2> <p>Pilih obrolan atau buat grup baru untuk memulai.</p> </div> </div>); }

  return (
    <>
      <div className={`chat-window ${className || ''}`}>
        <div className="chat-header">
          {onBack && (
            <button className="back-button" onClick={onBack} aria-label="Kembali">
              <FiArrowLeft size={24} />
            </button>
          )}
          <Avatar
            src={data.user?.photoURL}
            alt={data.user?.displayName || 'C'}
            size={40}
            isGroup={data.isGroup}
          />
          <ChatHeaderInfo data={data} typingUsers={typingUsers} typingText={typingText} />

          <div className="chat-header-menu-container">
            <button
              className="chat-header-more-btn"
              onClick={() => setIsHeaderMenuOpen(prev => !prev)}
              title="Opsi Obrolan"
              aria-haspopup="true"
              aria-expanded={isHeaderMenuOpen}
            >
              <FiMoreVertical />
            </button>
            {isHeaderMenuOpen && (
              <div className="chat-header-menu" ref={headerMenuRef} role="menu" aria-label="Menu Obrolan">
                <button role="menuitem" aria-label={data.isArchived ? 'Batal arsip obrolan' : 'Arsipkan obrolan'} onClick={handleToggleArchive}>
                  {data.isArchived ? <><FiInbox size={16} /> Batal Arsip</> : <><FiArchive size={16} /> Arsipkan</>}
                </button>
                {!data.isArchived && (
                  <button role="menuitem" aria-label={data.isPinned ? 'Lepas pin obrolan' : 'Pin obrolan'} onClick={handleTogglePin}>
                    {data.isPinned ? <> <FiX className="unpin-icon" size={16} /> Lepas Pin</> : <><FiMapPin size={16} /> Pin Obrolan</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <MessageList setReplyingTo={setReplyingTo} onForward={handleOpenForwardModal} />
        <SendForm replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
      </div>
      <ForwardMessageModal show={showForwardModal} onClose={() => setShowForwardModal(false)} messageToForward={messageToForward} />
    </>
  );
};

// ==========================================
// 9. MAIN COMPONENT
// ==========================================
const ChatHome = () => {
  const { data, dispatch } = useChat();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarClass = isMobile && data.chatId ? 'mobile-hidden' : '';
  const windowClass = isMobile && !data.chatId ? 'mobile-hidden' : '';

  const handleBack = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <DashboardLayout
      sidebar={<ChatSidebar className={sidebarClass} />}
      content={<ChatWindow className={windowClass} onBack={isMobile ? handleBack : null} />}
    />
  );
};

export default ChatHome;