import React from 'react';
import { FiMapPin, FiArchive, FiTrash2 } from 'react-icons/fi';
import Avatar from './Avatar';

export default function ChatListItem({ chatId, chatInfo, isActive, onSelect, onTogglePin, onToggleArchive, onDelete }) {
  const displayName = chatInfo.userInfo?.displayName || '';
  const lastText = chatInfo.lastMessage?.text || '';

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(chatInfo);
    }
  };

  return (
    <div
      className={`chat-item ${isActive ? 'active' : ''} ${chatInfo.isPinned && !chatInfo.isArchived ? 'pinned' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Buka obrolan dengan ${displayName}`}
      aria-current={isActive ? 'true' : 'false'}
      onClick={() => onSelect(chatInfo)}
      onKeyDown={handleKey}
    >
      <div className="chat-item-actions">
        <button className={`chat-action-btn pin-btn ${chatInfo.isPinned ? 'active' : ''}`} title="Pin chat" aria-label={chatInfo.isPinned ? 'Lepas pin obrolan' : 'Pin obrolan'} onClick={(e) => { e.stopPropagation(); onTogglePin(chatId, chatInfo); }}>
          <FiMapPin size={14} />
        </button>
        <button className="chat-action-btn archive-btn" title="Archive chat" aria-label={chatInfo.isArchived ? 'Batalkan arsip' : 'Arsipkan obrolan'} onClick={(e) => { e.stopPropagation(); onToggleArchive(chatId, chatInfo); }}>
          <FiArchive size={14} />
        </button>
        <button className="chat-action-btn delete-chat-btn" title="Hapus chat" aria-label={`Hapus obrolan dengan ${displayName}`} onClick={(e) => { e.stopPropagation(); onDelete(chatId, chatInfo); }}>
          <FiTrash2 size={14} />
        </button>
      </div>

      <Avatar src={chatInfo.userInfo.photoURL} alt={displayName} isGroup={chatInfo.isGroup} />

      <div className="chat-info">
        <span className="chat-name">{displayName}</span>
        <p className="chat-last-msg">{lastText}</p>
      </div>
    </div>
  );
}
