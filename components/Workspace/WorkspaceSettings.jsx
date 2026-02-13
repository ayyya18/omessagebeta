import React, { useState } from 'react';
import { FiSave, FiTrash2, FiUser, FiShield, FiMoreVertical, FiUserPlus } from 'react-icons/fi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import InviteWorkspaceMemberModal from './InviteWorkspaceMemberModal';

const WorkspaceSettings = () => {
    const { currentWorkspace, updateWorkspace, removeMember, deleteWorkspace } = useWorkspace();
    const { currentUser } = useAuth();

    const [name, setName] = useState(currentWorkspace?.name || '');
    const [description, setDescription] = useState(currentWorkspace?.description || '');
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Helpers to check role
    const myRole = currentWorkspace?.members?.find(m => m.uid === currentUser?.uid)?.role || 'member';
    const isAdmin = myRole === 'admin';

    const handleSave = async () => {
        if (!currentWorkspace) return;
        await updateWorkspace(currentWorkspace.id, { name, description });
        alert("Settings saved!");
    };

    const handleRoleChange = async (uid, newRole) => {
        // In real app, call a cloud function or update nested object in Firestore
        // For now, we mock the logic or do a complex update if easier.
        // Given complexity of updating array of objects in Firestore without arrayRemove/Union perfectly,
        // we'll just alert that this requires backend logic, or try to update the whole member list.

        const updatedMembers = currentWorkspace.members.map(m => m.uid === uid ? { ...m, role: newRole } : m);
        await updateWorkspace(currentWorkspace.id, { members: updatedMembers });
    };

    if (!currentWorkspace) return null;

    return (
        <div className="workspace-settings-container" style={{ maxWidth: 800 }}>
            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 600 }}>Workspace Settings</h2>

            <div className="glass-card" style={{ padding: 24, borderRadius: 16, marginBottom: 32 }}>
                <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>General Information</h3>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Workspace Name</label>
                    <input
                        className="glass-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={!isAdmin}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
                    <textarea
                        className="glass-input"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        disabled={!isAdmin}
                    />
                </div>
                {isAdmin && (
                    <button className="glass-btn primary" onClick={handleSave}><FiSave style={{ marginRight: 8 }} /> Save Changes</button>
                )}
            </div>

            <div className="glass-card" style={{ padding: 24, borderRadius: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Members & Permissions</h3>
                    {isAdmin && (
                        <button className="glass-btn small primary" onClick={() => setShowInviteModal(true)}>
                            <FiUserPlus style={{ marginRight: 6 }} /> Add Member
                        </button>
                    )}
                </div>
                <div className="members-list">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>User</span>
                        <span>Role</span>
                        <span>Action</span>
                    </div>
                    {currentWorkspace.members?.map(member => (
                        <div key={member.uid} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 16, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiUser color="white" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500 }}>{member.email}</span>
                                    {member.uid === currentUser.uid && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>(You)</span>}
                                </div>
                            </div>

                            <div>
                                {isAdmin && member.uid !== currentUser.uid ? (
                                    <select
                                        className="glass-input small"
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.uid, e.target.value)}
                                        style={{ padding: '4px 8px' }}
                                    >
                                        <option value="member">Member</option>
                                        <option value="moderator">Co-Admin</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <span className="role-badge" style={{ textTransform: 'capitalize', fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>{member.role}</span>
                                )}
                            </div>

                            <div>
                                {isAdmin && member.uid !== currentUser.uid && (
                                    <button className="glass-btn icon-only small danger" onClick={() => removeMember(currentWorkspace.id, member.uid)}>
                                        <FiTrash2 />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isAdmin && (
                <div className="glass-card" style={{ padding: 24, borderRadius: 16, borderColor: 'red', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h3 style={{ marginBottom: 16, fontSize: '1.1rem', color: '#EF4444' }}>Danger Zone</h3>
                    <p style={{ marginBottom: 16, opacity: 0.7 }}>Deleting the workspace will remove all projects, tasks, and files permanently.</p>
                    <button className="glass-btn" style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', borderColor: '#EF4444' }} onClick={() => deleteWorkspace(currentWorkspace.id)}>
                        Delete Workspace
                    </button>
                </div>
            )}

            <InviteWorkspaceMemberModal
                show={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
        </div>
    );
};

export default WorkspaceSettings;
