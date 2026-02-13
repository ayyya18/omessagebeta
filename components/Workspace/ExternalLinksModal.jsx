import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiEdit2, FiExternalLink, FiSave } from 'react-icons/fi';
import '../Calendar/AddEventModal.css';

const ExternalLinksModal = ({ show, onClose, workspaceId, existingLinks = [], onSave }) => {
    const [links, setLinks] = useState([]);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        setLinks(existingLinks.map(link => ({ ...link })));
    }, [existingLinks]);

    const addNewLink = () => {
        const newLink = {
            id: `temp_${Date.now()}`,
            name: '',
            url: '',
            icon: '🔗',
            order: links.length,
            isNew: true
        };
        setLinks([...links, newLink]);
        setEditingId(newLink.id);
    };

    const updateLink = (id, field, value) => {
        setLinks(links.map(link =>
            link.id === id ? { ...link, [field]: value } : link
        ));
    };

    const deleteLink = (id) => {
        setLinks(links.filter(link => link.id !== id));
    };

    const handleSave = () => {
        // Filter out empty links
        const validLinks = links.filter(link => link.name.trim() && link.url.trim());
        onSave(validLinks);
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>Manage External Links</h3>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="modal-body" style={{ padding: 24 }}>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: 16 }}>
                        Add quick access links to external tools your team uses
                    </p>

                    {links.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: 40 }}>
                            <FiExternalLink size={32} style={{ marginBottom: 12 }} />
                            <p>No external links yet</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {links.map((link) => (
                            <div
                                key={link.id}
                                className="glass-card"
                                style={{
                                    padding: 12,
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'center',
                                    borderRadius: 12
                                }}
                            >
                                {/* Icon Picker */}
                                <input
                                    type="text"
                                    value={link.icon}
                                    onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                                    placeholder="🔗"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        textAlign: 'center',
                                        fontSize: '1.5rem',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 8,
                                        background: 'transparent'
                                    }}
                                    maxLength={2}
                                />

                                {/* Name */}
                                <input
                                    className="glass-input"
                                    placeholder="Link Name"
                                    value={link.name}
                                    onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                                    style={{ flex: '1' }}
                                />

                                {/* URL */}
                                <input
                                    className="glass-input"
                                    placeholder="https://..."
                                    value={link.url}
                                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                                    style={{ flex: '2' }}
                                />

                                {/* Delete */}
                                <button
                                    className="glass-btn icon-only small"
                                    onClick={() => deleteLink(link.id)}
                                    style={{ color: '#EF4444' }}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        className="glass-btn"
                        onClick={addNewLink}
                        style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                    >
                        <FiPlus style={{ marginRight: 8 }} /> Add Link
                    </button>
                </div>

                <div className="modal-footer">
                    <button className="glass-btn" onClick={onClose}>Cancel</button>
                    <button className="glass-btn primary" onClick={handleSave}>
                        <FiSave style={{ marginRight: 8 }} /> Save Links
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExternalLinksModal;
