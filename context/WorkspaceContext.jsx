import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, setDoc, deleteDoc, orderBy, arrayUnion, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { notifyWorkspaceMembers, createNotification, createBulkNotifications } = useNotification();
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setWorkspaces([]);
            setLoading(false);
            return;
        }

        // Fetch workspaces where user is a member
        const q = query(collection(db, 'workspaces'), where('memberIds', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWorkspaces(fetched);

            // Set default workspace if none selected
            if (fetched.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(fetched[0]);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching workspaces:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const [projects, setProjects] = useState([]);
    const [posts, setPosts] = useState([]);
    const [files, setFiles] = useState([]); // New State
    const [externalLinks, setExternalLinks] = useState([]);

    // Listen for projects, posts, and files
    useEffect(() => {
        if (!currentWorkspace) {
            setProjects([]);
            setPosts([]);
            setFiles([]);
            setExternalLinks([]);
            return;
        }

        // Projects Listener
        const qProjects = query(collection(db, 'workspaces', currentWorkspace.id, 'projects'));
        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Posts Listener
        const qPosts = query(collection(db, 'workspaces', currentWorkspace.id, 'posts'), orderBy('createdAt', 'desc'));
        const unsubPosts = onSnapshot(qPosts, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Files Listener
        const qFiles = query(collection(db, 'workspaces', currentWorkspace.id, 'files'), orderBy('createdAt', 'desc'));
        const unsubFiles = onSnapshot(qFiles, (snapshot) => {
            setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // External Links Listener
        const qLinks = query(collection(db, 'workspaces', currentWorkspace.id, 'externalLinks'), orderBy('order'));
        const unsubLinks = onSnapshot(qLinks, (snapshot) => {
            setExternalLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubProjects();
            unsubPosts();
            unsubFiles();
            unsubLinks();
        };
    }, [currentWorkspace]);

    const createWorkspace = async (details) => {
        console.log("WorkspaceContext: createWorkspace called", details);
        if (!currentUser) {
            console.error("WorkspaceContext: No currentUser");
            throw new Error("You must be logged in to create a workspace.");
        }

        try {
            // 1. Prepare Workspace Data
            console.log("WorkspaceContext: Preparing data...");
            const workspaceRef = doc(collection(db, 'workspaces'));
            const workspaceId = workspaceRef.id;

            // Process Initial Members
            // Input: Array of user objects { uid, displayName, photoURL, email, ... }
            const initialMembersList = (details.initialMembers || []).map(user => ({
                uid: user.uid,
                email: user.email || '', // Might be missing if search didn't return it, but UID is key
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: 'member',
                status: 'active' // Directly active since we selected existing users
            }));

            const allMembers = [
                {
                    uid: currentUser.uid,
                    role: 'admin',
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    status: 'active'
                },
                ...initialMembersList
            ];

            const memberIds = allMembers.map(m => m.uid);

            // Handle Avatar (Mock Upload if file object passed)
            let finalAvatarUrl = details.avatarUrl || '';
            if (details.avatarFile) {
                // In a real app, upload here. For now, use the preview blob URL or generate a fake one
                // finalAvatarUrl = await uploadFileToStorage(details.avatarFile);
                finalAvatarUrl = details.avatarUrl; // Keep the blob URL for session, or string
            }

            const newWorkspace = {
                id: workspaceId,
                name: details.name,
                description: details.description || '',
                avatarUrl: finalAvatarUrl,
                ownerId: currentUser.uid,
                memberIds: memberIds,
                members: allMembers,
                createdAt: new Date().toISOString()
            };

            // 2. Create Linked Group Chat
            const chatRef = doc(collection(db, 'chats'));
            const newChat = {
                type: 'group',
                name: `${details.name} General`,
                workspaceId: workspaceId,
                members: memberIds, // Add all members to the chat
                createdAt: new Date().toISOString(),
                recentMessage: {
                    text: `Welcome to ${details.name}!`,
                    senderId: 'system',
                    timestamp: new Date().toISOString()
                },
                photoURL: details.avatarUrl || ''
            };

            // 3. Write Data (Workspace + Link Chat)
            await setDoc(workspaceRef, { ...newWorkspace, generalChatId: chatRef.id });
            await setDoc(chatRef, newChat);

            // 4. Update userChats for the creator
            const userChatRef = doc(db, 'userChats', currentUser.uid);
            const chatData = {
                [chatRef.id]: {
                    userInfo: {
                        uid: workspaceId,
                        displayName: `${details.name} General`,
                        photoURL: details.avatarUrl || ''
                    },
                    isGroup: true,
                    date: new Date().toISOString(),
                    lastMessage: {
                        text: `Welcome to ${details.name}!`,
                    }
                }
            };

            try {
                await updateDoc(userChatRef, chatData);
            } catch (err) {
                if (err.code === 'not-found' || err.message.includes('No document')) {
                    await setDoc(userChatRef, chatData);
                } else {
                    console.error("Error updating userChats:", err);
                    // Don't throw here, workspace creation is successful otherwise
                }
            }

            return workspaceId;
        } catch (err) {
            console.error("Error creating workspace:", err);
            throw err;
        }
    };

    const createPost = async (workspaceId, content, attachments = []) => {
        if (!workspaceId || !currentUser) return;
        try {
            await addDoc(collection(db, 'workspaces', workspaceId, 'posts'), {
                content,
                attachments,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                authorPhoto: currentUser.photoURL || '',
                createdAt: new Date().toISOString(),
                likes: [],
                comments: [],
                pinned: false
            });

            // Notify all workspace members except the author
            const workspace = workspaces.find(ws => ws.id === workspaceId);
            if (workspace) {
                await notifyWorkspaceMembers(workspace, {
                    type: 'workspace_post',
                    message: `${currentUser.displayName || 'Someone'} posted in ${workspace.name}`,
                    actionUrl: '/workspace',
                    workspaceId: workspaceId
                }, [currentUser.uid]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deletePost = async (workspaceId, postId) => {
        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'posts', postId));
        } catch (err) { console.error(err); }
    };

    const editPost = async (workspaceId, postId, newContent) => {
        try {
            await updateDoc(doc(db, 'workspaces', workspaceId, 'posts', postId), {
                content: newContent,
                editedAt: new Date().toISOString()
            });
        } catch (err) { console.error(err); }
    };

    const togglePinPost = async (workspaceId, postId, currentPinState) => {
        try {
            await updateDoc(doc(db, 'workspaces', workspaceId, 'posts', postId), {
                pinned: !currentPinState
            });
        } catch (err) { console.error(err); }
    };

    const addComment = async (workspaceId, postId, commentText) => {
        if (!currentUser) return;
        try {
            const postRef = doc(db, 'workspaces', workspaceId, 'posts', postId);
            await updateDoc(postRef, {
                comments: arrayUnion({
                    id: Date.now().toString(),
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName || currentUser.email,
                    authorPhoto: currentUser.photoURL || '',
                    text: commentText,
                    createdAt: new Date().toISOString()
                })
            });

            // Notify post author about new comment (if not commenting on own post)
            const postDoc = await doc(db, 'workspaces', workspaceId, 'posts', postId);
            const postData = posts.find(p => p.id === postId);

            if (postData && postData.authorId !== currentUser.uid) {
                await createNotification(postData.authorId, {
                    type: 'workspace_comment',
                    message: `${currentUser.displayName || 'Someone'} commented on your post`,
                    actionUrl: '/workspace',
                    postId: postId,
                    workspaceId: workspaceId
                });
            }
        } catch (err) { console.error(err); }
    };

    const createProject = async (workspaceId, projectDetails) => {
        if (!workspaceId) return;
        try {
            await addDoc(collection(db, 'workspaces', workspaceId, 'projects'), {
                ...projectDetails,
                createdAt: new Date().toISOString(),
                status: 'active', // active, completed, archived
                progress: 0,
                members: projectDetails.members || []
            });
        } catch (err) {
            console.error("Error creating project:", err);
            throw err;
        }
    };

    const uploadFile = async (workspaceId, fileObj) => {
        // Mock upload - In real app, upload to Storage then save metadata
        try {
            await addDoc(collection(db, 'workspaces', workspaceId, 'files'), {
                name: fileObj.name,
                size: fileObj.size,
                type: fileObj.type,
                url: URL.createObjectURL(fileObj), // Mock URL
                uploaderId: currentUser.uid,
                uploaderName: currentUser.displayName || currentUser.email,
                createdAt: new Date().toISOString()
            });
        } catch (err) { console.error(err); }
    };

    const updateWorkspace = async (workspaceId, data) => {
        try {
            await updateDoc(doc(db, 'workspaces', workspaceId), data);
        } catch (err) { console.error(err); }
    };

    const inviteMember = async (workspaceId, user) => {
        try {
            const workspaceRef = doc(db, 'workspaces', workspaceId);

            // Create new member object
            const newMember = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: 'member',
                status: 'active',
                joinedAt: new Date().toISOString()
            };

            // Update workspace document
            await updateDoc(workspaceRef, {
                members: arrayUnion(newMember),
                memberIds: arrayUnion(user.uid)
            });

            // Also add them to the general chat
            if (currentWorkspace?.generalChatId) {
                const chatRef = doc(db, 'chats', currentWorkspace.generalChatId);
                await updateDoc(chatRef, {
                    members: arrayUnion(user.uid)
                });

                // Update userChats for the new member so they see the chat
                const userChatRef = doc(db, 'userChats', user.uid);
                const chatData = {
                    [currentWorkspace.generalChatId]: {
                        userInfo: {
                            uid: currentWorkspace.generalChatId, // Chat ID
                            displayName: `${currentWorkspace.name} General`,
                            photoURL: currentWorkspace.avatarUrl || ''
                        },
                        isGroup: true,
                        date: new Date().toISOString(),
                        lastMessage: {
                            text: `You have been added to ${currentWorkspace.name}`,
                        }
                    }
                };
                try {
                    await updateDoc(userChatRef, chatData);
                } catch (err) {
                    if (err.code === 'not-found' || err.message.includes('No document')) {
                        await setDoc(userChatRef, chatData);
                    }
                }
            }

            // Notify the new member that they were added
            const workspace = workspaces.find(ws => ws.id === workspaceId) || currentWorkspace;
            if (workspace) {
                await createNotification(user.uid, {
                    type: 'workspace_member',
                    message: `You were added to ${workspace.name}`,
                    actionUrl: '/workspace',
                    workspaceId: workspaceId
                });
            }

            // Provide feedback
            // alert(`User ${user.displayName} added to workspace!`); 
            // Better to let UI handle success/failure via try/catch, but we can return success here
            return true;

        } catch (err) {
            console.error("Error inviting member:", err);
            throw err;
        }
    };

    const removeMember = async (workspaceId, memberUid) => {
        try {
            // In real app: Remove from memberIds and members array
            // Here: Just mock alert
            alert("Member removed (Mock)");
        } catch (err) { console.error(err); }
    };

    const deleteWorkspace = async (workspaceId) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId));
            window.location.reload();
        } catch (err) { console.error(err); }
    };

    const switchWorkspace = (workspaceId) => {
        const ws = workspaces.find(w => w.id === workspaceId);
        if (ws) setCurrentWorkspace(ws);
        else console.warn(`Workspace ${workspaceId} not found`);
    };

    const saveExternalLinks = async (workspaceId, links) => {
        try {
            // Delete all existing links
            const existingLinksQuery = query(collection(db, 'workspaces', workspaceId, 'externalLinks'));
            const existingDocs = await getDocs(existingLinksQuery);
            await Promise.all(existingDocs.docs.map(doc => deleteDoc(doc.ref)));

            // Add new links
            await Promise.all(links.map((link, index) => {
                const linkData = {
                    name: link.name,
                    url: link.url,
                    icon: link.icon || '🔗',
                    order: index,
                    createdAt: new Date().toISOString()
                };
                return addDoc(collection(db, 'workspaces', workspaceId, 'externalLinks'), linkData);
            }));
        } catch (err) {
            console.error('Error saving external links:', err);
            throw err;
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            currentWorkspace,
            projects,
            posts,
            files, // Export files
            externalLinks, // Export external links
            loading,
            createWorkspace,
            createProject,
            createPost,
            editPost,
            deletePost,
            togglePinPost,
            addComment,
            uploadFile,
            updateWorkspace, // New
            inviteMember, // New
            removeMember, // New
            deleteWorkspace, // New
            switchWorkspace,
            saveExternalLinks // Export save function
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};
