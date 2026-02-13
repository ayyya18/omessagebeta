import React from 'react';
import { FiUsers, FiUser } from 'react-icons/fi';

export default function Avatar({ src, alt, size = 44, isGroup = false }) {
  const placeholder = isGroup ? (
    <FiUsers size={size * 0.5} />
  ) : (
    <FiUser size={size * 0.5} />
  );

  return (
    <div className="avatar-container" style={{ width: `${size}px`, height: `${size}px` }}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">{placeholder}</div>
      )}
    </div>
  );
}
