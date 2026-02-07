import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CollaborationContext = createContext();

export const useCollaboration = () => useContext(CollaborationContext);

export const CollaborationProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // Real-time presence tracking
    const updatePresence = async (workspaceId, status = 'active') => {
        if (!currentUser) return;

        try {
            // Update user's presence in workspace
            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'presence', currentUser.uid),
                {
                    userId: currentUser.uid,
                    userName: currentUser.displayName || currentUser.email,
                    userPhoto: currentUser.photoURL || '',
                    status, // active, away, offline
                    lastSeen: new Date().toISOString()
                }
            );
        } catch (err) {
            // If document doesn't exist, create it
            try {
                await addDoc(
                    collection(db, 'workspaces', workspaceId, 'presence'),
                    {
                        userId: currentUser.uid,
                        userName: currentUser.displayName || currentUser.email,
                        userPhoto: currentUser.photoURL || '',
                        status,
                        lastSeen: new Date().toISOString()
                    }
                );
            } catch (createErr) {
                console.error('Error creating presence:', createErr);
            }
        }
    };

    // Get active users in workspace
    const getActiveUsers = async (workspaceId) => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const q = query(
                collection(db, 'workspaces', workspaceId, 'presence'),
                where('lastSeen', '>', fiveMinutesAgo)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Error fetching active users:', err);
            return [];
        }
    };

    // Create activity log
    const logActivity = async (workspaceId, activityData) => {
        if (!currentUser) return;

        try {
            const activity = {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userPhoto: currentUser.photoURL || '',
                action: activityData.action, // created, updated, deleted, commented, etc.
                entityType: activityData.entityType, // task, project, file, etc.
                entityId: activityData.entityId,
                entityTitle: activityData.entityTitle || '',
                details: activityData.details || {},
                timestamp: new Date().toISOString()
            };

            await addDoc(
                collection(db, 'workspaces', workspaceId, 'activity'),
                activity
            );
        } catch (err) {
            console.error('Error logging activity:', err);
        }
    };

    // Get activity feed
    const getActivityFeed = async (workspaceId, limit = 50) => {
        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'activity'),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.slice(0, limit).map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Error fetching activity feed:', err);
            return [];
        }
    };

    // @mentions and notifications handled by NotificationContext
    // This context focuses on presence and activity logging

    return (
        <CollaborationContext.Provider value={{
            updatePresence,
            getActiveUsers,
            logActivity,
            getActivityFeed
        }}>
            {children}
        </CollaborationContext.Provider>
    );
};
