import React, { useState } from 'react';
import { FiGrid, FiCalendar, FiMail, FiLayout, FiMessageSquare, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { NavLink } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import SettingsModal from './Settings/SettingsModal';

export default function NavigationSidebar() {
    const { currentUser } = useAuth();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <div className="nav-sidebar">
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
                        <span className="badge">6</span>
                    </NavLink>
                </nav>

                <div className="nav-bottom">
                    <NotificationBell />
                    <button className="nav-item" title="Settings" onClick={() => setShowSettings(true)}>
                        <FiSettings size={20} />
                    </button>
                    <div className="nav-avatar">
                        <Avatar src={currentUser?.photoURL} alt="Profile" size={32} />
                    </div>
                </div>
            </div>

            <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
}

