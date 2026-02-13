import React, { useState, useEffect, useRef } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteField, query, collection, where, getDocs, arrayUnion, deleteDoc } from 'firebase/firestore';
import { FiX, FiShield, FiTrash2, FiCamera, FiSearch, FiUserPlus, FiLoader } from 'react-icons/fi';
import useI18n from '../hooks/useI18n';
import { indexChat, deleteChatIndex } from '../utils/searchIndex';
import './ProfileModal.css'; // Re-use CSS
import { useChat } from '../context/ChatContext';

const CLOUDINARY_CLOUD_NAME = 'dca2fjndp';
const CLOUDINARY_UPLOAD_PRESET = 'message-app-preset';

const GroupInfoModal = ({ show, onClose, chatId }) => {
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (show && chatId) fetchGroupData();
    // cleanup preview URL on hide
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [show, chatId]);

  const overlayRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        if (groupData && groupData.adminId === currentUser.uid) {
          nameRef.current?.focus();
        } else {
          overlayRef.current?.focus();
        }
      }, 0);
    }
  }, [show, groupData]);

  useFocusTrap(overlayRef, show);

  const currentUser = auth.currentUser || {};
  const { dispatch } = useChat();
  const { t } = useI18n();

  const fetchGroupData = async () => {
    try {
      const gDoc = await getDoc(doc(db, 'groups', chatId));
      if (gDoc.exists()) {
        const data = gDoc.data();
        setGroupData(data);
        const memberUids = data.members || [];
        const memDocs = await Promise.all(memberUids.map(uid => getDoc(doc(db, 'users', uid))));
        const mems = memDocs.map(d => d.exists() ? d.data() : null).filter(Boolean);
        setMembers(mems);
        setNewName(data.groupName || '');
        setPreview(data.groupPhotoURL || null);
      }
    } catch (err) { console.error('fetchGroupData', err); }
  };

  const kickMember = async (uid) => {
    if (!window.confirm(t('confirmKick'))) return;
    try {
      await updateDoc(doc(db, 'groups', chatId), { members: arrayRemove(uid) });
      await updateDoc(doc(db, 'userChats', uid), { [chatId]: deleteField() });
      // Refresh and check if group is now empty
      await fetchGroupData();
      try {
        const gDoc = await getDoc(doc(db, 'groups', chatId));
        const mems = gDoc.exists() ? (gDoc.data().members || []) : [];
        if (!gDoc.exists() || mems.length === 0) {
          try { await deleteDoc(doc(db, 'groups', chatId)); } catch (e) { console.error('delete group doc failed', e); }
          try { await deleteChatIndex(chatId); } catch (e) { console.error('deleteChatIndex failed', e); }
        }
      } catch (e) { console.error('post-kick check failed', e); }
    } catch (err) { console.error('kickMember', err); }
  };

  const promoteToAdmin = async (uid) => {
    if (!currentUser || currentUser.uid !== groupData?.adminId) return alert('Hanya admin yang dapat mempromosikan anggota.');
    if (!window.confirm('Jadikan anggota ini sebagai admin grup?')) return;
    try {
      await updateDoc(doc(db, 'groups', chatId), { adminId: uid });
      await fetchGroupData();
      try { await indexChat(chatId, { isGroup: true, groupName: groupData.groupName || '', lastMessage: groupData.lastMessage || { text: '' }, date: groupData.createdAt || null }); } catch (e) { console.error('indexChat promote admin', e); }
    } catch (err) { console.error('promoteToAdmin', err); }
  };

  const leaveGroup = async () => {
    if (!currentUser || !groupData) return;
    const amAdmin = currentUser.uid === groupData.adminId;
    try {
      const membersList = groupData.members || [];
      if (amAdmin) {
        if (membersList.length === 1) {
          if (!window.confirm('Anda adalah admin dan satu-satunya anggota. Meninggalkan grup akan menghapus grup. Lanjutkan?')) return;
          // remove userChats entries for all (only current user in list)
          for (const uid of membersList) {
            await updateDoc(doc(db, 'userChats', uid), { [chatId]: deleteField() });
          }
          try { await deleteDoc(doc(db, 'groups', chatId)); } catch (e) { console.error('delete group doc failed', e); }
          try { await deleteChatIndex(chatId); } catch (e) { console.error('deleteChatIndex failed', e); }
          dispatch({ type: 'CHANGE_USER', payload: {} });
          onClose();
          return;
        }

        // transfer admin and leave
        const other = membersList.find(u => u !== currentUser.uid);
        if (!other) return alert('Tidak ada anggota lain untuk menyerahkan admin.');
        if (!window.confirm('Anda admin. Grup akan meneruskan admin ke anggota lain dan Anda akan meninggalkan grup. Lanjutkan?')) return;
        await updateDoc(doc(db, 'groups', chatId), { members: arrayRemove(currentUser.uid), adminId: other });
        await updateDoc(doc(db, 'userChats', currentUser.uid), { [chatId]: deleteField() });
        dispatch({ type: 'CHANGE_USER', payload: {} });
        onClose();
        return;
      } else {
        if (!window.confirm('Anda akan meninggalkan grup. Lanjutkan?')) return;
        await updateDoc(doc(db, 'groups', chatId), { members: arrayRemove(currentUser.uid) });
        await updateDoc(doc(db, 'userChats', currentUser.uid), { [chatId]: deleteField() });
        // after leaving, if group is empty delete group doc and index
        try {
          const gDoc = await getDoc(doc(db, 'groups', chatId));
          const mems = gDoc.exists() ? (gDoc.data().members || []) : [];
          if (!gDoc.exists() || mems.length === 0) {
            try { await deleteDoc(doc(db, 'groups', chatId)); } catch (e) { console.error('delete group doc failed', e); }
            try { await deleteChatIndex(chatId); } catch (e) { console.error('deleteChatIndex failed', e); }
          }
        } catch (e) { console.error('post-leave check failed', e); }
        dispatch({ type: 'CHANGE_USER', payload: {} });
        onClose();
        return;
      }
    } catch (err) { console.error('leaveGroup', err); }
  };

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const qDisplayName = query(collection(db, 'users'), where('displayName', '==', searchTerm.trim()));
      const qEmail = query(collection(db, 'users'), where('email', '==', searchTerm.trim()));
      const qUsername = query(collection(db, 'users'), where('username', '==', searchTerm.trim())); // Assuming username field

      const [snapDisplay, snapEmail, snapUsername] = await Promise.all([
        getDocs(qDisplayName),
        getDocs(qEmail),
        getDocs(qUsername)
      ]);

      const foundUsers = new Map();

      [snapDisplay, snapEmail, snapUsername].forEach(snap => {
        snap.forEach(d => {
          const u = d.data();
          if (u.uid !== currentUser.uid && !(groupData?.members || []).includes(u.uid)) {
            foundUsers.set(u.uid, u);
          }
        });
      });

      setSearchResults(Array.from(foundUsers.values()));
    } catch (err) { console.error('handleSearch', err); }
  };

  const addMember = async (user) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'groups', chatId), { members: arrayUnion(user.uid) });
      const groupInfo = {
        isGroup: true,
        userInfo: { uid: chatId, displayName: groupData.groupName || 'Group', photoURL: groupData.groupPhotoURL || '' },
        lastMessage: groupData.lastMessage || { text: '' },
        date: groupData.createdAt || null
      };
      await updateDoc(doc(db, 'userChats', user.uid), { [chatId]: groupInfo });
      setSearchResults([]);
      setSearchTerm('');
      await fetchGroupData();
    } catch (err) { console.error('addMember', err); }
    setIsLoading(false);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadPhoto = async () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url;
    } catch (err) { console.error('uploadPhoto', err); return null; }
  };

  const saveChanges = async () => {
    if (!currentUser || !groupData) return;
    if (currentUser.uid !== groupData.adminId) return alert('Hanya admin yang dapat mengubah pengaturan grup.');
    setIsLoading(true);
    try {
      let photoURL = groupData.groupPhotoURL || '';
      if (file) {
        const uploaded = await uploadPhoto();
        if (uploaded) photoURL = uploaded;
      }
      await updateDoc(doc(db, 'groups', chatId), { groupName: newName, groupPhotoURL: photoURL });
      for (const uid of groupData.members || []) {
        await updateDoc(doc(db, 'userChats', uid), { [`${chatId}.userInfo`]: { uid: chatId, displayName: newName, photoURL } });
      }
      try { await indexChat(chatId, { isGroup: true, groupName: newName, lastMessage: groupData.lastMessage || { text: '' }, date: groupData.createdAt || null }); } catch (err) { console.error('indexChat group saveChanges failed', err); }
      await fetchGroupData();
    } catch (err) { console.error('saveChanges', err); }
    setIsLoading(false);
  };

  if (!show || !groupData) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="group-info-title" tabIndex={-1} ref={overlayRef} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3 id="group-info-title">Info Grup</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close"><FiX /></button>
        </div>
        <div className="modal-body">
          <div className="profile-pic-container">
            <img src={preview || groupData.groupPhotoURL || 'https://via.placeholder.com/100'} className="profile-pic-preview" />
            {currentUser.uid === groupData.adminId && (
              <>
                <label htmlFor="group-info-pic" className="profile-pic-edit small"><FiCamera /></label>
                <input id="group-info-pic" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </>
            )}
          </div>
          <h2 style={{ textAlign: 'center', marginTop: 10 }}>
            {currentUser.uid === groupData.adminId ? (
              <input ref={nameRef} value={newName} onChange={(e) => setNewName(e.target.value)} style={{ textAlign: 'center', fontSize: 20, fontWeight: 600 }} />
            ) : groupData.groupName}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{members.length} Anggota</p>

          <div style={{ marginTop: 20 }}>
            {currentUser.uid === groupData.adminId && (
              <form onSubmit={handleSearch} className="search-form compact" style={{ marginBottom: 8 }}>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari pengguna untuk ditambahkan..." />
                <button type="submit"><FiSearch /></button>
              </form>
            )}

            <div className="search-results-list">
              {members.map(m => (
                <div key={m.uid} className="search-result-item">
                  <img src={m.photoURL || 'https://via.placeholder.com/40'} style={{ width: 30, height: 30, borderRadius: '50%' }} />
                  <span style={{ flex: 1, marginLeft: 10 }}>
                    {m.displayName} <small style={{ color: 'cyan' }}>{m.username}</small>
                    {m.uid === groupData.adminId && <FiShield style={{ marginLeft: 5, color: 'gold' }} />}
                  </span>
                  {currentUser.uid === groupData.adminId && m.uid !== currentUser.uid && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => promoteToAdmin(m.uid)} className="icon-btn" title="Jadikan Admin" aria-label={`Jadikan ${m.displayName} admin`}><FiShield /></button>
                      <button onClick={() => kickMember(m.uid)} className="icon-btn-danger" aria-label={`Keluarkan ${m.displayName} dari grup`}><FiTrash2 /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results-list" style={{ marginTop: 8 }}>
                {searchResults.map(u => (
                  <div key={u.uid} className="search-result-item">
                    <img src={u.photoURL || `https://via.placeholder.com/40?text=${u.displayName?.[0] || '?'}`} style={{ width: 30, height: 30, borderRadius: '50%' }} />
                    <span style={{ flex: 1, marginLeft: 10 }}>{u.displayName}</span>
                    <button onClick={() => addMember(u)} disabled={isLoading} className="add-member-btn">{isLoading ? <FiLoader /> : <FiUserPlus />}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {currentUser.uid === groupData.adminId && (
              <button onClick={saveChanges} className="primary" disabled={isLoading}>{isLoading ? <FiLoader className="loading-spinner-btn" /> : 'Simpan Perubahan'}</button>
            )}
            <button onClick={leaveGroup} className="danger">{currentUser.uid === groupData.adminId ? 'Tinggalkan Grup (Transfer/Remove)' : 'Tinggalkan Grup'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;