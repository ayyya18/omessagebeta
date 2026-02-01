import React from 'react';
import Avatar from './Avatar';

export default function GroupMemberList({ members = [], onRemove = () => {}, isAdmin = false }) {
  if (!members || members.length === 0) return <div className="no-members">Belum ada anggota</div>;
  return (
    <div className="group-member-list">
      {members.map(m => (
        <div key={m.uid} className="group-member-item">
          <Avatar src={m.photoURL} alt={m.displayName} size={36} />
          <div className="member-info">
            <div className="member-name">{m.displayName}</div>
            {m.handle && <div className="member-handle">{m.handle}</div>}
          </div>
          {isAdmin && m.uid !== (typeof window !== 'undefined' && window?.__CURRENT_USER_UID__) && (
            <button className="remove-member-btn" onClick={() => onRemove(m.uid)} aria-label={`Keluarkan ${m.displayName}`}>&times;</button>
          )}
        </div>
      ))}
    </div>
  );
}
