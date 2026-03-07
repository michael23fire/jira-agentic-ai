import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpaces } from '../context/SpaceContext';
import { CreateSpaceModal } from '../components/CreateSpaceModal';
import { USERS } from '../context/UserContext';
import './SpacesList.css';

export function SpacesList() {
  const navigate = useNavigate();
  const { spaces, setCurrentSpace } = useSpaces();
  const [showCreate, setShowCreate] = useState(false);

  function handleSelectSpace(space: typeof spaces[number]) {
    setCurrentSpace(space);
    navigate('/board');
  }

  return (
    <div className="sl-page">
      <div className="sl-header">
        <h1 className="sl-header__title">Spaces</h1>
        <button
          type="button"
          className="sl-header__create"
          onClick={() => setShowCreate(true)}
        >
          + Create Space
        </button>
      </div>

      <div className="sl-grid">
        {spaces.map((space) => {
          const members = USERS.filter((u) => space.members.includes(u.id));
          return (
            <button
              key={space.id}
              type="button"
              className="sl-card"
              onClick={() => handleSelectSpace(space)}
            >
              <div className="sl-card__icon" style={{ background: space.color }}>
                {space.name.charAt(0).toUpperCase()}
              </div>
              <div className="sl-card__info">
                <div className="sl-card__name">{space.name}</div>
                <div className="sl-card__key">{space.key}</div>
              </div>
              <div className="sl-card__members">
                {members.slice(0, 3).map((u) => (
                  <span
                    key={u.id}
                    className="sl-card__avatar"
                    style={{ background: u.avatarColor }}
                    title={u.name}
                  >
                    {u.name.charAt(0)}
                  </span>
                ))}
                {members.length > 3 && (
                  <span className="sl-card__avatar sl-card__avatar--more">
                    +{members.length - 3}
                  </span>
                )}
                {members.length === 0 && (
                  <span className="sl-card__no-members">No members</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showCreate && <CreateSpaceModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
