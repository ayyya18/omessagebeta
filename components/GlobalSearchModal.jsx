// src/components/GlobalSearchModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import { FiX } from 'react-icons/fi';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Fuse from 'fuse.js';
import { useChat } from '../context/ChatContext';

export default function GlobalSearchModal({ show, onClose }) {
  const [indexUsers, setIndexUsers] = useState([]);
  const [indexChats, setIndexChats] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { dispatch } = useChat();
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    let mounted = true;
    (async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'searchIndex_users'));
        const chatsSnap = await getDocs(collection(db, 'searchIndex_chats'));
        if (!mounted) return;
        setIndexUsers(usersSnap.docs.map(d => d.data()));
        setIndexChats(chatsSnap.docs.map(d => d.data()));
      } catch (err) { console.error('Failed to load search indexes', err); }
    })();
    return () => { mounted = false; };
  }, [show]);

  useEffect(() => {
    if (show) setTimeout(() => inputRef.current?.focus(), 0);
  }, [show]);

  useFocusTrap(overlayRef, show);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const combined = [
      ...indexUsers.map(u => ({ type: 'user', id: u.uid, title: u.displayName || u.handle, payload: u })),
      ...indexChats.map(c => ({ type: 'chat', id: c.chatId, title: c.displayName, payload: c }))
    ];
    const fuse = new Fuse(combined, { keys: ['title'], threshold: 0.4 });
    setResults(fuse.search(query).map(r => r.item));
  }, [query, indexUsers, indexChats]);

  const openItem = (item) => {
    if (item.type === 'chat') {
      // dispatch change user/chat
      dispatch({ type: 'CHANGE_USER', payload: { userInfo: { uid: item.payload.chatId, displayName: item.payload.displayName, photoURL: item.payload.photoURL || '' }, isGroup: item.payload.isGroup, date: item.payload.date, lastMessage: { text: item.payload.lastMessage } } });
      onClose();
    } else if (item.type === 'user') {
      // start 1-on-1 chat by dispatching a user object; UI handles creation
      dispatch({ type: 'CHANGE_USER', payload: { userInfo: { uid: item.payload.uid, displayName: item.payload.displayName, photoURL: item.payload.photoURL || '' }, isGroup: false } });
      onClose();
    }
  };

  if (!show) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="global-search-title" tabIndex={-1} ref={overlayRef} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-content">
        <div className="modal-header"><h3 id="global-search-title">Pencarian</h3><button onClick={onClose} className="modal-close-btn" aria-label="Close"><FiX /></button></div>
        <div className="modal-body">
          <input ref={inputRef} aria-label="Search people or chats" placeholder="Cari orang atau obrolan..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)' }} />
          <div style={{ marginTop: 12 }}>
            {results.length === 0 && <p className="no-chats">Tidak ada hasil.</p>}
            {results.map(r => (
              <div key={`${r.type}-${r.id}`} role="button" tabIndex={0} className="search-result" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, cursor: 'pointer' }} onClick={() => openItem(r)} onKeyDown={(e) => { if (e.key === 'Enter') openItem(r); }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.title?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.type === 'chat' ? (r.payload.lastMessage || '') : (r.payload.handle || '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
