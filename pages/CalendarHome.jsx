import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useTasks } from '../context/TaskContext';
import { FiCalendar, FiBarChart2, FiClock, FiPlus, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import './Calendar.css';
import AddEventModal from '../components/Calendar/AddEventModal';
import MonthView from '../components/Calendar/MonthView';
import EventDetailModal from '../components/Calendar/EventDetailModal';

// Simple Month Calendar Component for Sidebar


const CalendarSidebar = ({ filters, toggleFilter }) => {
    const categories = [
        { id: 'work', label: 'Work', color: '#3B82F6' },
        { id: 'meeting', label: 'Meeting', color: '#10B981' },
        { id: 'deadline', label: 'Deadline', color: '#EF4444' },
        { id: 'personal', label: 'Personal', color: '#8B5CF6' },
        { id: 'project', label: 'Workspace Tasks', color: '#F59E0B' }
    ];

    return (
        <div className="chat-sidebar-column dashboard-sidebar">
            <div className="sidebar-header">
                <h3>Calendar</h3>
            </div>



            <div className="cal-filters">
                <h4>My Calendars</h4>
                <div className="filter-list">
                    {categories.map(cat => (
                        <div key={cat.id} className="filter-item" onClick={() => toggleFilter(cat.id)}>
                            <div className={`checkbox ${filters[cat.id] ? 'checked' : ''}`} style={{ borderColor: cat.color, background: filters[cat.id] ? cat.color : 'transparent' }}>
                                {filters[cat.id] && <FiCheck size={10} color="white" />}
                            </div>
                            <span>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

import { FiEdit2 } from 'react-icons/fi';

const TimelineView = ({ tasks, onAddClick, onEdit, projectsMap = {} }) => (
    <div className="cal-view timeline-view">
        <div className="timeline-container">
            {tasks.map(task => {
                const startDate = new Date(task.start);
                const endDate = new Date(task.end);
                const dateOptions = { weekday: 'long', day: 'numeric', month: 'short' };
                const project = task.projectId && projectsMap[task.projectId];

                return (
                    <div key={task.id} className="timeline-item" style={{ borderLeftColor: task.color }}>
                        <div className="time-col">
                            <span className="date-display">{startDate.toLocaleDateString('en-US', dateOptions)}</span>
                            <div className="time-range">
                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <br />
                                <small style={{ opacity: 0.6 }}>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                        </div>
                        <div className="content" style={{ background: `${task.color}20` }}>
                            <div className="content-main">
                                <h4>{task.title}</h4>
                                {task.description && <p className="event-desc">{task.description}</p>}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className="category-tag" style={{ background: task.color }}>{task.category}</span>
                                    {task.isWorkspaceTask && project && (
                                        <span className="category-tag" style={{ background: project.color }}>
                                            {project.emoji} {project.name}
                                        </span>
                                    )}
                                    {task.isWorkspaceTask && !project && (
                                        <span className="category-tag" style={{ background: '#F59E0B' }}>📋 Workspace</span>
                                    )}
                                </div>
                            </div>
                            <button className="icon-btn edit-task-btn" onClick={() => onEdit(task)} title="Edit Task">
                                <FiEdit2 />
                            </button>
                        </div>
                    </div>
                );
            })}
            {tasks.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No events scheduled.</p>}
        </div>
    </div>
);

const GanttView = ({ tasks }) => (
    <div className="cal-view gantt-view">
        <div className="gantt-chart">
            {tasks.map((task, index) => (
                <div key={task.id} className="gantt-row">
                    <div className="gantt-label">{task.title}</div>
                    <div className="gantt-bar-container">
                        <div
                            className="gantt-bar"
                            style={{
                                background: task.color,
                                width: `${Math.random() * 50 + 20}%`,
                                marginLeft: `${index * 5}%`
                            }}
                            title={`${task.start} - ${task.end}`}
                        ></div>
                    </div>
                </div>
            ))}
            {tasks.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No projects to track.</p>}
        </div>
    </div>
);

const AnalyticsView = () => (
    <div className="cal-view analytics-view">
        <div className="analytics-grid">
            <div className="analytics-card">
                <h3>Total Focus Time</h3>
                <div className="big-number">42h</div>
                <p>Top 5% this week!</p>
            </div>
            <div className="analytics-card">
                <h3>Meeting Load</h3>
                <div className="big-number text-danger">12h</div>
                <p>High load warning</p>
            </div>
            <div className="analytics-card">
                <h3>Tasks Completed</h3>
                <div className="big-number" style={{ color: 'var(--primary-color)' }}>18</div>
                <p>On track</p>
            </div>
        </div>
    </div>
);

const CalendarHome = () => {
    const [currentView, setCurrentView] = useState('month');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { getFilteredTasks, addTask, updateTask, deleteTask, filters, toggleFilter, projectsMap } = useTasks();
    const tasks = getFilteredTasks();

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const handleEditClick = (task) => {
        setSelectedTask(task);
        setIsEditMode(true);
        setShowDetailModal(false);
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setIsEditMode(false);
        setSelectedTask(null);
    };

    const changeTime = (offset) => {
        const newDate = new Date(currentDate);
        if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() + offset);
        } else {
            newDate.setDate(newDate.getDate() + offset);
        }
        setCurrentDate(newDate);
    };

    const renderView = () => {
        switch (currentView) {
            case 'month': return <MonthView tasks={tasks} currentDate={currentDate} onDateClick={() => { }} onTaskClick={handleTaskClick} />;
            case 'timeline': return <TimelineView tasks={tasks} onAddClick={() => setShowAddModal(true)} onEdit={handleEditClick} projectsMap={projectsMap} />;
            case 'gantt': return <GanttView tasks={tasks} />;
            case 'analytics': return <AnalyticsView />;
            default: return <MonthView tasks={tasks} currentDate={currentDate} onDateClick={() => { }} />;
        }
    };

    const monthYearTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <DashboardLayout
            sidebar={<CalendarSidebar filters={filters} toggleFilter={toggleFilter} />}
            content={
                <div className="calendar-main-area">
                    <div className="cal-top-bar">
                        <div className="cal-date-nav">
                            <h2>{monthYearTitle}</h2>
                            <div className="nav-actions">
                                <button className="glass-btn icon-only" onClick={() => changeTime(-1)}><FiChevronLeft /></button>
                                <button className="glass-btn icon-only" onClick={() => changeTime(1)}><FiChevronRight /></button>
                                <button className="glass-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
                            </div>
                        </div>

                        <div className="view-switcher">
                            <button className={currentView === 'timeline' ? 'active' : ''} onClick={() => setCurrentView('timeline')}>Task</button>
                            <button className={currentView === 'month' ? 'active' : ''} onClick={() => setCurrentView('month')}>View Calendar</button>
                            <button className={currentView === 'gantt' ? 'active' : ''} onClick={() => setCurrentView('gantt')}>Gantt</button>
                            <button className={currentView === 'analytics' ? 'active' : ''} onClick={() => setCurrentView('analytics')}>Analytics</button>
                        </div>

                        <button className="primary" onClick={() => setShowAddModal(true)}><FiPlus /> Add Event</button>
                    </div>

                    <div className="cal-content-wrapper">
                        {renderView()}
                    </div>

                    <AddEventModal
                        show={showAddModal}
                        onClose={handleCloseAddModal}
                        onAdd={addTask}
                        onUpdate={updateTask}
                        initialData={selectedTask}
                        isEditMode={isEditMode}
                    />

                    <EventDetailModal
                        show={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        task={selectedTask}
                        onEdit={handleEditClick}
                        onDelete={deleteTask}
                    />
                </div>
            }
        />
    );
};

export default CalendarHome;
