import React, { useState, useCallback } from 'react';
import { FiUpload, FiX, FiFile, FiImage } from 'react-icons/fi';
import { useFileStorage } from '../../context/FileStorageContext';

const FileUploader = ({ workspaceId, projectId, taskId = null, onUploadComplete = null, maxSize = 10485760 }) => {
    const { uploadFile, uploadProgress } = useFileStorage();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFiles = async (files) => {
        setError('');

        for (const file of files) {
            // Validate size
            if (file.size > maxSize) {
                setError(`${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
                continue;
            }

            try {
                setUploading(true);
                const uploadedFile = await uploadFile(workspaceId, projectId, file, taskId);

                if (onUploadComplete) {
                    onUploadComplete(uploadedFile);
                }
            } catch (err) {
                console.error('Upload failed:', err);
                setError(err.message || 'Upload failed');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    }, []);

    const handleChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    return (
        <div>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 12,
                    padding: 32,
                    textAlign: 'center',
                    background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />

                <FiUpload size={48} style={{ margin: '0 auto 16px', opacity: 0.6 }} />

                <h4 style={{ marginBottom: 8 }}>
                    {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                </h4>

                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                    or click to browse (max {(maxSize / 1024 / 1024).toFixed(0)}MB per file)
                </p>

                {uploading && (
                    <div style={{ marginTop: 16 }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}>Uploading...</div>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    color: '#EF4444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setError('')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: 4
                        }}
                    >
                        <FiX />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
