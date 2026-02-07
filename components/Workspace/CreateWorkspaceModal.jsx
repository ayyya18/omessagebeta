import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiCamera, FiLoader, FiSearch, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import '../Calendar/AddEventModal.css'; // Reuse existing layout styles

// Reuse style from profile modal for consistency if needed, or inline styles
const CreateWorkspaceModal = ({ show, onClose, onCreate }) => {
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const nameRef = useRef(null);

    // Focus on show
    useEffect(() => {
        if (show) setTimeout(() => nameRef.current?.focus(), 100);
    }, [show]);

    // Handle File Selection (Mock Upload or Real if Cloudinary logic was here)
    // For now, let's mock the upload in context or just use URL if provided
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    // User Search Logic
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        const q = query(
            collection(db, 'users'),
            where('displayName', '>=', searchTerm.trim()),
            where('displayName', '<=', searchTerm.trim() + '\uf8ff')
        );

        try {
            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentUser.uid && !selectedMembers.find(m => m.uid === doc.id)) {
                    users.push({ uid: doc.id, ...doc.data() });
                }
            });
            setSearchResults(users);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const addMember = (user) => {
        setSelectedMembers(prev => [...prev, user]);
        setSearchResults([]);
        setSearchTerm('');
    };

    const removeMember = (uid) => {
        setSelectedMembers(prev => prev.filter(m => m.uid !== uid));
    };

    const handleSubmit = async (e) => {
        // Prevent default form submission
        e.preventDefault();
        console.log("CreateWorkspaceModal: Submit clicked");

        if (!name) {
            alert("Please enter a workspace name");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log("CreateWorkspaceModal: Calling onCreate with", { name, description, file, preview, selectedMembers });

            // Pass the file object and let context handle "upload" (mock or real)
            await onCreate({
                name,
                description,
                avatarFile: file, // Pass file to context
                avatarUrl: preview, // Fallback
                initialMembers: selectedMembers // Real user objects
            });

            console.log("CreateWorkspaceModal: Success");
            alert("Workspace created successfully!");

            // Reset
            onClose();
            setName('');
            setDescription('');
            setFile(null);
            setPreview(null);
            setSelectedMembers([]);
        } catch (error) {
            console.error("Create Workspace Failed:", error);
            setError("Failed to create workspace: " + error.message);
            alert("Error creating workspace: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>Create New Workspace</h3>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="modal-body" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                        {/* Avatar Upload */}
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--glass-border)' }}>
                                {preview ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiCamera size={24} style={{ opacity: 0.5 }} />}
                            </div>
                            <input
                                type="file"
                                id="ws-avatar"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <label htmlFor="ws-avatar" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-primary)', borderRadius: '50%', padding: 6, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                <FiCamera size={12} />
                            </label>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div className="form-group">
                                <label>Workspace Name</label>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    className="glass-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Design Team"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="glass-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Add Members</label>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="glass-input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search users by name..."
                            />
                            <button className="glass-btn small" type="submit" disabled={isLoading}>{isLoading ? <FiLoader /> : <FiSearch />}</button>
                        </form>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div style={{ marginTop: 8, background: 'var(--glass-bg)', borderRadius: 8, overflow: 'hidden' }}>
                                {searchResults.map(user => (
                                    <div key={user.uid} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                                {user.photoURL && <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%' }} />}
                                            </div>
                                            <span>{user.displayName}</span>
                                        </div>
                                        <button className="glass-btn icon-only small" onClick={() => addMember(user)}><FiUserPlus /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Members */}
                        {selectedMembers.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                {selectedMembers.map(user => (
                                    <div key={user.uid} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>{user.displayName}</span>
                                        <FiX style={{ cursor: 'pointer' }} onClick={() => removeMember(user.uid)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <p style={{ color: '#EF4444', fontSize: '0.9rem', marginTop: 12 }}>{error}</p>}
                </div>

                <div className="modal-footer">
                    <button type="button" className="glass-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="glass-btn primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <FiLoader className="spin" /> : 'Create Workspace'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateWorkspaceModal;
