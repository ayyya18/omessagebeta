import React from 'react';

const CustomFieldInput = ({ field, value, onChange, disabled = false }) => {
    const handleChange = (newValue) => {
        if (onChange) {
            onChange(field.id, newValue);
        }
    };

    const renderInput = () => {
        switch (field.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}
                    />
                );

            case 'dropdown':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="">Select {field.name.toLowerCase()}</option>
                        {(field.options || []).map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => handleChange(e.target.checked)}
                            disabled={disabled}
                            style={{
                                width: 18,
                                height: 18,
                                cursor: disabled ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <span style={{ fontSize: '0.95rem' }}>
                            {field.name}
                        </span>
                    </label>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ marginBottom: 16 }}>
            {field.type !== 'checkbox' && (
                <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontWeight: 500,
                    fontSize: '0.9rem'
                }}>
                    {field.name}
                    {field.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
                </label>
            )}
            {renderInput()}
        </div>
    );
};

export default CustomFieldInput;
