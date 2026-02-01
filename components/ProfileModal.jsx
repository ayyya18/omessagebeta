// src/components/ProfileModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { FiX, FiCamera, FiLoader } from 'react-icons/fi';
import './ProfileModal.css'; // Kita akan buat file CSS ini
import { indexUser } from '../utils/searchIndex';
import useI18n from '../hooks/useI18n';

// Ambil config Cloudinary dari ChatHome (atau letakkan di file .env nanti)
// NOTE: Ini hanya cara cepat, idealnya config ini ada di satu tempat
const CLOUDINARY_CLOUD_NAME = "dca2fjndp"; 
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset";

const ProfileModal = ({ show, onClose }) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [handle, setHandle] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Ambil data profil saat ini dari Firestore saat modal dibuka
  useEffect(() => {
    if (show && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPreview(currentUser.photoURL || null); // Tampilkan foto profil saat ini

      // Ambil 'bio' dari dokumen 'users' kita
      const fetchUserData = async () => {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBio(docSnap.data().bio || '');
          setHandle(docSnap.data().handle || '');
        }
      };
      fetchUserData();
    }
  }, [show, currentUser]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Buat preview lokal untuk file yang baru dipilih
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      let newPhotoURL = currentUser.photoURL;

      // 1. Jika ada file baru, upload ke Cloudinary
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        newPhotoURL = data.secure_url;
      }

      // 2. Update Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: newPhotoURL,
      });

      // 3. Update dokumen 'users' di Firestore
      // Jika handle berubah, pastikan unik
      const userDocRef = doc(db, 'users', currentUser.uid);
      if (handle) {
        const normalizedHandle = handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`;
        // Cek unik
        const hq = query(collection(db, 'users'), where('handle', '==', normalizedHandle));
        const hSnap = await getDocs(hq);
        const conflict = hSnap.docs.find(d => d.id !== currentUser.uid);
        if (conflict) {
          throw new Error('Handle sudah digunakan oleh pengguna lain');
        }
        await updateDoc(userDocRef, {
          displayName: displayName,
          photoURL: newPhotoURL,
          bio: bio,
          handle: normalizedHandle
        });
      } else {
        await updateDoc(userDocRef, {
          displayName: displayName,
          photoURL: newPhotoURL,
          bio: bio,
        });
      }

      // Update search index for this user
      try {
        await indexUser({ uid: currentUser.uid, displayName, handle: handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '', photoURL: newPhotoURL });
      } catch (err) { console.error('indexUser after profile update failed', err); }

      // TODO (Masa Depan): Update info ini di semua 'userChats' terkait
      
      setIsLoading(false);
      onClose(); // Tutup modal
      
      // Refresh halaman untuk mengambil data 'currentUser' yang baru
      // Ini adalah cara mudah, cara yang lebih 'React' adalah me-refresh context
      window.location.reload(); 

    } catch (err) {
      console.error("Gagal update profil:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      // focus first input when modal opens
      setTimeout(() => { firstInputRef.current?.focus(); overlayRef.current?.focus(); }, 0);
    }
  }, [show]);

  useFocusTrap(overlayRef, show);

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" tabIndex={-1} ref={overlayRef} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="profile-modal-title">Atur Profil</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <FiX />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Bagian Foto Profil */}
          <div className="profile-pic-container">
            <img 
              src={preview || 'https://via.placeholder.com/100?text=No+Photo'} 
              alt="Profile" 
              className="profile-pic-preview"
            />
            <label htmlFor="profile-pic-upload" className="profile-pic-edit">
              <FiCamera />
            </label>
            <input 
              id="profile-pic-upload" 
              type="file" 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Bagian Form Input */}
          <div className="form-group">
            <label htmlFor="displayName">Username</label>
            <input
              id="displayName"
              ref={firstInputRef}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama tampilan Anda"
            />
          </div>
          <div className="form-group">
            <label htmlFor="handle">Handle (ID pengguna)</label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@handleAnda"
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <input
              id="bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan tentang diri Anda"
            />
          </div>
        </div>

        <div className="modal-footer">
          {error && <p className="error-message">{error}</p>}
          <button onClick={handleSave} className="primary" disabled={isLoading}>
            {isLoading ? <FiLoader className="loading-spinner-btn" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;