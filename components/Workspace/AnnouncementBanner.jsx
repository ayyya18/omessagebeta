import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiX, FiEdit2, FiCheck, FiEyeOff, FiEye } from 'react-icons/fi';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

const AnnouncementBanner = () => {
    const { currentUser } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [originalText, setOriginalText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const CHARACTER_LIMIT = 250;
    const isAdmin = currentWorkspace?.members?.find(m => m.uid === currentUser?.uid)?.role === 'admin';

    // Load announcement from workspace document
    useEffect(() => {
        if (!currentWorkspace) return;

        const loadAnnouncement = async () => {
            try {
                const workspaceDoc = await getDoc(doc(db, 'workspaces', currentWorkspace.id));
                const data = workspaceDoc.data();
                if (data?.announcement) {
                    setText(data.announcement.text || '');
                    setOriginalText(data.announcement.text || '');
                    setIsVisible(data.announcement.visible !== false);
                } else {
                    setText('Welcome to the workspace! 🎉');
                    setOriginalText('Welcome to the workspace! 🎉');
                }
            } catch (err) {
                console.error('Error loading announcement:', err);
            }
        };
        loadAnnouncement();
    }, [currentWorkspace]);

    const saveAnnouncement = async (newText, visible) => {
        if (!currentWorkspace || !isAdmin) return;

        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'workspaces', currentWorkspace.id), {
                announcement: {
                    text: newText,
                    visible: visible,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUser.uid
                }
            });
            setOriginalText(newText);
        } catch (err) {
            console.error('Error saving announcement:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        saveAnnouncement(text, isVisible);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setText(originalText);
        setIsEditing(false);
    };

    const toggleVisibility = async () => {
        const newVisibility = !isVisible;
        setIsVisible(newVisibility);
        await saveAnnouncement(text, newVisibility);
    };

    if (!isVisible && !isAdmin) return null;

    return (
        <div
            className="announcement-banner"
            style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                padding: isEditing ? 16 : 12,
                display: 'flex',
                alignItems: isEditing ? 'flex-start' : 'center',
                gap: 12,
                marginBottom: 20,
                opacity: isVisible ? 1 : 0.5,
                transition: 'all 0.2s ease'
            }}
        >
            <FiAlertCircle
                style={{
                    color: '#3B82F6',
                    flexShrink: 0,
                    marginTop: isEditing ? 12 : 0
                }}
                size={20}
            />

            {isEditing ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                        className="glass-input"
                        value={text}
                        onChange={(e) => {
                            if (e.target.value.length <= CHARACTER_LIMIT) {
                                setText(e.target.value);
                            }
                        }}
                        placeholder="Enter announcement text..."
                        rows={2}
                        style={{
                            resize: 'none',
                            fontSize: '0.95rem'
                        }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            {text.length}/{CHARACTER_LIMIT} characters
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="glass-btn small" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button
                                className="glass-btn small primary"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                <FiCheck style={{ marginRight: 4 }} />
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <p style={{
                        flex: 1,
                        margin: 0,
                        fontSize: '0.95rem',
                        opacity: isVisible ? 1 : 0.5,
                        fontStyle: text ? 'normal' : 'italic'
                    }}>
                        {text || 'No announcement set'}
                    </p>

                    {isAdmin && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="glass-btn icon-only small"
                                onClick={() => setIsEditing(true)}
                                title="Edit announcement"
                            >
                                <FiEdit2 size={14} />
                            </button>
                            <button
                                className="glass-btn icon-only small"
                                onClick={toggleVisibility}
                                title={isVisible ? 'Hide banner' : 'Show banner'}
                            >
                                {isVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnnouncementBanner;
