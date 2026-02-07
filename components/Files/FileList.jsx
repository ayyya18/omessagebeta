import React, { useState, useEffect } from 'react';
import { FiDownload, FiTrash2, FiFile, FiImage, FiFileText, FiVideo, FiMusic, FiGrid, FiList } from 'react-icons/fi';
import { useFileStorage } from '../../context/FileStorageContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistance } from 'date-fns';

const FileList = ({ workspaceId, projectId, taskId = null }) => {
    const { getProjectFiles, getTaskFiles, deleteFile } = useFileStorage();
    const { currentUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [filter, setFilter] = useState('all'); // all, images, documents, videos, audio

    useEffect(() => {
        loadFiles();
    }, [workspaceId, projectId, taskId]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const filesData = taskId
                ? await getTaskFiles(workspaceId, projectId, taskId)
                : await getProjectFiles(workspaceId, projectId);
            setFiles(filesData);
        } catch (err) {
            console.error('Error loading files:', err);
        }
        setLoading(false);
    };

    const handleDelete = async (fileId, storagePath) => {
        if (!window.confirm('Delete this file?')) return;

        try {
            await deleteFile(workspaceId, projectId, fileId, storagePath);
            await loadFiles(); // Refresh list
        } catch (err) {
            console.error('Error deleting file:', err);
            alert('Failed to delete file');
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) return <FiImage size={24} color="#3B82F6" />;
        if (mimeType.startsWith('video/')) return <FiVideo size={24} color="#8B5CF6" />;
        if (mimeType.startsWith('audio/')) return <FiMusic size={24} color="#10B981" />;
        if (mimeType.includes('pdf') || mimeType.includes('document')) return <FiFileText size={24} color="#F59E0B" />;
        return <FiFile size={24} color="#6B7280" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    const filteredFiles = files.filter(file => {
        if (filter === 'all') return true;
        if (filter === 'images') return file.type.startsWith('image/');
        if (filter === 'documents') return file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
        if (filter === 'videos') return file.type.startsWith('video/');
        if (filter === 'audio') return file.type.startsWith('audio/');
        return true;
    });

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}>Loading files...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                {/* Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Files ({files.length})</option>
                    <option value="images">Images</option>
                    <option value="documents">Documents</option>
                    <option value="videos">Videos</option>
                    <option value="audio">Audio</option>
                </select>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: 8,
                            background: viewMode === 'grid' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            color: viewMode === 'grid' ? '#3B82F6' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                        title="Grid View"
                    >
                        <FiGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: 8,
                            background: viewMode === 'list' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            color: viewMode === 'list' ? '#3B82F6' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                        title="List View"
                    >
                        <FiList size={18} />
                    </button>
                </div>
            </div>

            {/* Files Display */}
            {filteredFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                    <FiFile size={48} style={{ margin: '0 auto 16px' }} />
                    <p>No files yet</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 16
                }}>
                    {filteredFiles.map(file => (
                        <div
                            key={file.id}
                            className="glass-card"
                            style={{
                                padding: 16,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                ':hover': { transform: 'translateY(-4px)' }
                            }}
                        >
                            {/* Thumbnail/Icon */}
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    style={{
                                        width: '100%',
                                        height: 120,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        marginBottom: 12
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: 120,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 8,
                                    marginBottom: 12
                                }}>
                                    {getFileIcon(file.type)}
                                </div>
                            )}

                            {/* File Info */}
                            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 12 }}>
                                {formatFileSize(file.size)}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a
                                    href={file.url}
                                    download={file.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        flex: 1,
                                        padding: '6px 12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: 6,
                                        color: '#3B82F6',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 4
                                    }}
                                >
                                    <FiDownload size={14} /> Download
                                </a>
                                {currentUser?.uid === file.uploaderId && (
                                    <button
                                        onClick={() => handleDelete(file.id, file.storagePath)}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: 6,
                                            color: '#EF4444',
                                            cursor: 'pointer'
                                        }}
                                        title="Delete"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredFiles.map(file => (
                        <div
                            key={file.id}
                            className="glass-card"
                            style={{
                                padding: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16
                            }}
                        >
                            {/* Icon */}
                            {getFileIcon(file.type)}

                            {/* File Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{file.name}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                                    {formatFileSize(file.size)} • Uploaded by {file.uploaderName} • {formatDistance(new Date(file.createdAt), new Date(), { addSuffix: true })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a
                                    href={file.url}
                                    download={file.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: 6,
                                        color: '#3B82F6',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <FiDownload size={16} /> Download
                                </a>
                                {currentUser?.uid === file.uploaderId && (
                                    <button
                                        onClick={() => handleDelete(file.id, file.storagePath)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: 6,
                                            color: '#EF4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <FiTrash2 size={16} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileList;
