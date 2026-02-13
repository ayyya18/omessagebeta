import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TemplatesContext = createContext();

export const useTemplates = () => useContext(TemplatesContext);

export const TemplatesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch all templates (public + user's private)
    const fetchTemplates = async (workspaceId) => {
        if (!workspaceId) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'templates'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const templatesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setTemplates(templatesData);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
        setLoading(false);
    };

    // Create template from project
    const createTemplate = async (workspaceId, templateData) => {
        if (!currentUser) return;

        try {
            const template = {
                name: templateData.name,
                description: templateData.description || '',
                category: templateData.category || 'General',
                icon: templateData.icon || '📋',
                isPublic: templateData.isPublic !== undefined ? templateData.isPublic : true,
                createdBy: currentUser.uid,
                createdByName: currentUser.displayName || currentUser.email,

                // Template structure
                projectStructure: {
                    name: templateData.projectStructure?.name || '',
                    description: templateData.projectStructure?.description || '',
                    tasks: templateData.projectStructure?.tasks || [],
                    customFields: templateData.projectStructure?.customFields || {}
                },

                usageCount: 0,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'templates'),
                template
            );

            return { id: docRef.id, ...template };
        } catch (err) {
            console.error('Error creating template:', err);
            throw err;
        }
    };

    // Delete template
    const deleteTemplate = async (workspaceId, templateId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'templates', templateId));
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        } catch (err) {
            console.error('Error deleting template:', err);
            throw err;
        }
    };

    // Create project from template
    const createProjectFromTemplate = async (workspaceId, templateId, projectOverrides = {}) => {
        if (!currentUser) return;

        try {
            const template = templates.find(t => t.id === templateId);
            if (!template) throw new Error('Template not found');

            const projectData = {
                name: projectOverrides.name || template.projectStructure.name,
                description: projectOverrides.description || template.projectStructure.description,
                category: template.category,
                color: projectOverrides.color || '#3B82F6',
                emoji: projectOverrides.emoji || template.icon,
                deadline: projectOverrides.deadline || null,
                createdBy: currentUser.uid,
                members: [currentUser.uid],
                createdAt: new Date().toISOString(),
                fromTemplate: templateId
            };

            // Create project
            const projectRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'projects'),
                projectData
            );

            // Create tasks from template
            const tasks = template.projectStructure.tasks || [];
            for (const taskTemplate of tasks) {
                const taskData = {
                    title: taskTemplate.title,
                    description: taskTemplate.description || '',
                    priority: taskTemplate.priority || 'medium',
                    category: taskTemplate.category || 'General',
                    status: 'todo',
                    progress: 0,
                    assignees: [],
                    createdBy: currentUser.uid,
                    createdAt: new Date().toISOString(),

                    // Calculate dates if estimatedDays provided
                    ...(taskTemplate.estimatedDays && {
                        start: new Date().toISOString(),
                        end: new Date(Date.now() + taskTemplate.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
                    })
                };

                await addDoc(
                    collection(db, 'workspaces', workspaceId, 'projects', projectRef.id, 'project_tasks'),
                    taskData
                );
            }

            return { id: projectRef.id, ...projectData };
        } catch (err) {
            console.error('Error creating project from template:', err);
            throw err;
        }
    };

    return (
        <TemplatesContext.Provider value={{
            templates,
            loading,
            fetchTemplates,
            createTemplate,
            deleteTemplate,
            createProjectFromTemplate
        }}>
            {children}
        </TemplatesContext.Provider>
    );
};
