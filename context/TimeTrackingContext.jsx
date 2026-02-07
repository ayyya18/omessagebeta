import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TimeTrackingContext = createContext();

export const useTimeTracking = () => useContext(TimeTrackingContext);

export const TimeTrackingProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [activeTimer, setActiveTimer] = useState(null);
    const [timeEntries, setTimeEntries] = useState([]);

    // Start timer
    const startTimer = async (workspaceId, projectId, taskId, taskTitle = '') => {
        if (!currentUser) return;

        try {
            // Stop any active timer first
            if (activeTimer) {
                await stopTimer(workspaceId, projectId);
            }

            const timerData = {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                taskId,
                taskTitle,
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'timeEntries'),
                timerData
            );

            const newTimer = { id: docRef.id, ...timerData };
            setActiveTimer(newTimer);
            return newTimer;
        } catch (err) {
            console.error('Error starting timer:', err);
            throw err;
        }
    };

    // Stop timer
    const stopTimer = async (workspaceId, projectId) => {
        if (!currentUser || !activeTimer) return;

        try {
            const endTime = new Date().toISOString();
            const duration = Math.floor((new Date(endTime) - new Date(activeTimer.startTime)) / 1000); // seconds

            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'projects', projectId, 'timeEntries', activeTimer.id),
                {
                    endTime,
                    duration,
                    isActive: false
                }
            );

            setActiveTimer(null);
            return { duration, endTime };
        } catch (err) {
            console.error('Error stopping timer:', err);
            throw err;
        }
    };

    // Add manual time entry
    const addManualEntry = async (workspaceId, projectId, entryData) => {
        if (!currentUser) return;

        try {
            const entry = {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                taskId: entryData.taskId,
                taskTitle: entryData.taskTitle || '',
                startTime: entryData.startTime,
                endTime: entryData.endTime,
                duration: entryData.duration,
                description: entryData.description || '',
                isActive: false,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'timeEntries'),
                entry
            );

            return { id: docRef.id, ...entry };
        } catch (err) {
            console.error('Error adding manual entry:', err);
            throw err;
        }
    };

    // Get time entries
    const getTimeEntries = async (workspaceId, projectId, filters = {}) => {
        try {
            let q = collection(db, 'workspaces', workspaceId, 'projects', projectId, 'timeEntries');

            // Apply filters
            const constraints = [orderBy('startTime', 'desc')];

            if (filters.userId) {
                constraints.unshift(where('userId', '==', filters.userId));
            }

            if (filters.taskId) {
                constraints.unshift(where('taskId', '==', filters.taskId));
            }

            q = query(q, ...constraints);

            const snapshot = await getDocs(q);
            const entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setTimeEntries(entries);
            return entries;
        } catch (err) {
            console.error('Error fetching time entries:', err);
            return [];
        }
    };

    // Delete time entry
    const deleteTimeEntry = async (workspaceId, projectId, entryId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId, 'timeEntries', entryId));
            setTimeEntries(prev => prev.filter(e => e.id !== entryId));
        } catch (err) {
            console.error('Error deleting time entry:', err);
            throw err;
        }
    };

    // Get total time for task
    const getTaskTotalTime = (taskId) => {
        const taskEntries = timeEntries.filter(e => e.taskId === taskId && !e.isActive);
        return taskEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
    };

    // Get total time for user
    const getUserTotalTime = (userId) => {
        const userEntries = timeEntries.filter(e => e.userId === userId && !e.isActive);
        return userEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
    };

    // Format duration (seconds to HH:MM:SS)
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TimeTrackingContext.Provider value={{
            activeTimer,
            timeEntries,
            startTimer,
            stopTimer,
            addManualEntry,
            getTimeEntries,
            deleteTimeEntry,
            getTaskTotalTime,
            getUserTotalTime,
            formatDuration
        }}>
            {children}
        </TimeTrackingContext.Provider>
    );
};
