import { useState, useMemo } from 'react';
import { useSpaces } from '../context/SpaceContext';
import { USERS } from '../context/UserContext';

interface Props {
  spaceId: string;
  onClose: () => void;
}

export function AddPeopleModal({ spaceId, onClose }: Props) {
  const { spaces, addMember, removeMember } = useSpaces();
  const space = spaces.find((s) => s.id === spaceId);
  const [search, setSearch] = useState('');

  if (!space) return null;

  const isMember = (userId: string) => space.members.includes(userId);

  const toggle = (userId: string) => {
    if (isMember(userId)) {
      removeMember(space.id, userId);
    } else {
      addMember(space.id, userId);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return USERS;
    return USERS.filter((u) => u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            Manage People — {space.name}
          </h2>
          <button type="button" className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__form">
          <input
            type="search"
            className="modal__input"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            {space.members.length} member{space.members.length !== 1 ? 's' : ''}
            {search && ` · ${filteredUsers.length} result${filteredUsers.length !== 1 ? 's' : ''}`}
          </p>
          <div className="people-list">
            {filteredUsers.length === 0 && (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem 0', margin: 0 }}>
                No users found for "{search}"
              </p>
            )}
            {filteredUsers.map((user) => {
              const active = isMember(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`people-list__item ${active ? 'people-list__item--active' : ''}`}
                  onClick={() => toggle(user.id)}
                >
                  <span
                    className="people-list__avatar"
                    style={{ background: user.avatarColor }}
                  >
                    {user.name.charAt(0)}
                  </span>
                  <span className="people-list__name">{user.name}</span>
                  <span className="people-list__badge">
                    {active ? 'Remove' : 'Add'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="modal__footer">
            <button type="button" className="modal__btn modal__btn--confirm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
