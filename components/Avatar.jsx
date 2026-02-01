import React from 'react';
import { FiUsers } from 'react-icons/fi';

export default function Avatar({ src, alt, size = 44, isGroup = false }) {
  const placeholder = isGroup ? (
    <FiUsers size={size * 0.6} />
  ) : (
    (alt && alt[0] && alt[0].toUpperCase()) || '?'
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
