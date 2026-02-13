import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const AutomationContext = createContext();

export const useAutomation = () => useContext(AutomationContext);

export const AutomationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [automations, setAutomations] = useState([]);

    // Fetch automations for workspace
    const fetchAutomations = async (workspaceId) => {
        if (!workspaceId) return;

        try {
            const q = query(collection(db, 'workspaces', workspaceId, 'automations'));
            const snapshot = await getDocs(q);
            const automationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setAutomations(automationsData);
        } catch (err) {
            console.error('Error fetching automations:', err);
        }
    };

    // Create automation rule
    const createAutomation = async (workspaceId, automationData) => {
        if (!currentUser) return;

        try {
            const automation = {
                name: automationData.name,
                description: automationData.description || '',
                isActive: automationData.isActive !== undefined ? automationData.isActive : true,

                // Trigger
                trigger: {
                    type: automationData.trigger.type, // status_change, assignee_change, due_date, custom_field_change
                    condition: automationData.trigger.condition || {}
                },

                // Actions
                actions: automationData.actions || [], // [{type: 'notify', config: {}}, {type: 'update_field', config: {}}]

                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'automations'),
                automation
            );

            return { id: docRef.id, ...automation };
        } catch (err) {
            console.error('Error creating automation:', err);
            throw err;
        }
    };

    // Update automation
    const updateAutomation = async (workspaceId, automationId, updates) => {
        if (!currentUser) return;

        try {
            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'automations', automationId),
                updates
            );

            setAutomations(prev => prev.map(a =>
                a.id === automationId ? { ...a, ...updates } : a
            ));
        } catch (err) {
            console.error('Error updating automation:', err);
            throw err;
        }
    };

    // Delete automation
    const deleteAutomation = async (workspaceId, automationId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'automations', automationId));
            setAutomations(prev => prev.filter(a => a.id !== automationId));
        } catch (err) {
            console.error('Error deleting automation:', err);
            throw err;
        }
    };

    // Execute automation (called when trigger conditions are met)
    const executeAutomation = async (workspaceId, automation, context) => {
        if (!automation.isActive) return;

        try {
            for (const action of automation.actions) {
                switch (action.type) {
                    case 'notify':
                        // Send notification
                        console.log('Sending notification:', action.config);
                        break;

                    case 'update_field':
                        // Update task/project field
                        console.log('Updating field:', action.config);
                        break;

                    case 'assign':
                        // Auto-assign task
                        console.log('Auto-assigning:', action.config);
                        break;

                    case 'move_status':
                        // Change status
                        console.log('Moving status:', action.config);
                        break;

                    default:
                        console.log('Unknown action type:', action.type);
                }
            }
        } catch (err) {
            console.error('Error executing automation:', err);
        }
    };

    return (
        <AutomationContext.Provider value={{
            automations,
            fetchAutomations,
            createAutomation,
            updateAutomation,
            deleteAutomation,
            executeAutomation
        }}>
            {children}
        </AutomationContext.Provider>
    );
};
