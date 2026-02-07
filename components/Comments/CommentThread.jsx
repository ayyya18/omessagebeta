import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiX, FiEdit2, FiTrash2, FiCheck, FiMessageCircle } from 'react-icons/fi';
import { useComments } from '../../context/CommentsContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistance } from 'date-fns';

const CommentThread = ({ workspaceId, projectId, taskId, taskTitle }) => {
    const { getComments, addComment, editComment, deleteComment, toggleReaction, resolveComment, subscribeToComments, unsubscribeFromComments } = useComments();
    const { currentUser } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const comments = getComments(workspaceId, projectId, taskId);

    // Subscribe to comments on mount
    useEffect(() => {
        if (workspaceId && projectId && taskId) {
            subscribeToComments(workspaceId, projectId, taskId);
        }

        return () => {
            if (workspaceId && projectId && taskId) {
                unsubscribeFromComments(workspaceId, projectId, taskId);
            }
        };
    }, [workspaceId, projectId, taskId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addComment(workspaceId, projectId, taskId, newComment, taskTitle);
            setNewComment('');
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
        setIsSubmitting(false);
    };

    const handleEdit = async (commentId) => {
        if (!editText.trim()) return;

        try {
            await editComment(workspaceId, projectId, taskId, commentId, editText);
            setEditingId(null);
            setEditText('');
        } catch (err) {
            console.error('Error editing comment:', err);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await deleteComment(workspaceId, projectId, taskId, commentId);
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleReaction = async (commentId, emoji) => {
        try {
            await toggleReaction(workspaceId, projectId, taskId, commentId, emoji);
        } catch (err) {
            console.error('Error toggling reaction:', err);
        }
    };

    const handleResolve = async (commentId, currentResolved) => {
        try {
            await resolveComment(workspaceId, projectId, taskId, commentId, !currentResolved);
        } catch (err) {
            console.error('Error resolving comment:', err);
        }
    };

    const commonEmojis = ['👍', '❤️', '😊', '🎉', '🚀', '👏'];

    return (
        <div style={{ padding: '20px 0' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiMessageCircle />
                Comments ({comments.length})
            </h3>

            {/* Comments List */}
            <div style={{ marginBottom: 24 }}>
                {comments.length === 0 ? (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: 20 }}>
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    comments.map(comment => (
                        <div
                            key={comment.id}
                            style={{
                                marginBottom: 16,
                                padding: 12,
                                background: comment.resolved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.1)',
                                opacity: comment.resolved ? 0.6 : 1
                            }}
                        >
                            {/* Comment Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <img
                                        src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}`}
                                        alt={comment.authorName}
                                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {comment.authorName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                            {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                                            {comment.editedAt && ' (edited)'}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {currentUser?.uid === comment.authorId && !comment.resolved && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditText(comment.text);
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                padding: 4
                                            }}
                                            title="Edit"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#EF4444',
                                                cursor: 'pointer',
                                                padding: 4
                                            }}
                                            title="Delete"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Comment Body */}
                            {editingId === comment.id ? (
                                <div style={{ marginBottom: 8 }}>
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: 60,
                                            padding: 8,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8,
                                            color: 'var(--text-primary)',
                                            resize: 'vertical'
                                        }}
                                        autoFocus
                                    />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button
                                            onClick={() => handleEdit(comment.id)}
                                            style={{
                                                padding: '4px 12px',
                                                background: '#3B82F6',
                                                border: 'none',
                                                borderRadius: 6,
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditText('');
                                            }}
                                            style={{
                                                padding: '4px 12px',
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: 6,
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 8, lineHeight: 1.6 }}>
                                    {comment.text}
                                </div>
                            )}

                            {/* Reactions */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {Object.entries(comment.reactions || {}).map(([emoji, users]) => (
                                    users.length > 0 && (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(comment.id, emoji)}
                                            style={{
                                                padding: '4px 8px',
                                                background: users.includes(currentUser?.uid) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}
                                            title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                                        >
                                            {emoji} {users.length}
                                        </button>
                                    )
                                ))}

                                {/* Add Reaction */}
                                {!comment.resolved && (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleReaction(comment.id, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <option value="">+ React</option>
                                            {commonEmojis.map(emoji => (
                                                <option key={emoji} value={emoji}>{emoji}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Resolve Toggle */}
                                <button
                                    onClick={() => handleResolve(comment.id, comment.resolved)}
                                    style={{
                                        marginLeft: 'auto',
                                        padding: '4px 8px',
                                        background: comment.resolved ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        color: comment.resolved ? '#10B981' : 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    {comment.resolved ? <><FiCheck /> Resolved</> : 'Resolve'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <img
                        src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}`}
                        alt="You"
                        style={{ width: 36, height: 36, borderRadius: '50%', marginTop: 8 }}
                    />
                    <div style={{ flex: 1 }}>
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment... (Use @ to mention someone)"
                            style={{
                                width: '100%',
                                minHeight: 80,
                                padding: 12,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                color: 'var(--text-primary)',
                                resize: 'vertical',
                                fontSize: '0.95rem'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                            <small style={{ opacity: 0.6 }}>
                                Cmd/Ctrl + Enter to submit
                            </small>
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                style={{
                                    padding: '8px 16px',
                                    background: newComment.trim() ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: 'white',
                                    cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontWeight: 500,
                                    opacity: isSubmitting ? 0.5 : 1
                                }}
                            >
                                <FiSend size={16} />
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CommentThread;
