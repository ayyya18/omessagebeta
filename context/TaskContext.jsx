import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, collectionGroup, where, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { createNotification } = useNotification();
    const [personalTasks, setPersonalTasks] = useState([]);
    const [workspaceTasks, setWorkspaceTasks] = useState([]);

    // Filter State
    const [filters, setFilters] = useState({
        work: true,
        meeting: true,
        deadline: true,
        personal: true,
        project: true // New filter category
    });

    // 1. Fetch Personal Tasks
    useEffect(() => {
        if (!currentUser) {
            setPersonalTasks([]);
            return;
        }

        const tasksRef = collection(db, 'users', currentUser.uid, 'calendar_tasks');
        const q = query(tasksRef, orderBy('start', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isWorkspaceTask: false
            }));
            setPersonalTasks(fetchedTasks);
        }, (error) => {
            console.error("Error fetching personal tasks:", error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 2. Fetch Assigned Workspace Tasks (Collection Group)
    // TODO: Re-enable this after creating the 'project_tasks' 'assignees' index in Firestore.
    // Currently disabled to prevent application crash/blank page for users without the index.
    /*
    useEffect(() => {
        if (!currentUser) {
            setWorkspaceTasks([]);
            return;
        }

        let unsubscribe = () => { };

        try {
            // Query all 'project_tasks' collections where current user is assigned
            const q = query(
                collectionGroup(db, 'project_tasks'),
                where('assignees', 'array-contains', currentUser.uid)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedTasks = snapshot.docs.map(doc => {
                    const path = doc.ref.path;
                    // path format: workspaces/{wsId}/projects/{projectId}/project_tasks/{taskId}
                    const pathParts = path.split('/');
                    const workspaceId = pathParts.length > 1 ? pathParts[1] : null;
                    const projectId = pathParts.length > 3 ? pathParts[3] : null;

                    return {
                        id: doc.id,
                        ...doc.data(),
                        isWorkspaceTask: true,
                        path: path,
                        workspaceId,
                        projectId,
                        category: doc.data().category || 'work'
                    };
                });
                setWorkspaceTasks(fetchedTasks);
            }, (error) => {
                console.error("Error fetching workspace tasks (index missing?):", error);
                // Fallback: set empty tasks so app continues
                setWorkspaceTasks([]);
            });
        } catch (err) {
            console.error("Query creation failed:", err);
            setWorkspaceTasks([]);
        }

        return () => unsubscribe();
    }, [currentUser]);
    */

    // Merge tasks for consumption
    const tasks = [...personalTasks, ...workspaceTasks];

    // Fetch project metadata for workspace tasks
    const [projectsMap, setProjectsMap] = useState({});

    useEffect(() => {
        if (workspaceTasks.length === 0) {
            setProjectsMap({});
            return;
        }

        const fetchProjectMetadata = async () => {
            const projectsData = {};
            const fetchedProjects = new Set();

            for (const task of workspaceTasks) {
                if (task.workspaceId && task.projectId && !fetchedProjects.has(task.projectId)) {
                    fetchedProjects.add(task.projectId);
                    try {
                        const projectDoc = await getDoc(doc(db, 'workspaces', task.workspaceId, 'projects', task.projectId));
                        if (projectDoc.exists()) {
                            projectsData[task.projectId] = {
                                name: projectDoc.data().name,
                                color: projectDoc.data().color || '#3B82F6',
                                emoji: projectDoc.data().emoji || '🚀'
                            };
                        }
                    } catch (err) {
                        console.error(`Error fetching project ${task.projectId}:`, err);
                    }
                }
            }

            setProjectsMap(projectsData);
        };

        fetchProjectMetadata();
    }, [workspaceTasks]);

    const toggleFilter = (category) => {
        setFilters(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const getFilteredTasks = () => {
        return tasks.filter(task => filters[task.category] || (task.category === undefined && filters.work));
    };

    const addTask = async (task) => {
        if (!currentUser) return;
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'calendar_tasks'), task);

            // Create notification for the event
            await createNotification(currentUser.uid, {
                type: 'event_created',
                message: `New event: ${task.title}`,
                actionUrl: '/calendar',
                taskTitle: task.title,
                eventTime: task.start
            });
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const updateTask = async (id, updatedTask) => {
        if (!currentUser) return;

        // Find the original task to see if it has a specific path (Workspace Task)
        const originalTask = tasks.find(t => t.id === id);

        try {
            if (originalTask && originalTask.path) {
                // It is a Workspace Task with a known path
                await updateDoc(doc(db, originalTask.path), updatedTask);
            } else {
                // Fallback to Personal Task
                const taskRef = doc(db, 'users', currentUser.uid, 'calendar_tasks', id);
                await updateDoc(taskRef, updatedTask);
            }
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const deleteTask = async (id) => {
        if (!currentUser) return;

        const originalTask = tasks.find(t => t.id === id);

        try {
            if (originalTask && originalTask.path) {
                await deleteDoc(doc(db, originalTask.path));
            } else {
                await deleteDoc(doc(db, 'users', currentUser.uid, 'calendar_tasks', id));
            }
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const getTodayTasks = () => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => task.start && task.start.startsWith(today)).sort((a, b) => new Date(a.start) - new Date(b.start));
    };

    const getUpcomingTasks = () => {
        const today = new Date();
        return tasks
            .filter(task => new Date(task.start) > today)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 5);
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            addTask,
            getTodayTasks,
            getUpcomingTasks,
            filters,
            toggleFilter,
            getFilteredTasks,
            updateTask,
            deleteTask,
            projectsMap
        }}>
            {children}
        </TaskContext.Provider>
    );
};
