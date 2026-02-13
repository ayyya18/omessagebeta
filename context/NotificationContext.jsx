import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, 'users', currentUser.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (notifId) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', notifId), {
                read: true
            });
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser) return;
        try {
            const unreadNotifs = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifs.map(n =>
                    updateDoc(doc(db, 'users', currentUser.uid, 'notifications', n.id), { read: true })
                )
            );
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const createNotification = async (targetUserId, notifData) => {
        try {
            await addDoc(collection(db, 'users', targetUserId, 'notifications'), {
                ...notifData,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error creating notification:', err);
        }
    };

    // Notify multiple users at once
    const createBulkNotifications = async (userIds, notifData) => {
        try {
            await Promise.all(
                userIds.map(uid => createNotification(uid, notifData))
            );
        } catch (err) {
            console.error('Error creating bulk notifications:', err);
        }
    };

    // Notify all workspace members except specific users
    const notifyWorkspaceMembers = async (workspace, notifData, excludeUserIds = []) => {
        try {
            const memberIds = workspace.members
                ?.map(m => m.uid)
                .filter(uid => !excludeUserIds.includes(uid)) || [];

            if (memberIds.length > 0) {
                await createBulkNotifications(memberIds, notifData);
            }
        } catch (err) {
            console.error('Error notifying workspace members:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            createNotification,
            createBulkNotifications,
            notifyWorkspaceMembers
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
