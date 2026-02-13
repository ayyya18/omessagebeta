import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const AnalyticsContext = createContext();

export const useAnalytics = () => useContext(AnalyticsContext);

export const AnalyticsProvider = ({ children }) => {
    const [analyticsData, setAnalyticsData] = useState({});

    // Get project analytics
    const getProjectAnalytics = async (workspaceId, projectId) => {
        try {
            // Fetch tasks
            const tasksSnapshot = await getDocs(
                collection(db, 'workspaces', workspaceId, 'projects', projectId, 'project_tasks')
            );

            const tasks = tasksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Calculate metrics
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
            const todoTasks = tasks.filter(t => t.status === 'todo').length;
            const overdueTasks = tasks.filter(t => t.end && new Date(t.end) < new Date() && t.status !== 'completed').length;

            // Task distribution by priority
            const highPriority = tasks.filter(t => t.priority === 'high').length;
            const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
            const lowPriority = tasks.filter(t => t.priority === 'low').length;

            // Average completion time
            const completedWithDates = tasks.filter(t => t.status === 'completed' && t.createdAt && t.end);
            const avgCompletionTime = completedWithDates.length > 0
                ? completedWithDates.reduce((sum, t) => {
                    const duration = new Date(t.end) - new Date(t.createdAt);
                    return sum + duration;
                }, 0) / completedWithDates.length
                : 0;

            // Completion rate
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks,
                overdueTasks,
                highPriority,
                mediumPriority,
                lowPriority,
                avgCompletionTime: Math.floor(avgCompletionTime / (1000 * 60 * 60 * 24)), // days
                completionRate: Math.round(completionRate),
                tasks
            };
        } catch (err) {
            console.error('Error fetching project analytics:', err);
            return null;
        }
    };

    // Get workspace analytics
    const getWorkspaceAnalytics = async (workspaceId) => {
        try {
            // Fetch all projects
            const projectsSnapshot = await getDocs(
                collection(db, 'workspaces', workspaceId, 'projects')
            );

            const projects = projectsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const totalProjects = projects.length;
            const activeProjects = projects.filter(p => p.status !== 'archived').length;

            // Aggregate task data from all projects
            let allTasks = [];
            for (const project of projects) {
                const tasksSnapshot = await getDocs(
                    collection(db, 'workspaces', workspaceId, 'projects', project.id, 'project_tasks')
                );
                const projectTasks = tasksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    projectId: project.id,
                    ...doc.data()
                }));
                allTasks = [...allTasks, ...projectTasks];
            }

            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(t => t.status === 'completed').length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
                totalProjects,
                activeProjects,
                totalTasks,
                completedTasks,
                completionRate: Math.round(completionRate),
                projects,
                tasks: allTasks
            };
        } catch (err) {
            console.error('Error fetching workspace analytics:', err);
            return null;
        }
    };

    // Get user productivity analytics
    const getUserProductivity = async (workspaceId, userId) => {
        try {
            // This would aggregate data across all projects for a specific user
            // For now, return placeholder
            return {
                tasksCompleted: 0,
                tasksInProgress: 0,
                averageCompletionTime: 0,
                productivityScore: 0
            };
        } catch (err) {
            console.error('Error fetching user productivity:', err);
            return null;
        }
    };

    return (
        <AnalyticsContext.Provider value={{
            analyticsData,
            getProjectAnalytics,
            getWorkspaceAnalytics,
            getUserProductivity
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};
