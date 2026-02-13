import React, { useState } from 'react';
import { FiEdit2, FiChevronUp, FiChevronDown, FiClock, FiUser, FiMessageSquare } from 'react-icons/fi';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ProjectTableView = ({ tasks, workspace, onTaskClick }) => {
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [editingCell, setEditingCell] = useState(null);

    // Column definitions
    const columns = [
        { id: 'title', label: 'Task', sortable: true, width: '25%' },
        { id: 'status', label: 'Status', sortable: true, width: '12%' },
        { id: 'priority', label: 'Priority', sortable: true, width: '10%' },
        { id: 'category', label: 'Category', sortable: true, width: '12%' },
        { id: 'progress', label: 'Progress', sortable: true, width: '15%' },
        { id: 'assignees', label: 'Assignees', sortable: false, width: '12%' },
        { id: 'start', label: 'Start', sortable: true, width: '10%' },
        { id: 'comments', label: 'Comments', sortable: false, width: '8%' }
    ];

    const statusOptions = ['todo', 'doing', 'review'];
    const priorityOptions = ['low', 'medium', 'high'];
    const categoryOptions = ['General', 'Design', 'Development', 'Research', 'Marketing'];

    const statusColors = {
        todo: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', label: 'TO DO' },
        doing: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', label: 'DOING' },
        review: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', label: 'IN REVIEW' }
    };

    const priorityColors = {
        low: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
        medium: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
        high: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle special cases
        if (sortField === 'progress') {
            aVal = a.progress || 0;
            bVal = b.progress || 0;
        }

        if (sortField === 'start' || sortField === 'createdAt') {
            aVal = new Date(aVal || 0);
            bVal = new Date(bVal || 0);
        }

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal?.toLowerCase() || '';
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const updateTaskField = async (task, field, value) => {
        try {
            await updateDoc(doc(db, task.path), { [field]: value });
            setEditingCell(null);
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const renderCell = (task, columnId) => {
        const isEditing = editingCell === `${task.id}-${columnId}`;

        switch (columnId) {
            case 'title':
                return (
                    <div
                        onClick={() => onTaskClick(task)}
                        style={{
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            hover: { textDecoration: 'underline' }
                        }}
                    >
                        {task.title}
                    </div>
                );

            case 'status':
                if (isEditing) {
                    return (
                        <select
                            autoFocus
                            value={task.status || 'todo'}
                            onChange={(e) => updateTaskField(task, 'status', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="glass-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>{statusColors[opt].label}</option>
                            ))}
                        </select>
                    );
                }
                const statusStyle = statusColors[task.status || 'todo'];
                return (
                    <span
                        onClick={() => setEditingCell(`${task.id}-${columnId}`)}
                        style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                        }}
                    >
                        {statusStyle.label}
                    </span>
                );

            case 'priority':
                if (isEditing) {
                    return (
                        <select
                            autoFocus
                            value={task.priority || 'medium'}
                            onChange={(e) => updateTaskField(task, 'priority', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="glass-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        >
                            {priorityOptions.map(opt => (
                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                            ))}
                        </select>
                    );
                }
                const priorityStyle = priorityColors[task.priority || 'medium'];
                return (
                    <span
                        onClick={() => setEditingCell(`${task.id}-${columnId}`)}
                        style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {(task.priority || 'medium').toUpperCase()}
                    </span>
                );

            case 'category':
                if (isEditing) {
                    return (
                        <select
                            autoFocus
                            value={task.category || 'General'}
                            onChange={(e) => updateTaskField(task, 'category', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="glass-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    );
                }
                return (
                    <span
                        onClick={() => setEditingCell(`${task.id}-${columnId}`)}
                        style={{
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#8B5CF6',
                            fontWeight: 500
                        }}
                    >
                        {task.category || 'General'}
                    </span>
                );

            case 'progress':
                const progress = task.progress || 0;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            flex: 1,
                            height: 6,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 3,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: progress === 100
                                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                                    : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            minWidth: 40,
                            color: progress === 100 ? '#10B981' : 'var(--text-secondary)'
                        }}>
                            {progress}%
                        </span>
                    </div>
                );

            case 'assignees':
                const assignees = task.assignees || [];
                return (
                    <div style={{ display: 'flex', marginLeft: 8 }}>
                        {assignees.slice(0, 3).map((uid, idx) => {
                            const member = workspace?.members?.find(m => m.uid === uid);
                            const initial = member?.displayName?.charAt(0).toUpperCase() || member?.email?.charAt(0).toUpperCase() || '?';
                            return (
                                <div
                                    key={uid}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: `hsl(${idx * 120}, 70%, 50%)`,
                                        border: '2px solid var(--bg-primary)',
                                        marginLeft: idx > 0 ? -8 : 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: 'white'
                                    }}
                                    title={member?.displayName || member?.email}
                                >
                                    {initial}
                                </div>
                            );
                        })}
                        {assignees.length > 3 && (
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'var(--glass-bg)',
                                border: '2px solid var(--bg-primary)',
                                marginLeft: -8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 600
                            }}>
                                +{assignees.length - 3}
                            </div>
                        )}
                    </div>
                );

            case 'start':
                return (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {task.start ? new Date(task.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                    </span>
                );

            case 'comments':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <FiMessageSquare size={14} />
                        {task.commentsCount || 0}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0
            }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                        {columns.map(col => (
                            <th
                                key={col.id}
                                onClick={() => col.sortable && handleSort(col.id)}
                                style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    cursor: col.sortable ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    width: col.width,
                                    position: 'sticky',
                                    top: 0,
                                    background: 'var(--bg-primary)',
                                    zIndex: 1
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {col.label}
                                    {col.sortable && sortField === col.id && (
                                        sortDirection === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((task, idx) => (
                        <tr
                            key={task.id}
                            style={{
                                borderBottom: '1px solid var(--glass-border)',
                                transition: 'background 0.2s ease',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                        >
                            {columns.map(col => (
                                <td
                                    key={col.id}
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {renderCell(task, col.id)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {tasks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: 60,
                    opacity: 0.5
                }}>
                    <FiClock size={40} style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: '1.2rem' }}>No tasks yet</h3>
                    <p style={{ fontSize: '0.9rem' }}>Create a task to get started</p>
                </div>
            )}
        </div>
    );
};

export default ProjectTableView;
