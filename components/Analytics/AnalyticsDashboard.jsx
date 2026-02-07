import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { useAnalytics } from '../../context/AnalyticsContext';

const AnalyticsDashboard = ({ workspaceId, projectId }) => {
    const { getProjectAnalytics, getWorkspaceAnalytics } = useAnalytics();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [workspaceId, projectId]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = projectId
                ? await getProjectAnalytics(workspaceId, projectId)
                : await getWorkspaceAnalytics(workspaceId);
            setAnalytics(data);
        } catch (err) {
            console.error('Error loading analytics:', err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}>Loading analytics...</div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                No analytics data available
            </div>
        );
    }

    const StatCard = ({ icon, label, value, color, subtitle }) => (
        <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                    padding: 12,
                    background: `${color}20`,
                    borderRadius: 12,
                    color: color
                }}>
                    {icon}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</div>
                </div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 4 }}>{label}</div>
            {subtitle && <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{subtitle}</div>}
        </div>
    );

    return (
        <div>
            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
                📊 Analytics Dashboard
            </h2>

            {/* Key Metrics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 20,
                marginBottom: 32
            }}>
                <StatCard
                    icon={<FiCheckCircle size={24} />}
                    label="Completion Rate"
                    value={`${analytics.completionRate}%`}
                    color="#10B981"
                    subtitle={`${analytics.completedTasks} of ${analytics.totalTasks} tasks`}
                />

                <StatCard
                    icon={<FiTrendingUp size={24} />}
                    label="In Progress"
                    value={analytics.inProgressTasks || 0}
                    color="#3B82F6"
                    subtitle="Currently active"
                />

                <StatCard
                    icon={<FiClock size={24} />}
                    label="To Do"
                    value={analytics.todoTasks || 0}
                    color="#F59E0B"
                    subtitle="Pending tasks"
                />

                {analytics.overdueTasks !== undefined && (
                    <StatCard
                        icon={<FiAlertCircle size={24} />}
                        label="Overdue"
                        value={analytics.overdueTasks}
                        color="#EF4444"
                        subtitle="Needs attention"
                    />
                )}
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20
            }}>
                {/* Status Distribution */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>
                        Task Status Distribution
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span>Completed</span>
                                <span>{analytics.completedTasks}</span>
                            </div>
                            <div style={{
                                height: 8,
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#10B981',
                                    borderRadius: 4
                                }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span>In Progress</span>
                                <span>{analytics.inProgressTasks || 0}</span>
                            </div>
                            <div style={{
                                height: 8,
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${analytics.totalTasks > 0 ? ((analytics.inProgressTasks || 0) / analytics.totalTasks) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#3B82F6',
                                    borderRadius: 4
                                }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span>To Do</span>
                                <span>{analytics.todoTasks || 0}</span>
                            </div>
                            <div style={{
                                height: 8,
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${analytics.totalTasks > 0 ? ((analytics.todoTasks || 0) / analytics.totalTasks) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#F59E0B',
                                    borderRadius: 4
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Priority Distribution */}
                {analytics.highPriority !== undefined && (
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>
                            Priority Distribution
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span>High Priority</span>
                                    <span>{analytics.highPriority}</span>
                                </div>
                                <div style={{
                                    height: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${analytics.totalTasks > 0 ? (analytics.highPriority / analytics.totalTasks) * 100 : 0}%`,
                                        height: '100%',
                                        background: '#EF4444',
                                        borderRadius: 4
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span>Medium Priority</span>
                                    <span>{analytics.mediumPriority}</span>
                                </div>
                                <div style={{
                                    height: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${analytics.totalTasks > 0 ? (analytics.mediumPriority / analytics.totalTasks) * 100 : 0}%`,
                                        height: '100%',
                                        background: '#F59E0B',
                                        borderRadius: 4
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span>Low Priority</span>
                                    <span>{analytics.lowPriority}</span>
                                </div>
                                <div style={{
                                    height: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${analytics.totalTasks > 0 ? (analytics.lowPriority / analytics.totalTasks) * 100 : 0}%`,
                                        height: '100%',
                                        background: '#10B981',
                                        borderRadius: 4
                                    }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Insights */}
            {analytics.avgCompletionTime !== undefined && analytics.avgCompletionTime > 0 && (
                <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 600 }}>
                        Performance Insights
                    </h3>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 4 }}>
                                Avg. Completion Time
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>
                                {analytics.avgCompletionTime} days
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
