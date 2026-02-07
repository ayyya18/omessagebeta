import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiTag, FiTrash2, FiMessageSquare, FiSend } from 'react-icons/fi';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import '../Calendar/AddEventModal.css';

const TaskDetailModal = ({ show, onClose, task, workspaceMembers = [], workspace, project }) => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('General');
    const [status, setStatus] = useState('todo');
    const [progress, setProgress] = useState(0);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setStartDate(task.start || '');
            setDueDate(task.end || task.start || '');
            setPriority(task.priority || 'medium');
            setCategory(task.category || 'General');
            setStatus(task.status || 'todo');
            setProgress(task.progress || 0);

            // Map assignee IDs to member objects
            const assigneeMembers = (task.assignees || [])
                .map(id => workspaceMembers.find(m => m.uid === id))
                .filter(Boolean);
            setSelectedAssignees(assigneeMembers);
        }
    }, [task, workspaceMembers]);

    const handleUpdate = async () => {
        if (!task || !title) return;
        try {
            await updateDoc(doc(db, task.path), {
                title,
                description,
                start: startDate,
                end: dueDate,
                priority,
                category,
                status,
                progress,
                assignees: selectedAssignees.map(a => a.uid),
                updatedAt: new Date().toISOString()
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const handleDelete = async () => {
        if (!task || !window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await deleteDoc(doc(db, task.path));
            onClose();
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const toggleAssignee = (member) => {
        if (selectedAssignees.find(a => a.uid === member.uid)) {
            setSelectedAssignees(prev => prev.filter(a => a.uid !== member.uid));
        } else {
            setSelectedAssignees(prev => [...prev, member]);
        }
    };

    if (!show || !task) return null;

    const statusOptions = [
        { value: 'todo', label: 'TO DO', color: '#3B82F6' },
        { value: 'doing', label: 'DOING', color: '#F59E0B' },
        { value: 'review', label: 'IN REVIEW', color: '#EF4444' }
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Edit Task' : 'Task Details'}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {!isEditing && (
                            <button className="glass-btn small" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        )}
                        <button className="close-btn" onClick={onClose}><FiX /></button>
                    </div>
                </div>

                <div className="modal-body" style={{ padding: 24 }}>
                    {/* Status Indicator */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Status</label>
                        {isEditing ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                                {statusOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            border: status === opt.value ? `2px solid ${opt.color}` : '1px solid var(--glass-border)',
                                            background: status === opt.value ? `${opt.color}22` : 'transparent',
                                            color: status === opt.value ? opt.color : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span style={{
                                display: 'inline-block',
                                padding: '6px 14px',
                                borderRadius: 8,
                                background: statusOptions.find(s => s.value === status)?.color + '22',
                                color: statusOptions.find(s => s.value === status)?.color,
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                {statusOptions.find(s => s.value === status)?.label}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label>Title</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="glass-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        ) : (
                            <h2 style={{ margin: '8px 0 16px', fontSize: '1.5rem' }}>{task.title}</h2>
                        )}
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Description</label>
                        {isEditing ? (
                            <textarea
                                className="glass-input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                            />
                        ) : (
                            <p style={{ lineHeight: 1.6, opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                                {task.description || 'No description provided.'}
                            </p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label><FiCalendar style={{ marginRight: 8 }} /> Start Date</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            ) : (
                                <div style={{ padding: '10px 0' }}>
                                    {task.start ? new Date(task.start).toLocaleDateString() : 'Not set'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label><FiCalendar style={{ marginRight: 8 }} /> Due Date</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            ) : (
                                <div style={{ padding: '10px 0' }}>
                                    {task.end || task.start ? new Date(task.end || task.start).toLocaleDateString() : 'Not set'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Priority & Category */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label><FiTag style={{ marginRight: 8 }} /> Priority</label>
                            {isEditing ? (
                                <select className="glass-input" value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            ) : (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    background: task.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.1)',
                                    color: task.priority === 'high' ? '#EF4444' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginTop: 8
                                }}>
                                    {task.priority?.toUpperCase() || 'MEDIUM'}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><FiTag style={{ marginRight: 8 }} /> Category</label>
                            {isEditing ? (
                                <select className="glass-input" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="General">General</option>
                                    <option value="Design">Design</option>
                                    <option value="Development">Development</option>
                                    <option value="Research">Research</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            ) : (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    background: 'rgba(59,130,246,0.1)',
                                    color: '#3B82F6',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginTop: 8
                                }}>
                                    {task.category || 'General'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Field */}
                    <div className="form-group">
                        <label>Progress</label>
                        {isEditing ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={e => setProgress(parseInt(e.target.value))}
                                        style={{
                                            flex: 1,
                                            height: 6,
                                            borderRadius: 3,
                                            background: `linear-gradient(to right, #10B981 0%, #10B981 ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`,
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{
                                        minWidth: 60,
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        color: progress === 100 ? '#10B981' : 'var(--text-primary)'
                                    }}>
                                        {progress}%
                                    </span>
                                </div>
                                <div style={{
                                    height: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #10B981, ${progress > 50 ? '#34D399' : '#10B981'})`,
                                        transition: 'width 0.3s ease',
                                        borderRadius: 4
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: progress === 100 ? '#10B981' : '#3B82F6' }}>
                                        {progress}%
                                    </span>
                                </div>
                                <div style={{
                                    height: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 5,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        background: progress === 100
                                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                                            : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                                        transition: 'width 0.3s ease',
                                        borderRadius: 5
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assignees */}
                    <div className="form-group">
                        <label><FiUser style={{ marginRight: 8 }} /> Assignees</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            {selectedAssignees.map(member => (
                                <div
                                    key={member.uid}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3B82F6',
                                        padding: '6px 12px',
                                        borderRadius: 20,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3B82F6', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        {member.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    {member.displayName}
                                    {isEditing && (
                                        <FiX
                                            size={14}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => toggleAssignee(member)}
                                        />
                                    )}
                                </div>
                            ))}
                            {isEditing && workspaceMembers.length > selectedAssignees.length && (
                                <select
                                    className="glass-input"
                                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                        const member = workspaceMembers.find(m => m.uid === e.target.value);
                                        if (member) toggleAssignee(member);
                                        e.target.value = '';
                                    }}
                                    value=""
                                >
                                    <option value="">+ Add Member</option>
                                    {workspaceMembers
                                        .filter(m => !selectedAssignees.find(a => a.uid === m.uid))
                                        .map(member => (
                                            <option key={member.uid} value={member.uid}>
                                                {member.displayName || member.email}
                                            </option>
                                        ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="glass-btn" onClick={handleDelete} style={{ color: '#EF4444' }}>
                        <FiTrash2 style={{ marginRight: 8 }} /> Delete Task
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isEditing ? (
                            <>
                                <button className="glass-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button className="glass-btn primary" onClick={handleUpdate}>Save Changes</button>
                            </>
                        ) : (
                            <button className="glass-btn" onClick={onClose}>Close</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
