import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const defaultSettings = {
    // Display & Appearance
    zoom: 100,
    compactMode: false,
    fontSize: 'medium', // small, medium, large
    sidebarWidth: 280,

    // Notifications
    notificationsEnabled: true,
    desktopNotifications: true,
    soundEnabled: true,
    emailNotifications: false,

    // Language & Region
    language: 'en', // en, id
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h', // 12h, 24h

    // Workspace Preferences
    defaultView: 'board', // board, list, calendar
    autoSaveInterval: 30, // seconds
    taskSorting: 'priority', // priority, date, alphabetical
    showCompletedTasks: true,

    // Keyboard Shortcuts
    shortcutsEnabled: true,

    // Privacy
    analyticsEnabled: true
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('app_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('app_settings', JSON.stringify(settings));
    }, [settings]);

    // Apply zoom globally
    useEffect(() => {
        document.documentElement.style.setProperty('--app-zoom', `${settings.zoom}%`);
        document.documentElement.style.fontSize = `${settings.zoom}%`;
    }, [settings.zoom]);

    // Apply compact mode
    useEffect(() => {
        if (settings.compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
    }, [settings.compactMode]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const updateSettings = (newSettings) => {
        setSettings(prev => ({
            ...prev,
            ...newSettings
        }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            updateSettings,
            resetSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsProvider;

