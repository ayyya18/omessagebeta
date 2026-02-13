import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSearch, FiUserPlus, FiLoader, FiCheck } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const InviteWorkspaceMemberModal = ({ show, onClose }) => {
    const { currentUser } = useAuth();
    const { currentWorkspace, inviteMember } = useWorkspace();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState([]); // Track who we just invited in this session
    const overlayRef = useRef(null);
    const inputRef = useRef(null);

    useFocusTrap(overlayRef, show);

    useEffect(() => {
        if (show) {
            // Focus input on open
            if(inputRef.current) inputRef.current.focus();
            setSearchTerm('');
            setSearchResults([]);
            setInvitedUsers([]);
        }
    }, [show]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setSearchResults([]);
        try {
            const usersRef = collection(db, 'users');
            const term = searchTerm.trim();
            
            // Parallel queries for email, username, displayName
            // Firestore OR queries are limited, so we do parallel requests and merge
            const promises = [
                getDocs(query(usersRef, where('email', '==', term))),
                getDocs(query(usersRef, where('username', '==', term))),
                getDocs(query(usersRef, where('displayName', '==', term)))
            ];

            const snapshots = await Promise.all(promises);
            const foundUsers = new Map();

            snapshots.forEach(snap => {
                snap.forEach(doc => {
                    const userData = doc.data();
                    // Don't include self
                    if (userData.uid !== currentUser.uid) {
                         // Check if already a member of the workspace
                         const isMember = currentWorkspace?.members?.some(m => m.uid === userData.uid);
                         if (!isMember) {
                             foundUsers.set(userData.uid, userData);
                         }
                    }
                });
            });

            setSearchResults(Array.from(foundUsers.values()));

        } catch (error) {
            console.error("Error searching users:", error);
            // Optionally set error state here
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (user) => {
        if (invitedUsers.includes(user.uid)) return;
        
        try {
            await inviteMember(currentWorkspace.id, user); 
            setInvitedUsers(prev => [...prev, user.uid]);
        } catch (error) {
            console.error("Failed to invite:", error);
            alert("Failed to invite user: " + error.message);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" tabIndex={-1} ref={overlayRef}>
             <div className="modal-content glass-card" style={{ maxWidth: 500, width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3>Invite to Workspace</h3>
                    <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                </div>
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                    <form onSubmit={handleSearch} className="search-form" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                        <div className="input-with-icon" style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                            <FiSearch className="input-icon" style={{ position: 'absolute', left: 10, opacity: 0.5 }} />
                            <input
                                ref={inputRef}
                                type="text"
                                className="glass-input"
                                placeholder="Email, username, or name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 35, width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="glass-btn primary" disabled={isLoading || !searchTerm.trim()}>
                            {isLoading ? <FiLoader className="spin" /> : 'Search'}
                        </button>
                    </form>

                    <div className="search-results-list">
                        {searchResults.length === 0 && !isLoading && searchTerm && (
                            <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
                                No users found matching "{searchTerm}"
                            </div>
                        )}
                        
                        {searchResults.map(user => {
                            const isInvited = invitedUsers.includes(user.uid);
                            return (
                                <div key={user.uid} className="search-result-item glass-card" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: 12, 
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ position: 'relative', marginRight: 12 }}>
                                         <img 
                                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                                            alt={user.displayName}
                                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    </div>
                                   
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                            {user.email} {user.username && `• @${user.username}`}
                                        </div>
                                    </div>
                                    <button 
                                        className={`glass-btn small ${isInvited ? 'success' : 'primary'}`}
                                        onClick={() => handleInvite(user)}
                                        disabled={isInvited}
                                        style={{ marginLeft: 10 }}
                                    >
                                        {isInvited ? <><FiCheck /> Invited</> : <><FiUserPlus /> Invite</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteWorkspaceMemberModal;
