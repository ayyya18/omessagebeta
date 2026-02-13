import React, { useState } from 'react';
import { FiFile, FiImage, FiMusic, FiVideo, FiDownload, FiTrash2, FiPlus, FiFolder } from 'react-icons/fi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

const WorkspaceFiles = () => {
    const { currentUser } = useAuth();
    const { currentWorkspace, files, uploadFile } = useWorkspace();
    const [isUploading, setIsUploading] = useState(false);

    // Mock Upload Form State
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState('doc'); // doc, image, other

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!fileName) return;

        // Mock Data - In real app, this would upload to Storage
        await uploadFile(currentWorkspace.id, {
            name: fileName,
            type: fileType,
            size: '2.5 MB', // Mock size
            url: '#'
        });
        setFileName('');
        setIsUploading(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'image': return <FiImage />;
            case 'video': return <FiVideo />;
            case 'audio': return <FiMusic />;
            default: return <FiFile />;
        }
    };

    return (
        <div className="workspace-files-container" style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>File Library</h3>
                <button className="glass-btn primary small" onClick={() => setIsUploading(!isUploading)}>
                    <FiPlus style={{ marginRight: 6 }} /> Upload File
                </button>
            </div>

            {isUploading && (
                <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
                    <h4>Upload New File (Mock)</h4>
                    <form onSubmit={handleUpload} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>File Name</label>
                            <input
                                className="glass-input"
                                value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                placeholder="e.g. ProjectSpec.pdf"
                                autoFocus
                            />
                        </div>
                        <div style={{ width: 150 }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Type</label>
                            <select className="glass-input" value={fileType} onChange={e => setFileType(e.target.value)}>
                                <option value="doc">Document</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        <button type="submit" className="glass-btn primary">Upload</button>
                    </form>
                </div>
            )}

            <div className="files-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {files.map(file => (
                    <div key={file.id} className="file-card glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                        <div className="file-icon" style={{
                            width: 60, height: 60,
                            background: file.type === 'image' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                            color: file.type === 'image' ? '#10B981' : '#3B82F6',
                            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                            marginBottom: 12
                        }}>
                            {getIcon(file.type)}
                        </div>
                        <h4 style={{ fontSize: '0.95rem', margin: '0 0 4px 0', wordBreak: 'break-word' }}>{file.name}</h4>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{file.size} • {new Date(file.createdAt).toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 4 }}>By {file.uploaderName?.split(' ')[0]}</span>

                        <a href={file.url} className="glass-btn icon-only small" style={{ position: 'absolute', top: 8, right: 8, opacity: 0.5 }}>
                            <FiDownload />
                        </a>
                    </div>
                ))}
                {files.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.6, padding: 40 }}>
                        <FiFolder size={40} style={{ marginBottom: 16 }} />
                        <p>No files uploaded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceFiles;
