import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CommentsContext = createContext();

export const useComments = () => useContext(CommentsContext);

export const CommentsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { createNotification } = useNotification();
    const [commentsCache, setCommentsCache] = useState({});
    const [listeners, setListeners] = useState({});

    // Subscribe to comments for a specific task
    const subscribeToComments = (workspaceId, projectId, taskId) => {
        const key = `${workspaceId}/${projectId}/${taskId}`;

        // Return existing listener if already subscribed
        if (listeners[key]) {
            return;
        }

        const q = query(
            collection(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCommentsCache(prev => ({
                ...prev,
                [key]: comments
            }));
        });

        setListeners(prev => ({
            ...prev,
            [key]: unsubscribe
        }));
    };

    // Unsubscribe from task comments
    const unsubscribeFromComments = (workspaceId, projectId, taskId) => {
        const key = `${workspaceId}/${projectId}/${taskId}`;

        if (listeners[key]) {
            listeners[key]();
            setListeners(prev => {
                const newListeners = { ...prev };
                delete newListeners[key];
                return newListeners;
            });

            setCommentsCache(prev => {
                const newCache = { ...prev };
                delete newCache[key];
                return newCache;
            });
        }
    };

    // Get comments for a task
    const getComments = (workspaceId, projectId, taskId) => {
        const key = `${workspaceId}/${projectId}/${taskId}`;
        return commentsCache[key] || [];
    };

    // Add a comment
    const addComment = async (workspaceId, projectId, taskId, text, taskTitle = '') => {
        if (!currentUser || !text.trim()) return;

        try {
            // Extract mentions (@username)
            const mentionRegex = /@(\w+)/g;
            const mentions = [];
            let match;
            while ((match = mentionRegex.exec(text)) !== null) {
                mentions.push(match[1]);
            }

            const commentData = {
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                authorPhoto: currentUser.photoURL || '',
                text: text.trim(),
                mentions: mentions,
                reactions: {},
                resolved: false,
                createdAt: new Date().toISOString(),
                editedAt: null
            };

            const commentRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments'),
                commentData
            );

            // Send notifications to mentioned users
            // Note: In real implementation, you'd need to resolve @username to user IDs
            // For now, we'll assume mentions array contains user IDs
            for (const mentionedUserId of mentions) {
                if (mentionedUserId !== currentUser.uid) {
                    try {
                        await createNotification(mentionedUserId, {
                            type: 'comment_mention',
                            message: `${currentUser.displayName} mentioned you in a comment`,
                            taskTitle: taskTitle,
                            commentText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                            actionUrl: `/workspace`,
                            createdAt: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error('Error sending mention notification:', err);
                    }
                }
            }

            return commentRef.id;
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    };

    // Edit a comment
    const editComment = async (workspaceId, projectId, taskId, commentId, newText) => {
        if (!currentUser) return;

        try {
            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments', commentId),
                {
                    text: newText.trim(),
                    editedAt: new Date().toISOString()
                }
            );
        } catch (err) {
            console.error('Error editing comment:', err);
            throw err;
        }
    };

    // Delete a comment
    const deleteComment = async (workspaceId, projectId, taskId, commentId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(
                doc(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments', commentId)
            );
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err;
        }
    };

    // Toggle reaction on a comment
    const toggleReaction = async (workspaceId, projectId, taskId, commentId, emoji) => {
        if (!currentUser) return;

        try {
            const commentRef = doc(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments', commentId);
            const key = `${workspaceId}/${projectId}/${taskId}`;
            const comment = commentsCache[key]?.find(c => c.id === commentId);

            if (!comment) return;

            const reactions = comment.reactions || {};
            const userReacted = reactions[emoji]?.includes(currentUser.uid);

            if (userReacted) {
                // Remove reaction
                await updateDoc(commentRef, {
                    [`reactions.${emoji}`]: arrayRemove(currentUser.uid)
                });
            } else {
                // Add reaction
                await updateDoc(commentRef, {
                    [`reactions.${emoji}`]: arrayUnion(currentUser.uid)
                });
            }
        } catch (err) {
            console.error('Error toggling reaction:', err);
            throw err;
        }
    };

    // Resolve a comment
    const resolveComment = async (workspaceId, projectId, taskId, commentId, resolved = true) => {
        if (!currentUser) return;

        try {
            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks', taskId, 'comments', commentId),
                { resolved }
            );
        } catch (err) {
            console.error('Error resolving comment:', err);
            throw err;
        }
    };

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            Object.values(listeners).forEach(unsubscribe => unsubscribe());
        };
    }, []);

    return (
        <CommentsContext.Provider value={{
            subscribeToComments,
            unsubscribeFromComments,
            getComments,
            addComment,
            editComment,
            deleteComment,
            toggleReaction,
            resolveComment
        }}>
            {children}
        </CommentsContext.Provider>
    );
};
