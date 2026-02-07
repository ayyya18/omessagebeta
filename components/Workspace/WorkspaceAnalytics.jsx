import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FiTrendingUp, FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';

const WorkspaceAnalytics = ({ workspace }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const projectsSnap = await getDocs(
                    collection(db, 'workspaces', workspace.id, 'projects')
                );

                let totalTasks = 0;
                let completedTasks = 0;
                let inProgressTasks = 0;
                const projectBreakdown = {};

                for (const projectDoc of projectsSnap.docs) {
                    const tasksSnap = await getDocs(
                        collection(db, 'workspaces', workspace.id, 'projects', projectDoc.id, 'project_tasks')
                    );

                    const tasks = tasksSnap.docs.map(d => d.data());
                    const completed = tasks.filter(t => t.progress === 100 || t.status === 'done').length;
                    const inProgress = tasks.filter(t => t.status === 'doing').length;

                    totalTasks += tasks.length;
                    completedTasks += completed;
                    inProgressTasks += inProgress;

                    projectBreakdown[projectDoc.id] = {
                        name: projectDoc.data().name,
                        total: tasks.length,
                        completed,
                        inProgress,
                        color: projectDoc.data().color || '#3B82F6',
                        emoji: projectDoc.data().emoji || '🚀'
                    };
                }

                setStats({ totalTasks, completedTasks, inProgressTasks, projectBreakdown });
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        if (workspace) {
            fetchStats();
        }
    }, [workspace]);

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}>Loading analytics...</div>
            </div>
        );
    }

    if (!stats) return null;

    const completionRate = stats.totalTasks > 0
        ? (stats.completedTasks / stats.totalTasks * 100).toFixed(1)
        : 0;

    return (
        <div className="workspace-analytics" style={{ padding: 24 }}>
            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
                <FiTrendingUp style={{ marginRight: 12, verticalAlign: 'middle' }} />
                Workspace Analytics
            </h2>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
                marginBottom: 32
            }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <FiCheckCircle size={24} style={{ color: '#3B82F6' }} />
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Total Tasks</h3>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalTasks}</div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <FiCheckCircle size={24} style={{ color: '#10B981' }} />
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Completed</h3>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10B981' }}>
                        {stats.completedTasks}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <FiClock size={24} style={{ color: '#F59E0B' }} />
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>In Progress</h3>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#F59E0B' }}>
                        {stats.inProgressTasks}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <FiTrendingUp size={24} style={{ color: '#8B5CF6' }} />
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>Completion Rate</h3>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#8B5CF6' }}>
                        {completionRate}%
                    </div>
                </div>
            </div>

            {/* Project Breakdown */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>
                    Progress by Project
                </h3>

                {Object.keys(stats.projectBreakdown).length === 0 ? (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: 20 }}>
                        No projects yet
                    </p>
                ) : (
                    Object.values(stats.projectBreakdown).map(proj => (
                        <div key={proj.name} style={{ marginBottom: 20 }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                            }}>
                                <span style={{ fontWeight: 500 }}>
                                    {proj.emoji} {proj.name}
                                </span>
                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                    {proj.completed} / {proj.total} ({proj.total > 0 ? ((proj.completed / proj.total) * 100).toFixed(0) : 0}%)
                                </span>
                            </div>

                            <div style={{
                                height: 10,
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${proj.total > 0 ? (proj.completed / proj.total * 100) : 0}%`,
                                    background: `linear-gradient(90deg, ${proj.color}, ${proj.color}99)`,
                                    borderRadius: 8,
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.85rem' }}>
                                <span style={{ opacity: 0.6 }}>
                                    ✓ {proj.completed} completed
                                </span>
                                <span style={{ opacity: 0.6 }}>
                                    ⏳ {proj.inProgress} in progress
                                </span>
                                <span style={{ opacity: 0.6 }}>
                                    ◯ {proj.total - proj.completed - proj.inProgress} pending
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkspaceAnalytics;
