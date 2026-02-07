import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext();

export const usePermissions = () => useContext(PermissionsContext);

// Permission matrix
const PERMISSIONS = {
    workspace: {
        delete: ['admin'],
        editSettings: ['admin', 'manager'],
        inviteMembers: ['admin', 'manager'],
        viewAnalytics: ['admin', 'manager', 'member'],
        createProjects: ['admin', 'manager', 'member']
    },
    project: {
        delete: ['admin', 'manager'],
        edit: ['admin', 'manager'],
        createTasks: ['admin', 'manager', 'member'],
        viewTasks: ['admin', 'manager', 'member', 'guest'],
        editTasks: ['admin', 'manager', 'member']
    },
    task: {
        delete: ['admin', 'manager'],
        edit: ['admin', 'manager', 'assignee'],
        comment: ['admin', 'manager', 'member', 'guest'],
        changeStatus: ['admin', 'manager', 'assignee']
    },
    file: {
        upload: ['admin', 'manager', 'member'],
        delete: ['admin', 'manager', 'uploader'],
        download: ['admin', 'manager', 'member', 'guest']
    }
};

export const PermissionsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [userRoles, setUserRoles] = useState({}); // { workspaceId: role }

    // Get user role in workspace
    const getUserRole = async (workspaceId) => {
        if (!currentUser || !workspaceId) return null;

        // Check cache first
        if (userRoles[workspaceId]) {
            return userRoles[workspaceId];
        }

        try {
            const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
            if (!workspaceDoc.exists()) return null;

            const workspaceData = workspaceDoc.data();

            // Check if user is creator (admin)
            if (workspaceData.createdBy === currentUser.uid) {
                setUserRoles(prev => ({ ...prev, [workspaceId]: 'admin' }));
                return 'admin';
            }

            // Check memberRoles field
            const memberRoles = workspaceData.memberRoles || {};
            const role = memberRoles[currentUser.uid] || 'guest';

            setUserRoles(prev => ({ ...prev, [workspaceId]: role }));
            return role;
        } catch (err) {
            console.error('Error getting user role:', err);
            return null;
        }
    };

    // Check if user has permission
    const canPerform = async (action, resource, workspaceId, additionalContext = {}) => {
        if (!currentUser || !workspaceId) return false;

        const userRole = await getUserRole(workspaceId);
        if (!userRole) return false;

        const allowedRoles = PERMISSIONS[resource]?.[action];
        if (!allowedRoles) return false;

        // Check role-based permission
        if (allowedRoles.includes(userRole)) return true;

        // Check context-specific permissions
        if (resource === 'task' && allowedRoles.includes('assignee')) {
            // Check if user is assignee
            if (additionalContext.assignees?.includes(currentUser.uid)) {
                return true;
            }
        }

        if (resource === 'task' && allowedRoles.includes('creator')) {
            // Check if user is creator
            if (additionalContext.createdBy === currentUser.uid) {
                return true;
            }
        }

        if (resource === 'file' && allowedRoles.includes('uploader')) {
            // Check if user is uploader
            if (additionalContext.uploaderId === currentUser.uid) {
                return true;
            }
        }

        return false;
    };

    // Shorthand permission checks
    const canDeleteWorkspace = (workspaceId) => canPerform('delete', 'workspace', workspaceId);
    const canEditWorkspace = (workspaceId) => canPerform('editSettings', 'workspace', workspaceId);
    const canInviteMembers = (workspaceId) => canPerform('inviteMembers', 'workspace', workspaceId);
    const canCreateProject = (workspaceId) => canPerform('createProjects', 'workspace', workspaceId);

    const canDeleteProject = (workspaceId) => canPerform('delete', 'project', workspaceId);
    const canEditProject = (workspaceId) => canPerform('edit', 'project', workspaceId);
    const canCreateTask = (workspaceId) => canPerform('createTasks', 'project', workspaceId);

    const canDeleteTask = (workspaceId, task) => canPerform('delete', 'task', workspaceId, task);
    const canEditTask = (workspaceId, task) => canPerform('edit', 'task', workspaceId, task);
    const canCommentOnTask = (workspaceId) => canPerform('comment', 'task', workspaceId);

    const canUploadFile = (workspaceId) => canPerform('upload', 'file', workspaceId);
    const canDeleteFile = (workspaceId, file) => canPerform('delete', 'file', workspaceId, file);

    return (
        <PermissionsContext.Provider value={{
            getUserRole,
            canPerform,
            canDeleteWorkspace,
            canEditWorkspace,
            canInviteMembers,
            canCreateProject,
            canDeleteProject,
            canEditProject,
            canCreateTask,
            canDeleteTask,
            canEditTask,
            canCommentOnTask,
            canUploadFile,
            canDeleteFile,
            userRoles
        }}>
            {children}
        </PermissionsContext.Provider>
    );
};
