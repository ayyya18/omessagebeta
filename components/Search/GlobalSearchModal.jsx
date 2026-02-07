import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiFile, FiFolder, FiMessageCircle, FiCheckSquare } from 'react-icons/fi';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const GlobalSearchModal = ({ show, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filters, setFilters] = useState({
        type: 'all', // all, tasks, projects, files, comments
        workspace: null
    });
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Focus input when modal opens
    useEffect(() => {
        if (show && inputRef.current) {
            inputRef.current.focus();
        }
    }, [show]);

    // Perform search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const debounceTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, filters]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const allResults = [];

            // TODO: Implement actual Firestore search
            // This is a simplified version - in production, use Algolia or similar
            // For now, we'll just show placeholder results

            if (filters.type === 'all' || filters.type === 'tasks') {
                allResults.push({
                    id: '1',
                    type: 'task',
                    title: `Task matching "${searchQuery}"`,
                    description: 'Sample task description',
                    icon: <FiCheckSquare />
                });
            }

            if (filters.type === 'all' || filters.type === 'projects') {
                allResults.push({
                    id: '2',
                    type: 'project',
                    title: `Project matching "${searchQuery}"`,
                    description: 'Sample project',
                    icon: <FiFolder />
                });
            }

            setResults(allResults);
        } catch (err) {
            console.error('Search error:', err);
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleResultClick = (result) => {
        // Navigate based on result type
        if (result.type === 'task' || result.type === 'project') {
            navigate('/workspace');
        }
        onClose();
    };

    if (!show) return null;

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
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '10vh',
                zIndex: 10000
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: 600,
                    background: 'var(--bg-secondary)',
                    borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                }}
            >
                {/* Search Input */}
                <div style={{
                    padding: 20,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <FiSearch size={20} style={{ opacity: 0.6 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tasks, projects, files..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.1rem'
                        }}
                    />
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    gap: 8
                }}>
                    {['all', 'tasks', 'projects', 'files'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilters({ ...filters, type })}
                            style={{
                                padding: '6px 12px',
                                background: filters.type === type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 6,
                                color: filters.type === type ? '#3B82F6' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                textTransform: 'capitalize'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div style={{
                    maxHeight: 400,
                    overflowY: 'auto'
                }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto' }}>Searching...</div>
                        </div>
                    ) : results.length === 0 && searchQuery.trim() ? (
                        <div style={{
                            padding: 40,
                            textAlign: 'center',
                            opacity: 0.5
                        }}>
                            <FiSearch size={48} style={{ margin: '0 auto 16px' }} />
                            <p>No results found for "{searchQuery}"</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{
                            padding: 40,
                            textAlign: 'center',
                            opacity: 0.5
                        }}>
                            <FiSearch size={48} style={{ margin: '0 auto 16px' }} />
                            <p>Type to search...</p>
                            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select
                            </p>
                        </div>
                    ) : (
                        results.map((result, index) => (
                            <div
                                key={result.id}
                                onClick={() => handleResultClick(result)}
                                style={{
                                    padding: '16px 20px',
                                    background: index === selectedIndex ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div style={{ fontSize: 20, opacity: 0.7 }}>
                                    {result.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                        {result.title}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                                        {result.description}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    opacity: 0.5,
                                    textTransform: 'capitalize'
                                }}>
                                    {result.type}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    opacity: 0.5
                }}>
                    <span>
                        <kbd>Esc</kbd> to close
                    </span>
                    <span>
                        {results.length} result{results.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;
