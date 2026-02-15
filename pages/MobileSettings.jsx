import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { FiChevronRight, FiMoon, FiSun, FiBell, FiLock, FiGlobe, FiHelpCircle, FiLogOut, FiArrowLeft, FiUser, FiMonitor, FiBriefcase, FiCommand, FiDatabase, FiInfo, FiShield, FiSettings } from 'react-icons/fi';
import './MobileSettings.css';
import Avatar from '../components/Avatar';
import BottomNavigation from '../components/BottomNavigation';

const MobileSettings = () => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { settings, updateSetting } = useSettings();
    const navigate = useNavigate();
    const [activeSubPage, setActiveSubPage] = useState(null); // null = main list

    // Handlers
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const goBack = () => setActiveSubPage(null);

    // --- Sub-Components (Internal) ---

    const DisplaySettings = () => (
        <div className="sub-page">
            <div className="settings-header sub-header">
                <button className="back-btn" onClick={goBack}>
                    <FiArrowLeft size={24} />
                </button>
                <h1>Display & Appearance</h1>
            </div>

            <div className="group-title">Theme</div>
            <div className="settings-group">
                <div className="settings-item">
                    <div className="theme-control full-width">
                        <div
                            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => { if (theme !== 'light') toggleTheme() }}
                        >
                            Light
                        </div>
                        <div
                            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => { if (theme !== 'dark') toggleTheme() }}
                        >
                            Dark
                        </div>
                    </div>
                </div>
            </div>

            <div className="group-title">Zoom Level: {settings.zoom}%</div>
            <div className="settings-group">
                <div className="settings-item column-item">
                    <input
                        type="range"
                        min="80"
                        max="150"
                        step="10"
                        value={settings.zoom}
                        onChange={(e) => updateSetting('zoom', Number(e.target.value))}
                        className="zoom-slider"
                    />
                    <div className="zoom-labels">
                        <span>80%</span>
                        <span>100%</span>
                        <span>125%</span>
                        <span>150%</span>
                    </div>
                </div>
            </div>

            <div className="group-title">Layout</div>
            <div className="settings-group">
                <div className="settings-item">
                    <div className="item-label">
                        <div>Compact Mode</div>
                        <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>Dense UI with reduced spacing</div>
                    </div>
                    <label className="ios-switch">
                        <input
                            type="checkbox"
                            checked={settings.compactMode}
                            onChange={(e) => updateSetting('compactMode', e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    );

    const WorkspaceSettings = () => (
        <div className="sub-page">
            <div className="settings-header sub-header">
                <button className="back-btn" onClick={goBack}>
                    <FiArrowLeft size={24} />
                </button>
                <h1>Workspace</h1>
            </div>

            <div className="group-title">View Options</div>
            <div className="settings-group">
                <div className="settings-item column-item">
                    <div className="item-label" style={{ marginBottom: '10px' }}>Default View</div>
                    <select
                        value={settings.defaultView}
                        onChange={(e) => updateSetting('defaultView', e.target.value)}
                        className="ios-select"
                    >
                        <option value="board">Board View</option>
                        <option value="list">List View</option>
                        <option value="calendar">Calendar View</option>
                    </select>
                </div>
            </div>

            <div className="settings-group">
                <div className="settings-item">
                    <div className="item-label">
                        <div>Show Completed Tasks</div>
                        <div style={{ fontSize: '13px', color: '#8e8e93', marginTop: '4px' }}>Display completed tasks in lists</div>
                    </div>
                    <label className="ios-switch">
                        <input
                            type="checkbox"
                            checked={settings.showCompletedTasks}
                            onChange={(e) => updateSetting('showCompletedTasks', e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    );

    const AboutSettings = () => (
        <div className="sub-page">
            <div className="settings-header sub-header">
                <button className="back-btn" onClick={goBack}>
                    <FiArrowLeft size={24} />
                </button>
                <h1>About</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', padding: '0 20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>OMessage</h2>
                <p style={{ color: '#8e8e93', marginBottom: '40px' }}>Version 2.0.0</p>

                <p style={{ lineHeight: '1.6', color: '#ffffff', maxWidth: '300px' }}>
                    A comprehensive workspace collaboration platform with advanced features for teams.
                </p>
            </div>
        </div>
    );

    const PlaceholderSettings = ({ title }) => (
        <div className="sub-page">
            <div className="settings-header sub-header">
                <button className="back-btn" onClick={goBack}>
                    <FiArrowLeft size={24} />
                </button>
                <h1>{title}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', padding: '0 20px', textAlign: 'center' }}>
                <FiSettings size={64} color="#3a3a3c" style={{ marginBottom: '20px' }} />
                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#8e8e93' }}>Coming Soon</h3>
                <p style={{ color: '#555', fontSize: '15px' }}>
                    This section is under development
                </p>
            </div>
        </div>
    );


    // --- Main Render ---

    if (activeSubPage === 'display') return <DisplaySettings />;
    if (activeSubPage === 'workspace') return <WorkspaceSettings />;
    if (activeSubPage === 'about') return <AboutSettings />;
    if (activeSubPage === 'shortcuts') return <PlaceholderSettings title="Keyboard Shortcuts" />;
    if (activeSubPage === 'data') return <PlaceholderSettings title="Data & Storage" />;
    if (activeSubPage === 'privacy') return <PlaceholderSettings title="Privacy & Security" />;
    if (activeSubPage === 'help') return <PlaceholderSettings title="Help Center" />;
    if (activeSubPage === 'notifications') return <PlaceholderSettings title="Notifications" />; // Placeholder for now or move toggle insde

    return (
        <div className="mobile-settings-container">
            {/* Header */}
            <div className="settings-header">
                <h1>Settings</h1>
            </div>

            {/* Account Section */}
            <div className="group-title">ACCOUNT</div>
            <div className="profile-section">
                <div className="profile-avatar">
                    <Avatar src={currentUser?.photoURL} alt={currentUser?.displayName} size={60} />
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">{currentUser?.displayName || 'User'}</h2>
                    <p className="profile-email">{currentUser?.email}</p>
                </div>
                <button className="profile-edit-btn" onClick={() => {/* Navigate to Edit Profile */ }}>
                    Edit <FiChevronRight />
                </button>
            </div>

            {/* General Group */}
            <div className="group-title">GENERAL</div>
            <div className="settings-group">
                <div className="settings-item" onClick={() => setActiveSubPage('display')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#007AFF' }}>
                            <FiMonitor size={18} />
                        </div>
                        <div className="item-label">Display & Appearance</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>

                <div className="settings-item" onClick={() => setActiveSubPage('notifications')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#FF2D55' }}>
                            <FiBell size={18} />
                        </div>
                        <div className="item-label">Notifications</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>

                <div className="settings-item">
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#5856D6' }}>
                            <FiGlobe size={18} />
                        </div>
                        <div className="item-label">Language & Region</div>
                    </div>
                    <div className="item-value">
                        {settings.language === 'id' ? 'Indonesia' : 'English'}
                        <FiChevronRight />
                    </div>
                </div>

                <div className="settings-item" onClick={() => setActiveSubPage('privacy')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#34C759' }}>
                            <FiLock size={18} />
                        </div>
                        <div className="item-label">Privacy & Security</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>
            </div>

            {/* Preferences Group */}
            <div className="group-title">PREFERENCES</div>
            <div className="settings-group">
                <div className="settings-item" onClick={() => setActiveSubPage('workspace')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#AF52DE' }}>
                            <FiBriefcase size={18} />
                        </div>
                        <div className="item-label">Workspace</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>
                <div className="settings-item" onClick={() => setActiveSubPage('shortcuts')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#FF9500' }}>
                            <FiCommand size={18} />
                        </div>
                        <div className="item-label">Keyboard Shortcuts</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>
                <div className="settings-item" onClick={() => setActiveSubPage('data')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#64D2FF' }}>
                            <FiDatabase size={18} />
                        </div>
                        <div className="item-label">Data & Storage</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>
            </div>

            {/* Other Group */}
            <div className="group-title">OTHER</div>
            <div className="settings-group">
                <div className="settings-item" onClick={() => setActiveSubPage('about')}>
                    <div className="item-left">
                        <div className="setting-icon-container" style={{ backgroundColor: '#8E8E93' }}>
                            <FiInfo size={18} />
                        </div>
                        <div className="item-label">About</div>
                    </div>
                    <FiChevronRight className="chevron-right" />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-group">
                <div className="settings-item danger-zone" onClick={handleLogout}>
                    <div className="item-label" style={{ color: '#ff3b30' }}>Log Out</div>
                    <FiLogOut size={20} color="#ff3b30" />
                </div>
                <div className="settings-item danger-zone">
                    <div className="item-label" style={{ color: '#ff3b30' }}>Delete Account</div>
                </div>
            </div>

            <div style={{ textAlign: 'center', color: '#8e8e93', fontSize: '13px', marginTop: '20px', paddingBottom: '40px' }}>
                OMessage v2.0.0
            </div>

            <BottomNavigation />
        </div>
    );
};

export default MobileSettings;
