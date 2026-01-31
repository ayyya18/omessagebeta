// src/components/GroupInfoModal.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteField, query, collection, where, getDocs, arrayUnion } from 'firebase/firestore';
import { FiX, FiShield, FiTrash2, FiCamera, FiSearch, FiUserPlus, FiLoader } from 'react-icons/fi';
import './ProfileModal.css'; // Re-use CSS

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
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (show && chatId) fetchGroupData();
  }, [show, chatId]);

  const fetchGroupData = async () => {
    try {
      const gDoc = await getDoc(doc(db, 'groups', chatId));
      if (gDoc.exists()) {
        const data = gDoc.data();
        setGroupData(data);
        const mems = await Promise.all((data.members || []).map(uid => getDoc(doc(db, 'users', uid))));
        setMembers(mems.map(d => d.data()).filter(Boolean));
        setNewName(data.groupName || '');
        setPreview(data.groupPhotoURL || null);
      }
    } catch (err) { console.error('fetchGroupData', err); }
  };

  const kickMember = async (uid) => {
    if (!window.confirm('Keluarkan anggota ini?')) return;
    try {
      await updateDoc(doc(db, 'groups', chatId), { members: arrayRemove(uid) });
      await updateDoc(doc(db, 'userChats', uid), { [chatId]: deleteField() });
      await fetchGroupData();
    } catch (err) { console.error('kickMember', err); }
  };

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const q = query(collection(db, 'users'), where('displayName', '==', searchTerm.trim()));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => {
        const u = d.data();
        if (u.uid !== currentUser.uid && !(groupData?.members || []).includes(u.uid)) results.push(u);
      });
      setSearchResults(results);
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
      await fetchGroupData();
    } catch (err) { console.error('saveChanges', err); }
    setIsLoading(false);
  };

  if (!show || !groupData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3>Info Grup</h3>
          <button onClick={onClose} className="modal-close-btn"><FiX/></button>
        </div>
        <div className="modal-body">
          <div className="profile-pic-container">
            <img src={preview || groupData.groupPhotoURL || 'https://via.placeholder.com/100'} className="profile-pic-preview"/>
            {currentUser.uid === groupData.adminId && (
              <>
                <label htmlFor="group-info-pic" className="profile-pic-edit small"><FiCamera/></label>
                <input id="group-info-pic" type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
              </>
            )}
          </div>
          <h2 style={{textAlign:'center', marginTop:10}}>
            {currentUser.uid === groupData.adminId ? (
              <input value={newName} onChange={(e) => setNewName(e.target.value)} style={{textAlign:'center', fontSize:20, fontWeight:600}} />
            ) : groupData.groupName}
          </h2>
          <p style={{textAlign:'center', color:'var(--text-secondary)'}}>{members.length} Anggota</p>

          <div style={{marginTop:20}}>
            {currentUser.uid === groupData.adminId && (
              <form onSubmit={handleSearch} className="search-form compact" style={{marginBottom:8}}>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari pengguna untuk ditambahkan..." />
                <button type="submit"><FiSearch /></button>
              </form>
            )}

            <div className="search-results-list">
              {members.map(m => (
                <div key={m.uid} className="search-result-item">
                  <img src={m.photoURL || 'https://via.placeholder.com/40'} style={{width:30, height:30, borderRadius:'50%'}}/>
                  <span style={{flex:1, marginLeft:10}}>
                     {m.displayName} <small style={{color:'cyan'}}>{m.username}</small>
                     {m.uid === groupData.adminId && <FiShield style={{marginLeft:5, color:'gold'}}/>}
                  </span>
                  {currentUser.uid === groupData.adminId && m.uid !== currentUser.uid && (
                    <button onClick={() => kickMember(m.uid)} className="icon-btn-danger"><FiTrash2/></button>
                  )}
                </div>
              ))}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results-list" style={{marginTop:8}}>
                {searchResults.map(u => (
                  <div key={u.uid} className="search-result-item">
                    <img src={u.photoURL || `https://via.placeholder.com/40?text=${u.displayName[0]}`} style={{width:30, height:30, borderRadius:'50%'}}/>
                    <span style={{flex:1, marginLeft:10}}>{u.displayName}</span>
                    <button onClick={() => addMember(u)} disabled={isLoading} className="add-member-btn">{isLoading ? <FiLoader/> : <FiUserPlus/>}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {currentUser.uid === groupData.adminId && (
            <button onClick={saveChanges} className="primary" disabled={isLoading}>{isLoading ? <FiLoader className="loading-spinner-btn"/> : 'Simpan Perubahan'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
// src/components/GroupInfoModal.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteField, query, collection, where, getDocs, arrayUnion } from 'firebase/firestore';
import { FiX, FiShield, FiTrash2, FiCamera, FiSearch, FiUserPlus, FiLoader } from 'react-icons/fi';
import './ProfileModal.css'; // Re-use CSS

const GroupInfoModal = ({ show, onClose, chatId }) => {
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [newName, setNewName] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (show && chatId) fetchGroupData();
  }, [show, chatId]);

  const fetchGroupData = async () => {
    try {
      const gDoc = await getDoc(doc(db, "groups", chatId));
      if (gDoc.exists()) {
        const data = gDoc.data();
        setGroupData(data);
        // Ambil data detail setiap member
        const mems = await Promise.all(data.members.map(uid => getDoc(doc(db, "users", uid))));
        setMembers(mems.map(d => d.data()));
        setNewName(data.groupName || '');
        setPreview(data.groupPhotoURL || null);
      }
    } catch (err) { console.error(err); }
  };

  const kickMember = async (uid) => {
    if(!window.confirm("Keluarkan anggota ini?")) return;
    try {
      await updateDoc(doc(db, "groups", chatId), { members: arrayRemove(uid) });
      await updateDoc(doc(db, "userChats", uid), { [chatId]: deleteField() });
      fetchGroupData(); // Refresh list
    } catch (err) { console.error(err); }
  };

  if (!show || !groupData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3>Info Grup</h3>
          <button onClick={onClose} className="modal-close-btn"><FiX/></button>
        </div>
        <div className="modal-body">
          <div className="profile-pic-container">
            <img src={groupData.groupPhotoURL || "https://via.placeholder.com/100"} className="profile-pic-preview"/>
          </div>
          <h2 style={{textAlign:'center', marginTop:10}}>{groupData.groupName}</h2>
          <p style={{textAlign:'center', color:'var(--text-secondary)'}}>{members.length} Anggota</p>
          
          <div className="search-results-list" style={{marginTop:20}}>
            {members.map(m => (
              <div key={m.uid} className="search-result-item">
                <img src={m.photoURL || "https://via.placeholder.com/40"} style={{width:30, height:30, borderRadius:'50%'}}/>
                <span style={{flex:1, marginLeft:10}}>
                   {m.displayName} <small style={{color:'cyan'}}>{m.username}</small>
                   {m.uid === groupData.adminId && <FiShield style={{marginLeft:5, color:'gold'}}/>}
                </span>
                {/* Fitur Admin Kick */}
                {currentUser.uid === groupData.adminId && m.uid !== currentUser.uid && (
                  <button onClick={() => kickMember(m.uid)} className="icon-btn-danger"><FiTrash2/></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const q = query(collection(db, 'users'), where('displayName', '==', searchTerm.trim()));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => {
        const u = d.data();
        if (u.uid !== currentUser.uid && !(groupData.members || []).includes(u.uid)) results.push(u);
      });
      setSearchResults(results);
    } catch (err) { console.error(err); }
  };

  const addMember = async (user) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'groups', chatId), { members: arrayUnion(user.uid) });
      // Also add userChat entry for the new member
      const groupInfo = {
        isGroup: true,
        userInfo: { uid: chatId, displayName: groupData.groupName || 'Group', photoURL: groupData.groupPhotoURL || '' },
        lastMessage: groupData.lastMessage || { text: '' },
        date: groupData.createdAt || null
      };
      await updateDoc(doc(db, 'userChats', user.uid), { [chatId]: groupInfo });
      setSearchResults([]);
      setSearchTerm('');
      fetchGroupData();
    } catch (err) { console.error(err); }
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
    formData.append('upload_preset', 'message-app-preset');
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dca2fjndp/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url;
    } catch (err) { console.error(err); return null; }
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
      // Update userChats for members
      for (const uid of groupData.members || []) {
        await updateDoc(doc(db, 'userChats', uid), { [chatId + '.userInfo']: { uid: chatId, displayName: newName, photoURL } });
      }
      fetchGroupData();
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };
export default GroupInfoModal;