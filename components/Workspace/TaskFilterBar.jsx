import React, { useState } from 'react';
import { FiFilter, FiX, FiSearch } from 'react-icons/fi';

const TaskFilterBar = ({ onFilterChange, workspace }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        statuses: [],
        priorities: [],
        categories: [],
        assignees: []
    });

    const statusOptions = [
        { value: 'todo', label: 'To Do', color: '#3B82F6' },
        { value: 'doing', label: 'Doing', color: '#F59E0B' },
        { value: 'review', label: 'In Review', color: '#EF4444' }
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low', color: '#10B981' },
        { value: 'medium', label: 'Medium', color: '#F59E0B' },
        { value: 'high', label: 'High', color: '#EF4444' }
    ];

    const categoryOptions = [
        { value: 'General', label: 'General' },
        { value: 'Design', label: 'Design' },
        { value: 'Development', label: 'Development' },
        { value: 'Research', label: 'Research' },
        { value: 'Marketing', label: 'Marketing' }
    ];

    const toggleFilter = (type, value) => {
        const newFilters = { ...filters };
        const index = newFilters[type].indexOf(value);

        if (index > -1) {
            newFilters[type].splice(index, 1);
        } else {
            newFilters[type].push(value);
        }

        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters = {
            search: '',
            statuses: [],
            priorities: [],
            categories: [],
            assignees: []
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    const handleSearchChange = (value) => {
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const activeFilterCount =
        filters.statuses.length +
        filters.priorities.length +
        filters.categories.length +
        filters.assignees.length +
        (filters.search ? 1 : 0);

    return (
        <div style={{ marginBottom: 20 }}>
            {/* Filter Bar Header */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                {/* Search */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <FiSearch style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        opacity: 0.5
                    }} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="glass-input"
                        style={{
                            paddingLeft: 40,
                            width: '100%'
                        }}
                    />
                </div>

                {/* Filter Toggle Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="glass-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        position: 'relative'
                    }}
                >
                    <FiFilter />
                    Filters
                    {activeFilterCount > 0 && (
                        <span style={{
                            background: '#3B82F6',
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}>
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="glass-btn"
                        style={{ color: '#EF4444' }}
                    >
                        <FiX /> Clear
                    </button>
                )}
            </div>

            {/* Filter Options Panel */}
            {showFilters && (
                <div className="glass-card" style={{
                    padding: 20,
                    borderRadius: 12,
                    marginTop: 12
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                        {/* Status Filter */}
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                                Status
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {statusOptions.map(option => (
                                    <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.statuses.includes(option.value)}
                                            onChange={() => toggleFilter('statuses', option.value)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{
                                            fontSize: '0.85rem',
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: `${option.color}15`,
                                            color: option.color,
                                            fontWeight: 500
                                        }}>
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                                Priority
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {priorityOptions.map(option => (
                                    <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.priorities.includes(option.value)}
                                            onChange={() => toggleFilter('priorities', option.value)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{
                                            fontSize: '0.85rem',
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: `${option.color}15`,
                                            color: option.color,
                                            fontWeight: 500
                                        }}>
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-secondary)' }}>
                                Category
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {categoryOptions.map(option => (
                                    <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.categories.includes(option.value)}
                                            onChange={() => toggleFilter('categories', option.value)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.85rem' }}>
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskFilterBar;
