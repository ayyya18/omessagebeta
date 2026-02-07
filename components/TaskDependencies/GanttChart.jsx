import React, { useState, useEffect } from 'react';
import { useTaskDependencies } from '../../context/TaskDependenciesContext';

const GanttChart = ({ workspaceId, projectId, tasks }) => {
    const { getTaskDependencies } = useTaskDependencies();
    const [dependencies, setDependencies] = useState([]);
    const [viewMode, setViewMode] = useState('month'); // day, week, month

    useEffect(() => {
        loadDependencies();
    }, [workspaceId, projectId]);

    const loadDependencies = async () => {
        const allDeps = [];
        for (const task of tasks) {
            const deps = await getTaskDependencies(workspaceId, projectId, task.id);
            allDeps.push(...deps);
        }
        setDependencies(allDeps);
    };

    // Calculate date range
    const getDateRange = () => {
        if (tasks.length === 0) return { start: new Date(), end: new Date() };

        const dates = tasks
            .filter(t => t.start && t.end)
            .flatMap(t => [new Date(t.start), new Date(t.end)]);

        if (dates.length === 0) return { start: new Date(), end: new Date() };

        return {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    };

    const dateRange = getDateRange();
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) || 30;

    // Calculate task bar position and width
    const getTaskBar = (task) => {
        if (!task.start || !task.end) return null;

        const taskStart = new Date(task.start);
        const taskEnd = new Date(task.end);

        const startOffset = Math.max(0, (taskStart - dateRange.start) / (1000 * 60 * 60 * 24));
        const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);

        return {
            left: `${(startOffset / totalDays) * 100}%`,
            width: `${Math.max(1, (duration / totalDays) * 100)}%`
        };
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'in-progress': return '#3B82F6';
            case 'todo': return '#6B7280';
            default: return '#6B7280';
        }
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Gantt Chart</h3>

                <div style={{ display: 'flex', gap: 8 }}>
                    {['day', 'week', 'month'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            style={{
                                padding: '6px 12px',
                                background: viewMode === mode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 6,
                                color: viewMode === mode ? '#3B82F6' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gantt Chart */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                overflow: 'hidden',
                minWidth: 800
            }}>
                {/* Timeline Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    <div style={{ padding: 12, fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        Task
                    </div>
                    <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{dateRange.start.toLocaleDateString()}</span>
                        <span>{dateRange.end.toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Task Rows */}
                {tasks.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                        No tasks with dates to display
                    </div>
                ) : (
                    tasks.map(task => {
                        const bar = getTaskBar(task);

                        return (
                            <div
                                key={task.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '200px 1fr',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    minHeight: 50
                                }}
                            >
                                {/* Task Name */}
                                <div style={{
                                    padding: 12,
                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    {task.title}
                                </div>

                                {/* Timeline Bar */}
                                <div style={{
                                    padding: '8px 0',
                                    position: 'relative',
                                    background: 'rgba(255,255,255,0.01)'
                                }}>
                                    {bar && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: bar.left,
                                                width: bar.width,
                                                height: 30,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: getStatusColor(task.status),
                                                borderRadius: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                padding: '0 8px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                            }}
                                            title={`${task.title} (${new Date(task.start).toLocaleDateString()} - ${new Date(task.end).toLocaleDateString()})`}
                                        >
                                            {task.progress > 0 && `${task.progress}%`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div style={{
                marginTop: 20,
                display: 'flex',
                gap: 16,
                fontSize: '0.85rem',
                opacity: 0.7
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, background: '#6B7280', borderRadius: 4 }} />
                    <span>To Do</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, background: '#3B82F6', borderRadius: 4 }} />
                    <span>In Progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, background: '#10B981', borderRadius: 4 }} />
                    <span>Completed</span>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
