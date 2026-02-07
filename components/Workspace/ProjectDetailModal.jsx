import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiCalendar, FiUser, FiPlus, FiClock } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import '../Calendar/AddEventModal.css';

const ProjectDetailModal = ({ show, onClose, project, workspaceId }) => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newDeadline, setNewDeadline] = useState('');

    // Fetch Project Tasks
    useEffect(() => {
        if (!project || !workspaceId) return;

        const q = query(
            collection(db, 'workspaces', workspaceId, 'projects', project.id, 'project_tasks'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [project, workspaceId]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask) return;

        try {
            await addDoc(collection(db, 'workspaces', workspaceId, 'projects', project.id, 'project_tasks'), {
                title: newTask,
                start: newDeadline || new Date().toISOString().split('T')[0], // For Calendar compatibility
                assignees: [currentUser.uid], // Auto-assign to self for now
                completed: false,
                createdAt: new Date().toISOString(),
                category: 'work'
            });
            setNewTask('');
            setNewDeadline('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const toggleTask = async (task) => {
        const taskRef = doc(db, 'workspaces', workspaceId, 'projects', project.id, 'project_tasks', task.id);
        await updateDoc(taskRef, { completed: !task.completed });
    };

    if (!show || !project) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="project-icon-large" style={{
                            width: 40, height: 40, background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12
                        }}>
                            <FiCheck />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>{project.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{project.category}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="project-body" style={{ marginTop: 24 }}>
                    {/* Add Task Form */}
                    <form onSubmit={handleAddTask} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Add a new task..."
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                style={{ flex: 1, marginBottom: 0 }}
                            />
                            <input
                                type="date"
                                className="glass-input"
                                value={newDeadline}
                                onChange={e => setNewDeadline(e.target.value)}
                                style={{ width: 140, marginBottom: 0 }}
                            />
                            <button type="submit" className="glass-btn primary icon-only"><FiPlus /></button>
                        </div>
                    </form>

                    {/* Task List */}
                    <h4 style={{ marginBottom: 16 }}>Tasks</h4>
                    <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {tasks.map(task => (
                            <div key={task.id} className="task-item" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: task.completed ? 'rgba(0,0,0,0.05)' : 'var(--card-bg)',
                                border: '1px solid var(--glass-border)',
                                padding: 12, borderRadius: 8,
                                opacity: task.completed ? 0.6 : 1
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleTask(task)}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                    <div>
                                        <div style={{ textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 500 }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={12} /> {task.start}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiUser size={12} /> {task.assignees?.length} assignee</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: 20 }}>
                                No tasks yet. Add one above!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
