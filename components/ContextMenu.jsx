import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ isOpen, position, onClose, actions }) {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="context-menu"
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 1000
            }}
        >
            {actions.map((action, index) => (
                <button
                    key={index}
                    className={`context-menu-item ${action.variant || ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        onClose();
                    }}
                >
                    {action.icon && <span className="menu-icon">{action.icon}</span>}
                    {action.label}
                </button>
            ))}
        </div>
    );
}
