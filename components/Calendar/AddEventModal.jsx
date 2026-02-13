import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiTag, FiAlignLeft } from 'react-icons/fi';
import './AddEventModal.css';

const AddEventModal = ({ show, onClose, onAdd, onUpdate, initialData, isEditMode }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [category, setCategory] = useState('work');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (show) {
            if (isEditMode && initialData) {
                setTitle(initialData.title);
                const start = new Date(initialData.start);
                const end = new Date(initialData.end);
                setDate(start.toISOString().split('T')[0]);
                setStartTime(start.toTimeString().slice(0, 5));
                setEndTime(end.toTimeString().slice(0, 5));
                setCategory(initialData.category);
                setDescription(initialData.description || '');
            } else {
                // Reset for add mode
                setTitle('');
                setDate(new Date().toISOString().split('T')[0]);
                setStartTime('09:00');
                setEndTime('10:00');
                setCategory('work');
                setDescription('');
            }
        }
    }, [show, isEditMode, initialData]);

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple color mapping based on category
        const colors = {
            work: '#3B82F6', // Blue
            meeting: '#10B981', // Green
            deadline: '#EF4444', // Red
            personal: '#8B5CF6' // Purple
        };

        const eventData = {
            title,
            start: `${date}T${startTime}`,
            end: `${date}T${endTime}`,
            category,
            color: colors[category] || '#ccc',
            description
        };

        if (isEditMode) {
            onUpdate(initialData.id, eventData);
        } else {
            onAdd(eventData);
        }

        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content">
                <div className="modal-header">
                    <h3>{isEditMode ? 'Edit Event' : 'Add New Event'}</h3>
                    <button onClick={onClose} className="close-btn"><FiX /></button>
                </div>

                <form onSubmit={handleSubmit} className="event-form">
                    <div className="form-group">
                        <label>Event Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Project Review"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><FiCalendar /> Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><FiClock /> Start</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><FiClock /> End</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><FiTag /> Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="work">Work (Blue)</option>
                            <option value="meeting">Meeting (Green)</option>
                            <option value="deadline">Deadline (Red)</option>
                            <option value="personal">Personal (Purple)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label><FiAlignLeft /> Description</label>
                        <textarea
                            rows="3"
                            placeholder="Add details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary">{isEditMode ? 'Save Changes' : 'Add Event'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEventModal;
