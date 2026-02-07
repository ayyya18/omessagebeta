import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CustomFieldsContext = createContext();

export const useCustomFields = () => useContext(CustomFieldsContext);

export const CustomFieldsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [customFields, setCustomFields] = useState({});

    // Fetch custom fields for workspace
    const fetchCustomFields = async (workspaceId) => {
        if (!workspaceId) return [];

        try {
            const q = query(
                collection(db, 'workspaces', workspaceId, 'customFields'),
                orderBy('order', 'asc')
            );

            const snapshot = await getDocs(q);
            const fields = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCustomFields(prev => ({
                ...prev,
                [workspaceId]: fields
            }));

            return fields;
        } catch (err) {
            console.error('Error fetching custom fields:', err);
            return [];
        }
    };

    // Create custom field
    const createCustomField = async (workspaceId, fieldData) => {
        if (!currentUser) return;

        try {
            const field = {
                name: fieldData.name,
                type: fieldData.type, // text, number, date, dropdown, checkbox
                required: fieldData.required || false,
                options: fieldData.options || [], // for dropdown
                appliesTo: fieldData.appliesTo || 'tasks', // tasks or projects
                order: fieldData.order || 0,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(
                collection(db, 'workspaces', workspaceId, 'customFields'),
                field
            );

            const newField = { id: docRef.id, ...field };

            setCustomFields(prev => ({
                ...prev,
                [workspaceId]: [...(prev[workspaceId] || []), newField]
            }));

            return newField;
        } catch (err) {
            console.error('Error creating custom field:', err);
            throw err;
        }
    };

    // Update custom field
    const updateCustomField = async (workspaceId, fieldId, updates) => {
        if (!currentUser) return;

        try {
            await updateDoc(
                doc(db, 'workspaces', workspaceId, 'customFields', fieldId),
                updates
            );

            setCustomFields(prev => ({
                ...prev,
                [workspaceId]: (prev[workspaceId] || []).map(f =>
                    f.id === fieldId ? { ...f, ...updates } : f
                )
            }));
        } catch (err) {
            console.error('Error updating custom field:', err);
            throw err;
        }
    };

    // Delete custom field
    const deleteCustomField = async (workspaceId, fieldId) => {
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'workspaces', workspaceId, 'customFields', fieldId));

            setCustomFields(prev => ({
                ...prev,
                [workspaceId]: (prev[workspaceId] || []).filter(f => f.id !== fieldId)
            }));
        } catch (err) {
            console.error('Error deleting custom field:', err);
            throw err;
        }
    };

    // Get custom fields for workspace
    const getCustomFields = (workspaceId, appliesTo = null) => {
        const fields = customFields[workspaceId] || [];
        return appliesTo ? fields.filter(f => f.appliesTo === appliesTo) : fields;
    };

    return (
        <CustomFieldsContext.Provider value={{
            customFields,
            fetchCustomFields,
            createCustomField,
            updateCustomField,
            deleteCustomField,
            getCustomFields
        }}>
            {children}
        </CustomFieldsContext.Provider>
    );
};
