import React, { useState } from 'react';
import { FiX, FiCheck, FiCalendar, FiUser, FiTag, FiUserPlus } from 'react-icons/fi';
import '../Calendar/AddEventModal.css';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const CreateTaskModal = ({ show, onClose, onCreate, workspaceMembers = [], workspace = null, project = null }) => {
    const { createNotification } = useNotification();
    const { currentUser } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('General');
    const [progress, setProgress] = useState(0);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        await onCreate({
            title,
            description,
            start: startDate ? `${startDate}T09:00:00` : (dueDate ? `${dueDate}T09:00:00` : ''),
            end: dueDate ? `${dueDate}T17:00:00` : (startDate ? `${startDate}T17:00:00` : ''),
            priority,
            category,
            progress,
            assignees: selectedAssignees.map(a => a.uid),
            status: 'todo'
        });

        // Send notifications to assignees
        if (currentUser && selectedAssignees.length > 0) {
            for (const assignee of selectedAssignees) {
                if (assignee.uid !== currentUser.uid) {
                    try {
                        await createNotification(assignee.uid, {
                            type: 'task_assigned',
                            message: `You were assigned to: ${title}`,
                            taskTitle: title,
                            projectName: project?.name || 'Workspace',
                            actionUrl: workspace && project ? `/workspace` : '/',
                            createdAt: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error('Error sending notification:', err);
                    }
                }
            }
        }

        // Reset
        setTitle('');
        setDescription('');
        setDueDate('');
        setStartDate('');
        setPriority('medium');
        setCategory('General');
        setProgress(0);
        setSelectedAssignees([]);
        onClose();
    };

    const toggleAssignee = (member) => {
        if (selectedAssignees.find(a => a.uid === member.uid)) {
            setSelectedAssignees(prev => prev.filter(a => a.uid !== member.uid));
        } else {
            setSelectedAssignees(prev => [...prev, member]);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>Create New Task</h3>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Task Title</label>
                        <input
                            type="text"
                            className="glass-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Design Homepage"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="glass-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe the task..."
                        />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label><FiCalendar style={{ marginRight: 8 }} /> Start Date</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label><FiCalendar style={{ marginRight: 8 }} /> Due Date</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label><FiTag style={{ marginRight: 8 }} /> Priority</label>
                            <select className="glass-input" value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label><FiTag style={{ marginRight: 8 }} /> Category</label>
                            <select className="glass-input" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="General">General</option>
                                <option value="Design">Design</option>
                                <option value="Development">Development</option>
                                <option value="Research">Research</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress Field */}
                    <div className="form-group">
                        <label>Progress</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        {/* Visual Progress Bar */}
                        <div style={{
                            marginTop: 8,
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

                    <div className="form-group">
                        <label><FiUser style={{ marginRight: 8 }} /> Assignees</label>

                        {/* Selected Assignees */}
                        {selectedAssignees.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
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
                                            gap: 6
                                        }}
                                    >
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3B82F6', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            {member.displayName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        {member.displayName}
                                        <FiX
                                            size={14}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => toggleAssignee(member)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Assignee Button */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="glass-btn small"
                                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <FiUserPlus style={{ marginRight: 8 }} />
                                {selectedAssignees.length === 0 ? 'Add Assignees' : 'Add More'}
                            </button>

                            {/* Assignee Dropdown */}
                            {showAssigneeDropdown && workspaceMembers.length > 0 && (
                                <div
                                    className="glass-card"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: 8,
                                        padding: 8,
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {workspaceMembers.map(member => {
                                        const isSelected = selectedAssignees.find(a => a.uid === member.uid);
                                        return (
                                            <div
                                                key={member.uid}
                                                onClick={() => toggleAssignee(member)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    marginBottom: 4
                                                }}
                                            >
                                                <div style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: isSelected ? '#3B82F6' : '#6B7280',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.9rem',
                                                    flexShrink: 0
                                                }}>
                                                    {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                        {member.displayName || member.email}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                        {member.role || 'Member'}
                                                    </div>
                                                </div>
                                                {isSelected && <FiCheck style={{ color: '#3B82F6' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="glass-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="glass-btn primary">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
