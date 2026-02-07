import React, { useState } from 'react';
import { FiX, FiCheck, FiCalendar, FiTag, FiBox } from 'react-icons/fi';
import '../Calendar/AddEventModal.css';

const CreateProjectModal = ({ show, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Web Development');
    const [deadline, setDeadline] = useState('');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [selectedEmoji, setSelectedEmoji] = useState('🚀');

    const projectColors = [
        '#3B82F6', '#10B981', '#EF4444', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    const projectEmojis = [
        '🚀', '💼', '🎨', '📱', '💻', '🎯',
        '⚡', '🔥', '✨', '🌟', '📊', '🏆'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        try {
            await onCreate({
                name,
                category,
                deadline,
                color: selectedColor,
                emoji: selectedEmoji,
                icon: 'box'
            });
            onClose();
            setName('');
            setCategory('Web Development');
            setDeadline('');
            setSelectedColor('#3B82F6');
            setSelectedEmoji('🚀');
        } catch (error) {
            console.error(error);
            alert("Failed to create project");
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h3>Create New Project</h3>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Name</label>
                        <input
                            type="text"
                            className="glass-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Website Redesign"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label><FiTag style={{ marginRight: 8 }} /> Category</label>
                        <select
                            className="glass-input"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="Product Design">Product Design</option>
                            <option value="Illustration">Illustration</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Project Color</label>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {projectColors.map(color => (
                                <div
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: color,
                                        border: selectedColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: selectedColor === color ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none'
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Project Icon</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {projectEmojis.map(emoji => (
                                <div
                                    key={emoji}
                                    onClick={() => setSelectedEmoji(emoji)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 8,
                                        background: selectedEmoji === emoji ? `${selectedColor}20` : 'rgba(255,255,255,0.05)',
                                        border: selectedEmoji === emoji ? `2px solid ${selectedColor}` : '2px solid transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    title={emoji}
                                >
                                    {emoji}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label><FiCalendar style={{ marginRight: 8 }} /> Deadline</label>
                        <input
                            type="date"
                            className="glass-input"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="glass-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="glass-btn primary">
                            <FiCheck style={{ marginRight: 8 }} /> Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
