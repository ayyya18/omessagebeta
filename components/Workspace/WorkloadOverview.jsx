import React, { useState, useEffect } from 'react';
import { FiUser, FiAlertTriangle } from 'react-icons/fi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const WorkloadOverview = () => {
    const { currentWorkspace, projects } = useWorkspace();
    const [workloadData, setWorkloadData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentWorkspace || !projects.length) {
            setWorkloadData([]);
            setLoading(false);
            return;
        }

        const calculateWorkload = async () => {
            setLoading(true);
            try {
                const allTasks = [];

                // Fetch all tasks from all projects
                for (const project of projects) {
                    const tasksQuery = query(collection(db, 'workspaces', currentWorkspace.id, 'projects', project.id, 'tasks'));
                    const tasksSnapshot = await getDocs(tasksQuery);
                    tasksSnapshot.forEach(doc => {
                        allTasks.push({ ...doc.data(), id: doc.id, projectId: project.id });
                    });
                }

                // Calculate workload per member
                const memberWorkload = {};

                currentWorkspace.members?.forEach(member => {
                    memberWorkload[member.uid] = {
                        member,
                        total: 0,
                        todo: 0,
                        doing: 0,
                        review: 0
                    };
                });

                allTasks.forEach(task => {
                    if (task.assignees && Array.isArray(task.assignees)) {
                        task.assignees.forEach(assigneeId => {
                            if (memberWorkload[assigneeId]) {
                                memberWorkload[assigneeId].total++;
                                const status = task.status || 'todo';
                                if (status === 'todo') memberWorkload[assigneeId].todo++;
                                else if (status === 'doing') memberWorkload[assigneeId].doing++;
                                else if (status === 'review') memberWorkload[assigneeId].review++;
                            }
                        });
                    }
                });

                // Convert to array and sort by total tasks (descending)
                const workloadArray = Object.values(memberWorkload)
                    .filter(w => w.total > 0 || w.member.role === 'admin') // Show admins even with 0 tasks
                    .sort((a, b) => b.total - a.total);

                setWorkloadData(workloadArray);
            } catch (err) {
                console.error('Error calculating workload:', err);
            } finally {
                setLoading(false);
            }
        };

        calculateWorkload();
    }, [currentWorkspace, projects]);

    const getWorkloadColor = (total) => {
        if (total === 0) return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280', label: 'Free' };
        if (total <= 3) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', label: 'Light' };
        if (total <= 5) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', label: 'Moderate' };
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', label: 'Heavy' };
    };

    const getMemberInitials = (member) => {
        if (!member.displayName) return 'U';
        const names = member.displayName.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return member.displayName.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>
                Loading workload data...
            </div>
        );
    }

    if (workloadData.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                <FiUser size={32} style={{ marginBottom: 12 }} />
                <p>No tasks assigned yet</p>
            </div>
        );
    }

    return (
        <div className="workload-overview" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {workloadData.map((data, index) => {
                const colorScheme = getWorkloadColor(data.total);
                const isOverloaded = data.total > 5;

                return (
                    <div
                        key={data.member.uid}
                        className="glass-card"
                        style={{
                            padding: 12,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            border: isOverloaded ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)'
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: `hsl(${index * 45}, 70%, 60%)`,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                flexShrink: 0
                            }}
                        >
                            {getMemberInitials(data.member)}
                        </div>

                        {/* Member Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.member.displayName || data.member.email}
                                </span>
                                {isOverloaded && (
                                    <FiAlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} title="Overloaded" />
                                )}
                            </div>

                            {/* Task breakdown */}
                            {data.total > 0 && (
                                <div style={{ display: 'flex', gap: 8, fontSize: '0.7rem', opacity: 0.7 }}>
                                    {data.todo > 0 && <span>{data.todo} to do</span>}
                                    {data.doing > 0 && <span>{data.doing} doing</span>}
                                    {data.review > 0 && <span>{data.review} review</span>}
                                </div>
                            )}
                        </div>

                        {/* Task Count Badge */}
                        <div
                            style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: colorScheme.bg,
                                color: colorScheme.color,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{data.total}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>tasks</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WorkloadOverview;
