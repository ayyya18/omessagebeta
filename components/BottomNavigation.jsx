import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiCalendar, FiLayout, FiMessageSquare, FiSettings } from 'react-icons/fi';
import './BottomNavigation.css';
import { useChat } from '../context/ChatContext';

export default function BottomNavigation() {
    const { totalUnreadCount } = useChat();

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiGrid size={24} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiCalendar size={24} />
                <span>Calendar</span>
            </NavLink>
            <NavLink to="/workspace" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiLayout size={24} />
                <span>Work</span>
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <FiMessageSquare size={24} />
                    {totalUnreadCount > 0 && <span className="bottom-nav-badge">{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>}
                </div>
                <span>Chat</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <FiSettings size={24} />
                <span>Settings</span>
            </NavLink>
        </nav>
    );
}
