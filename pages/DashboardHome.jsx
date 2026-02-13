import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FiClock, FiCheckCircle, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import './DashboardHome.css';

// Reuse CalendarSidebar for now, or make a simpler one? 
// User asked for "Sidebar for each feature... is not hidden". 
// But what is the sidebar for the "Dashboard"? 
// We can make a simple "Quick Stats" sidebar or just generic nav.
// Let's create a dedicated "DashboardSidebar" showing user summary.

const DashboardSidebar = () => {
    const { currentUser } = useAuth();
    return (
        <div className="chat-sidebar-column dashboard-sidebar">
            <div className="sidebar-header">
                <h3>Dashboard</h3>
            </div>
            <div className="dash-sidebar-content">
                <div className="user-welcome-card glass-card">
                    <p>Welcome back,</p>
                    <h2>{currentUser?.displayName || 'User'}</h2>
                    <p className="subtitle">Let's be productive today.</p>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task, projectsMap = {} }) => {
    const { updateTask } = useTasks();
    const [isUpdating, setIsUpdating] = useState(false);
    const project = task.projectId && projectsMap[task.projectId];

    const handleMarkComplete = async (e) => {
        e.stopPropagation();
        setIsUpdating(true);
        try {
            await updateTask(task.id, { progress: 100, status: 'done' });
        } catch (err) {
            console.error('Error updating task:', err);
        }
        setIsUpdating(false);
    };

    const handleStatusChange = async (e, newStatus) => {
        e.stopPropagation();
        setIsUpdating(true);
        try {
            await updateTask(task.id, { status: newStatus });
        } catch (err) {
            console.error('Error updating task:', err);
        }
        setIsUpdating(false);
    };

    return (
        <div className="task-card glass-card" style={{ borderLeft: `4px solid ${task.color}` }}>
            <div className="task-header">
                <h4>{task.title}</h4>
                <span className="task-time">{new Date(task.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {task.description && <p className="task-desc">{task.description}</p>}
            <div className="task-footer">
                <span className="badge" style={{ background: `${task.color}20`, color: task.color }}>{task.category}</span>
                {task.isWorkspaceTask && project && (
                    <span className="badge" style={{
                        background: `${project.color}20`,
                        color: project.color,
                        marginLeft: 8,
                        fontWeight: 600
                    }}>
                        {project.emoji} {project.name}
                    </span>
                )}
                {task.isWorkspaceTask && !project && (
                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', marginLeft: 8 }}>
                        📋 Workspace
                    </span>
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {task.progress < 100 && (
                    <button
                        onClick={handleMarkComplete}
                        disabled={isUpdating}
                        style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 8,
                            color: '#10B981',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            opacity: isUpdating ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => !isUpdating && (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
                    >
                        ✓ Complete
                    </button>
                )}

                <select
                    value={task.status || 'todo'}
                    onChange={(e) => handleStatusChange(e, e.target.value)}
                    disabled={isUpdating}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.5 : 1
                    }}
                >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </div>
    );
};

const DashboardHome = () => {
    const { getTodayTasks, getUpcomingTasks, projectsMap, updateTask } = useTasks();
    const todayTasks = getTodayTasks();
    const upcomingTasks = getUpcomingTasks();

    return (
        <DashboardLayout
            sidebar={<DashboardSidebar />}
            content={
                <div className="dashboard-main-area">
                    <header className="dash-header">
                        <h1>Dashboard</h1>
                        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </header>

                    <div className="dash-section">
                        <div className="section-header">
                            <h2><FiCheckCircle className="icon-mr" /> Today's Focus</h2>
                        </div>
                        <div className="task-grid">
                            {todayTasks.length > 0 ? (
                                todayTasks.map(task => <TaskCard key={task.id} task={task} projectsMap={projectsMap} />)
                            ) : (
                                <div className="empty-state">
                                    <FiCheckCircle size={40} />
                                    <p>No tasks for today. Enjoy your day!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="dash-section">
                        <div className="section-header">
                            <h2><FiCalendar className="icon-mr" /> Upcoming</h2>
                            <NavLink to="/calendar" className="see-all">See Calendar <FiArrowRight /></NavLink>
                        </div>
                        <div className="task-list-vertical">
                            {upcomingTasks.map(task => (
                                <div key={task.id} className="task-row glass-card">
                                    <div className="task-date-box">
                                        <span className="day">{new Date(task.start).getDate()}</span>
                                        <span className="month">{new Date(task.start).toLocaleDateString([], { month: 'short' })}</span>
                                    </div>
                                    <div className="task-info">
                                        <h4>{task.title}</h4>
                                        <p>{new Date(task.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {task.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default DashboardHome;
