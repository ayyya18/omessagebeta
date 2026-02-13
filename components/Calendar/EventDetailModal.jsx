import React from 'react';
import { FiX, FiEdit2, FiTrash2, FiClock, FiTag, FiAlignLeft } from 'react-icons/fi';
import './EventDetailModal.css';

const EventDetailModal = ({ show, onClose, task, onEdit, onDelete }) => {
    if (!show || !task) return null;

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            onDelete(task.id);
            onClose();
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><FiX /></button>

                <div className="detail-header">
                    <span className="category-badge" style={{ backgroundColor: task.color }}>
                        {task.category}
                    </span>
                    <div className="action-buttons">
                        <button className="icon-btn edit-btn" onClick={() => onEdit(task)} title="Edit">
                            <FiEdit2 />
                        </button>
                        <button className="icon-btn delete-btn" onClick={handleDelete} title="Delete">
                            <FiTrash2 />
                        </button>
                    </div>
                </div>

                <h2 className="task-title">{task.title}</h2>

                <div className="detail-row">
                    <FiClock className="detail-icon" />
                    <div className="detail-text">
                        <div className="date-text">{formatDate(task.start)}</div>
                        <div className="time-text">
                            {formatTime(task.start)} - {formatTime(task.end)}
                        </div>
                    </div>
                </div>

                {task.description && (
                    <div className="detail-row top-align">
                        <FiAlignLeft className="detail-icon" />
                        <p className="description-text">{task.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetailModal;
