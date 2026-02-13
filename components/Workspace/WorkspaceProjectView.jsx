import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiStar, FiShare2, FiUserPlus, FiPlus, FiMoreHorizontal, FiClock, FiMessageSquare, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import ProjectTableView from './ProjectTableView';
import TaskFilterBar from './TaskFilterBar';
import InviteWorkspaceMemberModal from './InviteWorkspaceMemberModal';

const WorkspaceProjectView = ({ project, workspace, onBack }) => {
    const { currentUser } = useAuth();
    const [view, setView] = useState('overview'); // overview, board, timeline, table
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        statuses: [],
        priorities: [],
        categories: [],
        assignees: []
    });
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [draggedTask, setDraggedTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Listen for tasks specific to this project
    useEffect(() => {
        if (!project) return;

        // Use 'project_tasks' for consistency with TaskContext
        const q = query(collection(db, 'workspaces', workspace.id, 'projects', project.id, 'project_tasks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path })));
        });

        return () => unsubscribe();
    }, [project, workspace]);

    // Filter tasks based on active filters
    useEffect(() => {
        let filtered = [...tasks];

        // Search filter
        if (filters.search.trim()) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.statuses.length > 0) {
            filtered = filtered.filter(task => filters.statuses.includes(task.status));
        }

        // Priority filter
        if (filters.priorities.length > 0) {
            filtered = filtered.filter(task => filters.priorities.includes(task.priority || 'medium'));
        }

        // Category filter
        if (filters.categories.length > 0) {
            filtered = filtered.filter(task => filters.categories.includes(task.category || 'General'));
        }

        // Assignees filter
        if (filters.assignees.length > 0) {
            filtered = filtered.filter(task =>
                task.assignees?.some(assignee => filters.assignees.includes(assignee))
            );
        }

        setFilteredTasks(filtered);
    }, [tasks, filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleAddTask = async (taskDetails) => {
        try {
            await addDoc(collection(db, 'workspaces', workspace.id, 'projects', project.id, 'project_tasks'), {
                ...taskDetails,
                assignees: taskDetails.assignees.length > 0 ? taskDetails.assignees : [currentUser.uid],
                createdAt: new Date().toISOString(),
                commentsCount: 0
            });
        } catch (err) { console.error(err); }
    };

    const moveTask = async (task, newStatus) => {
        try {
            await updateDoc(doc(db, task.path), { status: newStatus });
        } catch (err) { console.error(err); }
    };

    const handleDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== newStatus) {
            await moveTask(draggedTask, newStatus);
        }
        setDraggedTask(null);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
    };

    // Handle view change with animation
    const handleViewChange = (newView) => {
        if (newView === view) return;
        setIsAnimating(true);
        setTimeout(() => {
            setView(newView);
            setIsAnimating(false);
        }, 150);
    };

    // Priority and Category Styling
    const priorityStyles = {
        high: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', label: 'High' },
        medium: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', label: 'Medium' },
        low: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', label: 'Low' }
    };

    const categoryStyles = {
        Design: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
        Development: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
        Research: { bg: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' },
        Marketing: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
        General: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' }
    };

    const Columns = {
        todo: { label: 'TO DO', color: '#3B82F6' },
        doing: { label: 'DOING', color: '#F59E0B' },
        review: { label: 'IN REVIEW', color: '#EF4444' },
    };

    return (
        <div className="project-view-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="project-header" style={{ paddingBottom: 20, borderBottom: '1px solid var(--glass-border)' }}>
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', opacity: 0.6, marginBottom: 12 }}>
                    <span onClick={onBack} style={{ cursor: 'pointer', hover: { textDecoration: 'underline' } }}>Project</span>
                    <FiChevronRight style={{ margin: '0 8px' }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '1rem' }}>🚀</span> {project.name}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{project.name}</h1>
                        <button className="glass-btn icon-only small"><FiStar /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="glass-btn icon-only"><FiShare2 /></button>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 20 }}>
                            {/* Avatars */}
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ddd', marginRight: -8, border: '2px solid var(--bg-primary)' }}></div>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#aaa', marginRight: 8, border: '2px solid var(--bg-primary)' }}></div>
                            <button className="glass-btn small" onClick={() => setShowInviteModal(true)} style={{ border: 'none', padding: '4px 8px', height: 'auto', fontSize: '0.8rem' }}><FiUserPlus style={{ marginRight: 4 }} /> Invite</button>
                        </div>
                        <button className="glass-btn primary" onClick={() => setShowTaskModal(true)}><FiPlus style={{ marginRight: 6 }} /> Add New Task</button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 24, background: 'var(--glass-bg)', width: 'fit-content', padding: 4, borderRadius: 8 }}>
                    {['Overview', 'Board View', 'Timeline', 'Table'].map(t => {
                        const key = t.toLowerCase().split(' ')[0];
                        const isActive = view === key || (t === 'Board View' && view === 'board');
                        return (
                            <button
                                key={t}
                                onClick={() => handleViewChange(key === 'board view' ? 'board' : key)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: isActive ? 'var(--bg-primary)' : 'transparent',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 500,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {t}
                            </button>
                        )
                    })}
                </div>

                {/* Filter Bar */}
                <TaskFilterBar onFilterChange={handleFilterChange} workspace={workspace} />
            </div>

            {/* Board Content */}
            {view === 'board' && (
                <div
                    className="kanban-board"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 24,
                        padding: '24px 0',
                        flex: 1,
                        overflowX: 'auto',
                        opacity: isAnimating ? 0 : 1,
                        transition: 'opacity 0.15s ease'
                    }}
                >
                    {Object.entries(Columns).map(([status, meta]) => {
                        const columnTasks = filteredTasks.filter(t => t.status === status);
                        return (
                            <div
                                key={status}
                                className="kanban-column"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{meta.label}</span>
                                        <span style={{ background: 'var(--glass-border)', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>{columnTasks.length}</span>
                                    </div>
                                    <FiMoreHorizontal style={{ opacity: 0.5, cursor: 'pointer' }} />
                                </div>

                                <button
                                    className="add-task-ghost"
                                    onClick={() => setShowTaskModal(true)}
                                    style={{
                                        width: '100%',
                                        padding: 12,
                                        border: '1px dashed var(--glass-border)',
                                        borderRadius: 12,
                                        background: 'transparent',
                                        color: '#3B82F6',
                                        cursor: 'pointer',
                                        marginBottom: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 500
                                    }}>
                                    <FiPlus /> Add New
                                </button>

                                <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 100 }}>
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="task-card glass-card hover-lift"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onDragEnd={handleDragEnd}
                                            style={{
                                                padding: 16,
                                                borderRadius: 16,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'grab',
                                                opacity: draggedTask?.id === task.id ? 0.5 : 1,
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                            onMouseEnter={(e) => {
                                                if (draggedTask?.id !== task.id) {
                                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (draggedTask?.id !== task.id) {
                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        background: priorityStyles[task.priority || 'medium'].bg,
                                                        color: priorityStyles[task.priority || 'medium'].color,
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        • {priorityStyles[task.priority || 'medium'].label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '4px 10px',
                                                        borderRadius: 6,
                                                        background: categoryStyles[task.category || 'General'].bg,
                                                        color: categoryStyles[task.category || 'General'].color,
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {task.category || 'General'}
                                                    </span>
                                                </div>
                                                <FiMoreHorizontal style={{ opacity: 0.5 }} />
                                            </div>

                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</h4>
                                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                                {task.description || 'No description provided for this task.'}
                                            </p>

                                            {/* Progress Bar */}
                                            {typeof task.progress === 'number' && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Progress</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: task.progress === 100 ? '#10B981' : '#3B82F6' }}>
                                                            {task.progress}%
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        height: 6,
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: 3,
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${task.progress}%`,
                                                            height: '100%',
                                                            background: task.progress === 100
                                                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                                : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                                                            transition: 'width 0.3s ease',
                                                            borderRadius: 3
                                                        }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', opacity: 0.6 }}>
                                                    <FiClock /> {task.start ? new Date(task.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date')}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {/* Assignee Avatars */}
                                                    <div style={{ display: 'flex', marginLeft: 8 }}>
                                                        {task.assignees && task.assignees.length > 0 ? (
                                                            task.assignees.slice(0, 3).map((assigneeId, idx) => {
                                                                const member = workspace?.members?.find(m => m.uid === assigneeId);
                                                                const initial = member?.displayName?.charAt(0).toUpperCase() || member?.email?.charAt(0).toUpperCase() || '?';
                                                                return (
                                                                    <div
                                                                        key={assigneeId}
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
                                                            })
                                                        ) : (
                                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6B7280', border: '2px solid var(--bg-primary)' }} />
                                                        )}
                                                        {task.assignees && task.assignees.length > 3 && (
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
                                                                +{task.assignees.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', opacity: 0.6 }}>
                                                        <FiMessageSquare /> {task.commentsCount || 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Removed Quick Move Buttons - now using drag-and-drop */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table View */}
            {view === 'table' && (
                <div style={{
                    flex: 1,
                    paddingTop: 24,
                    opacity: isAnimating ? 0 : 1,
                    transition: 'opacity 0.15s ease'
                }}>
                    <ProjectTableView
                        tasks={filteredTasks}
                        workspace={workspace}
                        onTaskClick={(task) => setSelectedTask(task)}
                    />
                </div>
            )}

            {/* Overview */}
            {view === 'overview' && (
                <div style={{
                    flex: 1,
                    paddingTop: 24,
                    opacity: isAnimating ? 0 : 1,
                    transition: 'opacity 0.15s ease'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {/* Total Tasks */}
                        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Total Tasks</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{filteredTasks.length}</div>
                        </div>

                        {/* Completed */}
                        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Completed</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10B981' }}>
                                {filteredTasks.filter(t => t.progress === 100).length}
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>In Progress</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#F59E0B' }}>
                                {filteredTasks.filter(t => t.status === 'doing').length}
                            </div>
                        </div>

                        {/* Average Progress */}
                        <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Avg Progress</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3B82F6' }}>
                                {filteredTasks.length > 0 ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / filteredTasks.length) : 0}%
                            </div>
                        </div>
                    </div>

                    {/* Recent Tasks */}
                    <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
                        <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Recent Tasks</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredTasks.slice(0, 5).map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    style={{
                                        padding: 16,
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 12,
                                        border: '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{task.title}</h4>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: task.progress === 100 ? '#10B981' : '#3B82F6'
                                        }}>
                                            {task.progress || 0}%
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: task.status === 'todo' ? 'rgba(59,130,246,0.1)' : task.status === 'doing' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: task.status === 'todo' ? '#3B82F6' : task.status === 'doing' ? '#F59E0B' : '#EF4444',
                                            fontWeight: 600
                                        }}>
                                            {task.status?.toUpperCase()}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: task.priority === 'high' ? 'rgba(239,68,68,0.1)' : task.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#10B981',
                                            fontWeight: 600
                                        }}>
                                            {task.priority?.toUpperCase() || 'MEDIUM'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {filteredTasks.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                                    <p>No tasks yet. Create one to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline - Coming Soon */}
            {view === 'timeline' && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isAnimating ? 0 : 0.5,
                    flexDirection: 'column',
                    transition: 'opacity 0.15s ease'
                }}>
                    <FiInfo size={32} style={{ marginBottom: 16 }} />
                    <h3>Timeline View</h3>
                    <p>Coming soon...</p>
                </div>
            )}

            {/* Modals */}
            <CreateTaskModal
                show={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onCreate={handleAddTask}
                workspaceMembers={workspace?.members || []}
            />
            <TaskDetailModal
                show={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
                workspaceMembers={workspace?.members || []}
                workspace={workspace}
                project={project}
            />
            <InviteWorkspaceMemberModal
                show={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
        </div>
    );
};

export default WorkspaceProjectView;
