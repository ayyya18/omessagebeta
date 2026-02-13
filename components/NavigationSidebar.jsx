import React, { useState, useRef } from 'react';
import { FiGrid, FiCalendar, FiMail, FiLayout, FiMessageSquare, FiSettings, FiLogOut, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { NavLink } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import SettingsModal from './Settings/SettingsModal';
import NotificationPanel from './NotificationPanel';

import { useChat } from '../context/ChatContext';

export default function NavigationSidebar() {
    const { currentUser } = useAuth();
    const { unreadCount } = useNotification();
    const { totalUnreadCount } = useChat();
    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationButtonRef = useRef(null);

    return (
        <>
            <div className="nav-sidebar mobile-hidden">
                <div className="nav-logo">
                    <div className="logo-icon">B</div>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiGrid size={20} />
                        <span className="nav-label">Dashboard</span>
                    </NavLink>
                    <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiCalendar size={20} />
                        <span className="nav-label">Calendar</span>
                    </NavLink>
                    <NavLink to="/workspace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiLayout size={20} />
                        <span className="nav-label">Workspace</span>
                    </NavLink>
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FiMessageSquare size={20} />
                        <span className="nav-label">Chat</span>
                        {totalUnreadCount > 0 && <span className="badge">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>}
                    </NavLink>
                    <button
                        ref={notificationButtonRef}
                        className="nav-item"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <FiBell size={20} />
                        <span className="nav-label">Notifications</span>
                        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                </nav>

                <div className="nav-bottom">
                    <button className="nav-item" title="Settings" onClick={() => setShowSettings(true)}>
                        <FiSettings size={20} />
                        <span className="nav-label">Settings</span>
                    </button>
                    <div className="nav-avatar">
                        <Avatar src={currentUser?.photoURL} alt="Profile" size={32} />
                    </div>
                </div>
            </div>

            <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
            <NotificationPanel
                show={showNotifications}
                onClose={() => setShowNotifications(false)}
                buttonRef={notificationButtonRef}
            />
        </>
    );
}

