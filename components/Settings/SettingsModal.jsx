import React, { useState } from 'react';
import { FiX, FiMonitor, FiZoomIn, FiZoomOut, FiBell, FiGlobe, FiLock, FiBriefcase, FiCommand, FiDatabase, FiInfo } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

const SettingsModal = ({ show, onClose }) => {
    const { settings, updateSetting, resetSettings } = useSettings();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('display');

    if (!show) return null;

    const tabs = [
        { id: 'display', label: 'Display & Appearance', icon: <FiMonitor /> },
        { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
        { id: 'language', label: 'Language & Region', icon: <FiGlobe /> },
        { id: 'privacy', label: 'Privacy & Security', icon: <FiLock /> },
        { id: 'workspace', label: 'Workspace', icon: <FiBriefcase /> },
        { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <FiCommand /> },
        { id: 'data', label: 'Data & Storage', icon: <FiDatabase /> },
        { id: 'about', label: 'About', icon: <FiInfo /> }
    ];

    const zoomLevels = [80, 90, 100, 110, 125, 150];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{
                width: '100%',
                maxWidth: 900,
                height: '80vh',
                background: 'rgba(30, 30, 30, 0.6)',
                borderRadius: 32,
                display: 'flex',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 0.5px 1px rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)'
            }}>
                <div style={{
                    width: 240,
                    background: 'rgba(20, 20, 20, 0.5)',
                    borderRight: '0.5px solid rgba(255,255,255,0.08)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(12px)'
                }}>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>Settings</h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, color: '#fff' }}>Manage your preferences</p>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                    border: '0.5px solid ' + (activeTab === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent'),
                                    borderRadius: 24,
                                    color: activeTab === tab.id ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 6,
                                    transition: 'all 0.3s ease',
                                    textAlign: 'left',
                                    fontSize: '0.9rem',
                                    fontWeight: activeTab === tab.id ? 500 : 400
                                }}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={resetSettings}
                        style={{
                            padding: '10px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 8,
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            marginTop: 12
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(26, 26, 26, 0.4)',
                    backdropFilter: 'blur(12px)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: 24,
                        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(30, 30, 30, 0.3)'
                    }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#fff' }}>
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <button onClick={onClose} style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: 8
                        }}>
                            <FiX size={24} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 24,
                        color: '#fff'
                    }}>
                        {activeTab === 'display' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                {/* Theme */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>
                                        Theme
                                    </label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {['light', 'dark'].map(t => (
                                            <button
                                                key={t}
                                                onClick={toggleTheme}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px 20px',
                                                    background: theme === t ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                                    border: `0.5px solid ${theme === t ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.06)'}`,
                                                    borderRadius: 16,
                                                    color: theme === t ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                                    cursor: 'pointer',
                                                    textTransform: 'capitalize',
                                                    fontWeight: theme === t ? 500 : 400,
                                                    transition: 'all 0.3s ease',
                                                    backdropFilter: 'blur(8px)'
                                                }}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Zoom Level */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>
                                        Zoom Level: {settings.zoom}%
                                    </label>
                                    <input
                                        type="range"
                                        min={80}
                                        max={150}
                                        step={10}
                                        value={settings.zoom}
                                        onChange={(e) => updateSetting('zoom', parseInt(e.target.value))}
                                        style={{ width: '100%', marginBottom: 12 }}
                                    />
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {zoomLevels.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => updateSetting('zoom', level)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: settings.zoom === level ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                                                    border: `0.5px solid ${settings.zoom === level ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.06)'}`,
                                                    borderRadius: 12,
                                                    color: settings.zoom === level ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: settings.zoom === level ? 500 : 400,
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {level}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Compact Mode */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Compact Mode</div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Dense UI with reduced spacing</div>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                                        <input
                                            type="checkbox"
                                            checked={settings.compactMode}
                                            onChange={(e) => updateSetting('compactMode', e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: settings.compactMode ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                                            borderRadius: 26,
                                            transition: '0.3s',
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                content: '',
                                                height: 18,
                                                width: 18,
                                                left: settings.compactMode ? 28 : 4,
                                                bottom: 4,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: '0.3s'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {[
                                    { key: 'notificationsEnabled', label: 'Enable Notifications', desc: 'Receive notifications for updates' },
                                    { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Show browser notifications' },
                                    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for events' },
                                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates' }
                                ].map(item => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{item.desc}</div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                                            <input
                                                type="checkbox"
                                                checked={settings[item.key]}
                                                onChange={(e) => updateSetting(item.key, e.target.checked)}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                cursor: 'pointer',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: settings[item.key] ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                                                borderRadius: 26,
                                                transition: '0.3s',
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    content: '',
                                                    height: 18,
                                                    width: 18,
                                                    left: settings[item.key] ? 28 : 4,
                                                    bottom: 4,
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    transition: '0.3s'
                                                }} />
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'workspace' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>
                                        Default View
                                    </label>
                                    <select
                                        value={settings.defaultView}
                                        onChange={(e) => updateSetting('defaultView', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: '#16213e',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: 8,
                                            color: '#fff',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <option value="board">Board View</option>
                                        <option value="list">List View</option>
                                        <option value="calendar">Calendar View</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Show Completed Tasks</div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Display completed tasks in lists</div>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26 }}>
                                        <input
                                            type="checkbox"
                                            checked={settings.showCompletedTasks}
                                            onChange={(e) => updateSetting('showCompletedTasks', e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: settings.showCompletedTasks ? '#3B82F6' : 'rgba(255,255,255,0.2)',
                                            borderRadius: 26,
                                            transition: '0.3s',
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                content: '',
                                                height: 18,
                                                width: 18,
                                                left: settings.showCompletedTasks ? 28 : 4,
                                                bottom: 4,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: '0.3s'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Placeholder tabs */}
                        {(activeTab === 'language' || activeTab === 'privacy' || activeTab === 'shortcuts' || activeTab === 'data') && (
                            <div style={{ padding: 60, textAlign: 'center', opacity: 0.6 }}>
                                <FiSettings size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <h4 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Coming Soon</h4>
                                <p style={{ fontSize: '0.9rem' }}>This section is under development</p>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>OMessage</h1>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.6, marginBottom: 24 }}>Version 2.0.0</p>
                                    <p style={{ maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                                        A comprehensive workspace collaboration platform with advanced features for teams.
                                    </p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 12 }}>
                                    <h4 style={{ marginBottom: 12 }}>Features</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <li>✅ Comments & Mentions</li>
                                        <li>✅ File Attachments</li>
                                        <li>✅ Global Search</li>
                                        <li>✅ Templates</li>
                                        <li>✅ Custom Fields</li>
                                        <li>✅ Permissions</li>
                                        <li>✅ Time Tracking</li>
                                        <li>✅ Automation</li>
                                        <li>✅ Dependencies</li>
                                        <li>✅ Analytics</li>
                                        <li>✅ Collaboration</li>
                                        <li>✅ Export</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
