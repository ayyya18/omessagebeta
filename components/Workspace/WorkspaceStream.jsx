import React, { useState } from 'react';
import { FiSend, FiPaperclip, FiMoreVertical, FiEdit2, FiTrash2, FiMapPin, FiMessageSquare, FiX } from 'react-icons/fi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

const WorkspaceStream = () => {
    const { currentUser } = useAuth();
    const { currentWorkspace, posts, createPost, editPost, deletePost, togglePinPost, addComment } = useWorkspace();
    const [newPostContent, setNewPostContent] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [menuOpenPostId, setMenuOpenPostId] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const [commentText, setCommentText] = useState({});

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        await createPost(currentWorkspace.id, newPostContent);
        setNewPostContent('');
    };

    const handleEditSubmit = async (postId) => {
        if (!editingContent.trim()) return;
        await editPost(currentWorkspace.id, postId, editingContent);
        setEditingPostId(null);
        setEditingContent('');
    };

    const handleDelete = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            await deletePost(currentWorkspace.id, postId);
        }
    };

    const handlePin = async (postId, isPinned) => {
        await togglePinPost(currentWorkspace.id, postId, isPinned);
        setMenuOpenPostId(null);
    };

    const startEdit = (post) => {
        setEditingPostId(post.id);
        setEditingContent(post.content);
        setMenuOpenPostId(null);
    };

    const cancelEdit = () => {
        setEditingPostId(null);
        setEditingContent('');
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleCommentSubmit = async (postId) => {
        const text = commentText[postId];
        if (!text?.trim()) return;
        await addComment(currentWorkspace.id, postId, text);
        setCommentText(prev => ({ ...prev, [postId]: '' }));
    };

    const isAdmin = currentWorkspace?.members?.find(m => m.uid === currentUser?.uid)?.role === 'admin';

    // Sort posts: pinned first, then by date
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="workspace-stream" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
            {/* Post Input */}
            <div className="post-input-card glass-card" style={{
                padding: 20,
                marginBottom: 30,
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div className="user-avatar" style={{ background: '#3B82F6', flexShrink: 0 }}>
                        {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                    <form onSubmit={handlePostSubmit} style={{ flex: 1 }}>
                        <textarea
                            className="glass-input"
                            placeholder="Announce something to your team..."
                            rows={3}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            style={{ width: '100%', resize: 'none', marginBottom: 12 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button type="button" className="glass-btn icon-only" title="Attach file (coming soon)">
                                <FiPaperclip />
                            </button>
                            <button type="submit" className="glass-btn primary" disabled={!newPostContent.trim()}>
                                <FiSend style={{ marginRight: 8 }} /> Post
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Posts List */}
            <div className="posts-list">
                {sortedPosts.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.6, padding: 40 }}>
                        <FiMessageSquare size={40} style={{ marginBottom: 16 }} />
                        <h3>No posts yet</h3>
                        <p>Be the first to share something!</p>
                    </div>
                )}

                {sortedPosts.map(post => (
                    <div
                        key={post.id}
                        className="post-card glass-card"
                        style={{
                            padding: 20,
                            marginBottom: 20,
                            position: 'relative',
                            border: post.pinned ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            background: post.pinned ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent)' : undefined,
                            borderRadius: 16,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Pinned Badge */}
                        {post.pinned && (
                            <div style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3B82F6',
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                <FiMapPin size={12} /> Pinned
                            </div>
                        )}

                        <div className="post-header" style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div className="user-avatar" style={{ background: '#8B5CF6', flexShrink: 0 }}>
                                {post.authorName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, marginBottom: 4 }}>{post.authorName}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {post.editedAt && <span style={{ fontStyle: 'italic', marginLeft: 8 }}>(edited)</span>}
                                </span>
                            </div>

                            {/* Post Menu */}
                            {(post.authorId === currentUser?.uid || isAdmin) && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="glass-btn icon-only small"
                                        onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                                    >
                                        <FiMoreVertical />
                                    </button>

                                    {menuOpenPostId === post.id && (
                                        <div
                                            className="glass-card"
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '100%',
                                                marginTop: 4,
                                                padding: 8,
                                                minWidth: 150,
                                                zIndex: 10,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {post.authorId === currentUser?.uid && (
                                                <button
                                                    className="glass-btn small"
                                                    onClick={() => startEdit(post)}
                                                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                                                >
                                                    <FiEdit2 style={{ marginRight: 8 }} /> Edit
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    className="glass-btn small"
                                                    onClick={() => handlePin(post.id, post.pinned)}
                                                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                                                >
                                                    <FiMapPin style={{ marginRight: 8 }} /> {post.pinned ? 'Unpin' : 'Pin'}
                                                </button>
                                            )}
                                            {(post.authorId === currentUser?.uid || isAdmin) && (
                                                <button
                                                    className="glass-btn small"
                                                    onClick={() => handleDelete(post.id)}
                                                    style={{ width: '100%', justifyContent: 'flex-start', color: '#EF4444' }}
                                                >
                                                    <FiTrash2 style={{ marginRight: 8 }} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Post Content */}
                        {editingPostId === post.id ? (
                            <div style={{ marginBottom: 16 }}>
                                <textarea
                                    className="glass-input"
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', resize: 'none', marginBottom: 8 }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button className="glass-btn small" onClick={cancelEdit}>
                                        <FiX style={{ marginRight: 4 }} /> Cancel
                                    </button>
                                    <button
                                        className="glass-btn primary small"
                                        onClick={() => handleEditSubmit(post.id)}
                                        disabled={!editingContent.trim()}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="post-content" style={{ marginBottom: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {post.content}
                            </div>
                        )}

                        {/* Attachments (if any) */}
                        {post.attachments && post.attachments.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                {post.attachments.map((attachment, idx) => (
                                    <div key={idx} className="glass-card" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <FiPaperclip />
                                        <span style={{ flex: 1, fontSize: '0.9rem' }}>{attachment.name || 'Attachment'}</span>
                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="glass-btn small">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Post Footer */}
                        <div className="post-footer" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
                            <button
                                className="glass-btn small"
                                style={{ color: 'var(--text-secondary)' }}
                                onClick={() => toggleComments(post.id)}
                            >
                                <FiMessageSquare style={{ marginRight: 6 }} />
                                {post.comments?.length || 0} {post.comments?.length === 1 ? 'Comment' : 'Comments'}
                            </button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments[post.id] && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                                {/* Existing Comments */}
                                {post.comments && post.comments.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        {post.comments.map((comment) => (
                                            <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: '#10B981', flexShrink: 0 }}>
                                                    {comment.authorName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <strong style={{ fontSize: '0.9rem' }}>{comment.authorName}</strong>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Comment */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: '#3B82F6', flexShrink: 0 }}>
                                        {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                                        <input
                                            className="glass-input"
                                            placeholder="Write a comment..."
                                            value={commentText[post.id] || ''}
                                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleCommentSubmit(post.id);
                                                }
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="glass-btn primary small"
                                            onClick={() => handleCommentSubmit(post.id)}
                                            disabled={!commentText[post.id]?.trim()}
                                        >
                                            <FiSend />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkspaceStream;
