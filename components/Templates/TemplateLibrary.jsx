import React, { useState, useEffect } from 'react';
import { FiGrid, FiClock, FiUser, FiTrendingUp, FiX } from 'react-icons/fi';
import { useTemplates } from '../../context/TemplatesContext';

const TemplateLibrary = ({ workspaceId, onUseTemplate, onClose }) => {
    const { templates, loading, fetchTemplates } = useTemplates();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        if (workspaceId) {
            fetchTemplates(workspaceId);
        }
    }, [workspaceId]);

    const categories = ['all', 'Development', 'Marketing', 'Design', 'Business', 'General'];

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const handleUseTemplate = (template) => {
        setSelectedTemplate(template);
    };

    const handleConfirmUse = (customizations) => {
        if (onUseTemplate && selectedTemplate) {
            onUseTemplate(selectedTemplate.id, customizations);
        }
        setSelectedTemplate(null);
        if (onClose) onClose();
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}>Loading templates...</div>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
                Template Library
            </h2>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            padding: '8px 16px',
                            background: selectedCategory === cat ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: selectedCategory === cat ? '#3B82F6' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            textTransform: 'capitalize',
                            fontWeight: 500
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
                    <FiGrid size={48} style={{ margin: '0 auto 16px' }} />
                    <p>No templates available</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
                        Create your first template to get started
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20
                }}>
                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className="glass-card"
                            style={{
                                padding: 20,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                ':hover': {
                                    transform: 'translateY(-4px)'
                                }
                            }}
                            onClick={() => handleUseTemplate(template)}
                        >
                            {/* Icon & Category */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ fontSize: 40 }}>{template.icon}</div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: 6,
                                    color: '#3B82F6',
                                    height: 'fit-content'
                                }}>
                                    {template.category}
                                </span>
                            </div>

                            {/* Name & Description */}
                            <h3 style={{ marginBottom: 8, fontSize: '1.1rem', fontWeight: 600 }}>
                                {template.name}
                            </h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 16, lineHeight: 1.5 }}>
                                {template.description}
                            </p>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', opacity: 0.6 }}>
                                <span>
                                    📋 {template.projectStructure?.tasks?.length || 0} tasks
                                </span>
                                <span>
                                    👥 {template.usageCount || 0} uses
                                </span>
                            </div>

                            {/* Use Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUseTemplate(template);
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: 16,
                                    padding: '10px 16px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 8,
                                    color: '#3B82F6',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                }}
                            >
                                Use Template
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Template Customization Modal */}
            {selectedTemplate && (
                <TemplateCustomizationModal
                    template={selectedTemplate}
                    onConfirm={handleConfirmUse}
                    onCancel={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    );
};

// Template Customization Modal Component
const TemplateCustomizationModal = ({ template, onConfirm, onCancel }) => {
    const [projectName, setProjectName] = useState(template.projectStructure?.name || '');
    const [description, setDescription] = useState(template.projectStructure?.description || '');
    const [color, setColor] = useState('#3B82F6');
    const [emoji, setEmoji] = useState(template.icon);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const emojis = ['🚀', '💼', '🎨', '📱', '💻', '📊', '🎯', '⚡', '🔥', '💡', '🌟', '🎉'];

    const handleSubmit = () => {
        onConfirm({
            name: projectName,
            description,
            color,
            emoji
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: 500,
                    background: 'var(--bg-secondary)',
                    borderRadius: 16,
                    padding: 24,
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Customize Project</h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Project Name */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Project Name
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter project description"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* Color Picker */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Color
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {colors.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    background: c,
                                    border: color === c ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    transform: color === c ? 'scale(1.1)' : 'scale(1)'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Emoji Picker */}
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Emoji
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {emojis.map(e => (
                            <button
                                key={e}
                                onClick={() => setEmoji(e)}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    background: emoji === e ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: emoji === e ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    fontSize: '1.3rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Info */}
                <div style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    marginBottom: 24,
                    fontSize: '0.85rem',
                    opacity: 0.8
                }}>
                    <div style={{ marginBottom: 8 }}>
                        📋 This template includes:
                    </div>
                    <div>• {template.projectStructure?.tasks?.length || 0} pre-defined tasks</div>
                    <div>• {template.category} workflow</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!projectName.trim()}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: projectName.trim() ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: 8,
                            color: 'white',
                            cursor: projectName.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        Create Project
                    </button>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateLibrary;
