import React, { useRef, useState } from 'react';
import { FiMapPin, FiArchive, FiTrash2, FiMoreHorizontal } from 'react-icons/fi';
import Avatar from './Avatar';
import ContextMenu from './ContextMenu';

export default function ChatListItem({ chatId, chatInfo, isActive, onSelect, onTogglePin, onToggleArchive, onDelete }) {
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const moreBtnRef = useRef(null);

  const displayName = chatInfo.userInfo?.displayName || '';
  const lastText = chatInfo.lastMessage?.text || '';

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const menuActions = [
    {
      label: chatInfo.isPinned ? "Unpin Chat" : "Pin Chat",
      icon: <FiMapPin />,
      onClick: () => onTogglePin(chatId, chatInfo)
    },
    {
      label: chatInfo.isArchived ? "Unarchive" : "Archive",
      icon: <FiArchive />,
      onClick: () => onToggleArchive(chatId, chatInfo)
    },
    {
      label: "Delete Chat",
      icon: <FiTrash2 />,
      variant: "danger",
      onClick: () => onDelete(chatId, chatInfo)
    }
  ];

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = moreBtnRef.current.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      x: rect.right - 150, // Align slightly to the left of the button
      y: rect.bottom + 5
    });
  };

  return (
    <>
      <div
        className={`chat-item ${isActive ? 'active' : ''} ${chatInfo.isPinned ? 'pinned' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(chatInfo)}
        onContextMenu={handleContextMenu}
      >
        <Avatar src={chatInfo.userInfo.photoURL} alt={displayName} isGroup={chatInfo.isGroup} />

        <div className="chat-info">
          <div className="chat-info-top">
            <span className="chat-name">{displayName}</span>
            {chatInfo.isPinned && <FiMapPin size={12} className="pin-indicator" />}
          </div>
          <p className="chat-last-msg">{lastText}</p>
        </div>

        {/* 3-dot menu button for mouse users who don't right click */}
        <button
          ref={moreBtnRef}
          className="chat-item-more-btn"
          onClick={handleMoreClick}
          aria-label="More options"
        >
          <FiMoreHorizontal />
        </button>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        actions={menuActions}
      />
    </>
  );
}
