import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TaskDependenciesContext = createContext();

export const useTaskDependencies = () => useContext(TaskDependenciesContext);

export const TaskDependenciesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [dependencies, setDependencies] = useState({});

    // Add dependency
    const addDependency = async (workspaceId, projectId, taskId, dependsOnTaskId, type = 'finish-to-start') => {
        if (!currentUser) return;

        try {
            const dependency = {
                taskId,
                dependsOnTaskId,
                type, // finish-to-start, start-to-start, finish-to-finish, start-to-finish
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'dependencies'),
                dependency
            );

            return { id: docRef.id, ...dependency };
        } catch (err) {
            console.error('Error adding dependency:', err);
            throw err;
        }
    };

    // Remove dependency
    const removeDependency = async (workspaceId, projectId, dependencyId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId, 'dependencies', dependencyId));
        } catch (err) {
            console.error('Error removing dependency:', err);
            throw err;
        }
    };

    // Get dependencies for task
    const getTaskDependencies = async (workspaceId, projectId, taskId) => {
        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'dependencies'),
                where('taskId', '==', taskId)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Error fetching dependencies:', err);
            return [];
        }
    };

    // Check if task can start (all dependencies completed)
    const canTaskStart = async (workspaceId, projectId, taskId, tasks) => {
        const deps = await getTaskDependencies(workspaceId, projectId, taskId);

        if (deps.length === 0) return true;

        // Check all dependencies
        for (const dep of deps) {
            const dependentTask = tasks.find(t => t.id === dep.dependsOnTaskId);

            if (!dependentTask) continue;

            // For finish-to-start, dependent task must be completed
            if (dep.type === 'finish-to-start' && dependentTask.status !== 'completed') {
                return false;
            }

            // For start-to-start, dependent task must be started
            if (dep.type === 'start-to-start' && dependentTask.status === 'todo') {
                return false;
            }
        }

        return true;
    };

    // Get critical path (longest path through task dependencies)
    const getCriticalPath = (tasks, dependencies) => {
        // Simplified critical path calculation
        // In production, use proper algorithm like CPM
        const taskDurations = {};

        tasks.forEach(task => {
            if (task.start && task.end) {
                const duration = new Date(task.end) - new Date(task.start);
                taskDurations[task.id] = duration;
            } else {
                taskDurations[task.id] = 0;
            }
        });

        // Find longest path
        // This is a placeholder - implement proper CPM algorithm
        return [];
    };

    return (
        <TaskDependenciesContext.Provider value={{
            dependencies,
            addDependency,
            removeDependency,
            getTaskDependencies,
            canTaskStart,
            getCriticalPath
        }}>
            {children}
        </TaskDependenciesContext.Provider>
    );
};
