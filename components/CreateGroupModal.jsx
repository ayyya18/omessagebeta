// src/components/CreateGroupModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { FiX, FiCamera, FiLoader, FiSearch, FiUserPlus, FiTrash2 } from 'react-icons/fi';
// Gunakan CSS yang sama dengan ProfileModal untuk konsistensi
import './ProfileModal.css'; 

// AMBIL KONFIGURASI DARI TEMPAT LAIN (atau isi manual lagi di sini)
const CLOUDINARY_CLOUD_NAME = "dca2fjndp"; 
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset"; 

const CreateGroupModal = ({ show, onClose }) => {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // Daftar anggota
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fungsi upload foto (sama seperti di ProfileModal)
  const uploadPhoto = async () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url;
    } catch (err) {
      console.error(err);
      setError("Gagal upload foto grup.");
      return null;
    }
  };

  // Fungsi mencari user (sama seperti di Search)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const q = query(
      collection(db, 'users'),
      where('displayName', '==', searchTerm.trim())
    );
    try {
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        // Jangan tampilkan diri sendiri atau yang sudah ditambah
        if (doc.data().uid !== currentUser.uid && 
            !selectedMembers.find(m => m.uid === doc.data().uid)) {
          users.push(doc.data());
        }
      });
      setSearchResults(users);
    } catch (err) {
      console.error(err);
    }
  };

  // Tambah user ke daftar 'selectedMembers'
  const addMember = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setSearchResults([]); // Kosongkan hasil pencarian
    setSearchTerm('');
  };

  // Hapus user dari daftar 'selectedMembers'
  const removeMember = (uid) => {
    setSelectedMembers(prev => prev.filter(m => m.uid !== uid));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Nama grup tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Upload foto grup (jika ada)
      const groupPhotoURL = await uploadPhoto();

      // 2. Siapkan daftar anggota (termasuk pembuat)
      const memberIds = [currentUser.uid, ...selectedMembers.map(m => m.uid)];
      
      // 3. Buat dokumen grup baru di koleksi 'groups'
      const groupDocRef = await addDoc(collection(db, "groups"), {
        groupName: groupName,
        groupPhotoURL: groupPhotoURL || '',
        adminId: currentUser.uid,
        members: memberIds,
        createdAt: serverTimestamp(),
        lastMessage: { text: "Grup telah dibuat." }, // Pesan awal
        date: serverTimestamp()
      });

      const groupId = groupDocRef.id;

      // 4. Update 'userChats' untuk SETIAP anggota
      const groupInfo = {
        isGroup: true,
        userInfo: {
          uid: groupId, // ID grup
          displayName: groupName,
          photoURL: groupPhotoURL || ''
        },
        lastMessage: { text: "Grup telah dibuat." },
        date: serverTimestamp()
      };
      
      for (const uid of memberIds) {
        await updateDoc(doc(db, "userChats", uid), {
          [groupId]: groupInfo
        });
      }

      setIsLoading(false);
      resetForm();
      onClose(); // Tutup modal

    } catch (err) {
      console.error("Gagal buat grup:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setGroupName('');
    setFile(null);
    setPreview(null);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedMembers([]);
    setError('');
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Buat Grup Baru</h3>
          <button onClick={handleClose} className="modal-close-btn"><FiX /></button>
        </div>
        
        <div className="modal-body">
          {/* Foto & Nama Grup */}
          <div className="group-info-container">
            <div className="profile-pic-container small">
              <img 
                src={preview || 'https://via.placeholder.com/80?text=Grup'} 
                alt="Group" 
                className="profile-pic-preview"
              />
              <label htmlFor="group-pic-upload" className="profile-pic-edit small">
                <FiCamera />
              </label>
              <input 
                id="group-pic-upload" type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleFileChange}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="groupName">Nama Grup</label>
              <input
                id="groupName" type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nama grup Anda"
              />
            </div>
          </div>
          
          <hr className="divider" />
          
          {/* Tambah Anggota */}
          <div className="form-group">
            <label>Tambah Anggota (via username)</label>
            <form onSubmit={handleSearch} className="search-form compact">
              <input
                type="text"
                placeholder="Cari pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit"><FiSearch /></button>
            </form>
          </div>
          
          {/* Hasil Pencarian */}
          <div className="search-results-list">
            {searchResults.map(user => (
              <div key={user.uid} className="search-result-item">
                <img src={user.photoURL || `https://via.placeholder.com/30?text=${user.displayName[0]}`} alt={user.displayName} />
                <span>{user.displayName}</span>
                <button onClick={() => addMember(user)} className="add-member-btn">
                  <FiUserPlus />
                </button>
              </div>
            ))}
          </div>

          {/* Anggota Terpilih */}
          {selectedMembers.length > 0 && (
            <div className="selected-members-list">
              <label>Anggota (selain Anda):</label>
              {selectedMembers.map(member => (
                <div key={member.uid} className="member-tag">
                  <span>{member.displayName}</span>
                  <button onClick={() => removeMember(member.uid)}>
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {error && <p className="error-message">{error}</p>}
          <button onClick={handleCreateGroup} className="primary" disabled={isLoading}>
            {isLoading ? <FiLoader className="loading-spinner-btn" /> : 'Buat Grup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;