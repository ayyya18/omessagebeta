import React from 'react';
import { FiFile, FiTrash2, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function ChatBubble({ msg, isSent, onReplyClick }) {
  const { currentUser } = useAuth(); // Get current user

  if (!msg) return null;

  if (msg.isDeleted) {
    return (
      <div className={`chat-bubble deleted ${isSent ? 'sent' : 'received'}`}>
        <FiTrash2 size={14} /> <span>Pesan ini telah dihapus</span>
      </div>
    );
  }

  // Determine ticks status
  const renderTicks = () => {
    if (!isSent) return null; // Only show ticks for sent messages

    const isRead = msg.seenBy && msg.seenBy.length > 0;

    return (
      <span className={`message-status ${isRead ? 'read' : 'sent'}`}>
        <FiCheck size={14} className="tick-1" />
        <FiCheck size={14} className="tick-2" />
      </span>
    );
  };

  const renderContent = () => {
    switch (msg.fileType) {
      case 'image':
        return (
          <div>
            <img src={msg.fileURL} alt={msg.fileName || 'Gambar'} className="message-image" />
            {msg.text && <p className="message-text caption">{msg.text}</p>}
          </div>
        );
      case 'video':
        return (
          <div>
            <video src={msg.fileURL} controls className="message-video" />
            {msg.text && <p className="message-text caption">{msg.text}</p>}
          </div>
        );
      case 'raw':
      case 'auto':
        return (
          <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="message-file">
            <FiFile size={20} /> <span>{msg.fileName || 'File Terlampir'}</span>
          </a>
        );
      default:
        return <p className="message-text">{msg.text}</p>;
    }
  };

  return (
    <div className={`chat-bubble ${isSent ? 'sent' : 'received'} ${msg.replyingTo ? 'has-reply-bubble' : ''}`}>
      {msg.forwardedFrom && <div className="forwarded-label">Diteruskan dari {msg.forwardedFrom}</div>}
      {msg.replyingTo && (
        <div
          className="reply-quote"
          onClick={(e) => {
            e.stopPropagation();
            if (onReplyClick) onReplyClick(msg.replyingTo.messageId);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="reply-quote-sender">{msg.replyingTo.senderName}</div>
          <div className="reply-quote-text">{msg.replyingTo.textSnippet}</div>
        </div>
      )}
      {renderContent()}
      <div className="bubble-meta">
        <span className="message-time">
          {msg.createdAt?.seconds ? new Date(msg.createdAt.toDate()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
        </span>
        {isSent && renderTicks()}
      </div>
    </div>
  );
}
