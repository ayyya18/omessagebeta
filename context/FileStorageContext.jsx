import React, { createContext, useContext, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext';

const FileStorageContext = createContext();

export const useFileStorage = () => useContext(FileStorageContext);

export const FileStorageProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [uploadProgress, setUploadProgress] = useState({});

    // Upload file to Firebase Storage
    const uploadFile = async (workspaceId, projectId, file, taskId = null, onProgress = null) => {
        if (!currentUser) throw new Error('User not authenticated');

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 10MB limit');
        }

        try {
            // Create storage reference
            const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const storagePath = `workspaces/${workspaceId}/projects/${projectId}/files/${fileId}`;
            const storageRef = ref(storage, storagePath);

            // Upload file with progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(prev => ({
                            ...prev,
                            [fileId]: progress
                        }));
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[fileId];
                            return newProgress;
                        });
                        reject(error);
                    },
                    async () => {
                        // Upload completed
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // Save metadata to Firestore
                        const fileData = {
                            id: fileId,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: downloadURL,
                            storagePath: storagePath,
                            uploaderId: currentUser.uid,
                            uploaderName: currentUser.displayName || currentUser.email,
                            uploaderPhoto: currentUser.photoURL || '',
                            taskId: taskId,
                            createdAt: new Date().toISOString()
                        };

                        const docRef = await addDoc(
                            collection(db, 'workspaces', workspaceId, 'projects', projectId, 'files'),
                            fileData
                        );

                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[fileId];
                            return newProgress;
                        });

                        resolve({ id: docRef.id, ...fileData });
                    }
                );
            });
        } catch (err) {
            console.error('Error uploading file:', err);
            throw err;
        }
    };

    // Delete file
    const deleteFile = async (workspaceId, projectId, fileId, storagePath) => {
        if (!currentUser) return;

        try {
            // Delete from Storage
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId, 'files', fileId));
        } catch (err) {
            console.error('Error deleting file:', err);
            throw err;
        }
    };

    // Get files for a project
    const getProjectFiles = async (workspaceId, projectId) => {
        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'files'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Error fetching files:', err);
            return [];
        }
    };

    // Get files for a task
    const getTaskFiles = async (workspaceId, projectId, taskId) => {
        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'files'),
                where('taskId', '==', taskId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Error fetching task files:', err);
            return [];
        }
    };

    return (
        <FileStorageContext.Provider value={{
            uploadFile,
            deleteFile,
            getProjectFiles,
            getTaskFiles,
            uploadProgress
        }}>
            {children}
        </FileStorageContext.Provider>
    );
};
