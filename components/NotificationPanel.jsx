import React, { useRef, useEffect } from 'react';
import { FiX, FiCheckCircle, FiBell } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';
import { formatDistance } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = ({ show, onClose, buttonRef }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside panel AND outside the notification button
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                buttonRef?.current &&
                !buttonRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose, buttonRef]);

    const handleNotificationClick = async (notif) => {
        await markAsRead(notif.id);
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
            onClose();
        }
    };

    if (!show) return null;

    return (
        <div
            ref={panelRef}
            className="notification-panel glass-card"
            style={{
                position: 'fixed',
                top: '80px',
                left: '120px',
                width: 380,
                maxHeight: 500,
                overflowY: 'auto',
                padding: 0,
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 1000,
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                zIndex: 1
            }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    Notifications
                </h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#3B82F6',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <FiCheckCircle size={14} /> Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div>
                {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                        <FiBell size={40} style={{ marginBottom: 12 }} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: notif.actionUrl ? 'pointer' : 'default',
                                background: notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                transition: 'background 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (notif.actionUrl) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                            }}
                        >
                            {!notif.read && (
                                <div style={{
                                    position: 'absolute',
                                    left: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: '#3B82F6'
                                }} />
                            )}

                            <div style={{ marginLeft: notif.read ? 0 : 16 }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    fontWeight: notif.read ? 400 : 600,
                                    marginBottom: 4
                                }}>
                                    {notif.message}
                                </p>
                                {notif.taskTitle && (
                                    <p style={{
                                        margin: '4px 0',
                                        fontSize: '0.85rem',
                                        opacity: 0.7
                                    }}>
                                        📋 {notif.taskTitle}
                                    </p>
                                )}
                                <small style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                    {formatDistance(new Date(notif.createdAt), new Date(), { addSuffix: true })}
                                </small>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
