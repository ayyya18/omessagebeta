import React from 'react';
import { FiFile, FiTrash2, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext'; // Import useAuth to detect self

export default function ChatBubble({ msg, isSent }) {
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

    // Check if seen by anyone other than sender (simplified logic)
    // In a real app, you'd check if specific recipients have seen it
    const isSeen = msg.seenBy && msg.seenBy.length > 1; // Assuming arrayUnion adds current user too, or logic in ChatHome handles it. 
    // Actually ChatHome logic: msg.senderId !== currentUser.uid -> update seenBy. 
    // So if seenBy has entries, it means someone saw it? 
    // Let's assume seenBy field exists and has length > 0 means seen.
    // Ideally seenBy contains recipient UIDs.

    const isRead = msg.seenBy && msg.seenBy.length > 0;

    return (
      <span className={`message-status ${isRead ? 'read' : 'sent'}`}>
        <FiCheck size={14} className="tick-1" />
        <FiCheck size={14} className="tick-2" />
      </span>
    );
  };

  const renderContent = () => {
    // ... (content rendering remains same, but we can reuse the switch)
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
    <div className={`chat-bubble ${isSent ? 'sent' : 'received'}`}>
      {msg.forwardedFrom && <div className="forwarded-label">Diteruskan dari {msg.forwardedFrom}</div>}
      {msg.replyingTo && (
        <div className="reply-quote">
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
