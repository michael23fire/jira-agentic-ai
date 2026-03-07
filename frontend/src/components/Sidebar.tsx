import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpaces } from '../context/SpaceContext';
import { CreateSpaceModal } from './CreateSpaceModal';
import { AddPeopleModal } from './AddPeopleModal';

export function Sidebar() {
  const navigate = useNavigate();
  const { spaces, currentSpace, setCurrentSpace } = useSpaces();
  const [showCreate, setShowCreate] = useState(false);
  const [peopleSpaceId, setPeopleSpaceId] = useState<string | null>(null);

  return (
    <>
      <aside className="sidebar">
        <nav className="sidebar__nav">
          <a href="#for-you" className="sidebar__link">For you</a>
          <a href="#recent" className="sidebar__link">Recent</a>
        </nav>

        <div className="sidebar__spaces-header">
          <span className="sidebar__section-label">Spaces</span>
          <button
            type="button"
            className="sidebar__add-space-btn"
            onClick={() => setShowCreate(true)}
            title="Create space"
          >
            +
          </button>
        </div>

        <div className="sidebar__space-list">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={`sidebar__space-item ${space.id === currentSpace.id ? 'sidebar__space-item--active' : ''}`}
            >
              <button
                type="button"
                className="sidebar__space-select"
                onClick={() => { setCurrentSpace(space); navigate('/board'); }}
              >
                <span
                  className="sidebar__space-dot"
                  style={{ background: space.color }}
                />
                <span className="sidebar__space-name">{space.name}</span>
              </button>
              <button
                type="button"
                className="sidebar__space-people-btn"
                onClick={() => setPeopleSpaceId(space.id)}
                title="Manage people"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="sidebar__link sidebar__link--secondary"
          onClick={() => setShowCreate(true)}
        >
          + Create space
        </button>
      </aside>

      {showCreate && <CreateSpaceModal onClose={() => setShowCreate(false)} />}
      {peopleSpaceId && (
        <AddPeopleModal
          spaceId={peopleSpaceId}
          onClose={() => setPeopleSpaceId(null)}
        />
      )}
    </>
  );
}
