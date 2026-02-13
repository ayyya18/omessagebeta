import React from 'react';
import NavigationSidebar from './NavigationSidebar';
import BottomNavigation from './BottomNavigation';

/**
 * Shared layout for Dashboard pages (Chat, Calendar, etc.)
 * Provides the 3-column grid structure foundation.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.sidebar - The middle column content (ChatList, CalFilters, etc.)
 * @param {React.ReactNode} props.content - The main right column content (ChatWindow, CalView, etc.)
 */
const DashboardLayout = ({ sidebar, content }) => {
    return (
        <div className="dashboard-container">
            {/* 1. Navigation Sidebar (Left) - Always present */}
            <NavigationSidebar />

            {/* 2. Middle Sidebar (Contextual) */}
            {sidebar}

            {/* 3. Main Content (Right) */}
            {content}
            <BottomNavigation />
        </div>
    );
};

export default DashboardLayout;
