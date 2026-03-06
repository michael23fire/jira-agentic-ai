import { useState, useRef, useEffect } from 'react';
import { useCurrentUser, USERS } from '../context/UserContext';

export function TopNav() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const initial = currentUser.name.charAt(0).toUpperCase();

  return (
    <header className="top-nav">
      <div className="top-nav__logo">Jira</div>
      <div className="top-nav__search">
        <input type="search" placeholder="Search" className="top-nav__search-input" aria-label="Search" />
      </div>
      <button type="button" className="top-nav__create">
        Create
      </button>
      <div className="top-nav__actions">
        <button type="button" className="top-nav__icon" aria-label="Notifications">
          <span aria-hidden>⌘</span>
        </button>
        <button type="button" className="top-nav__icon" aria-label="Settings">
          ⚙
        </button>

        {/* User avatar + dropdown */}
        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="top-nav__avatar"
            style={{ background: currentUser.avatarColor }}
            aria-label="User menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="user-menu__dropdown">
              <div className="user-menu__header">
                <div className="user-menu__current-avatar" style={{ background: currentUser.avatarColor }}>
                  {initial}
                </div>
                <div>
                  <div className="user-menu__name">{currentUser.name}</div>
                  <div className="user-menu__label">Logged in as</div>
                </div>
              </div>
              <div className="user-menu__divider" />
              <p className="user-menu__section-label">Switch account</p>
              {USERS.filter((u) => u.id !== currentUser.id).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="user-menu__item"
                  onClick={() => { setCurrentUser(user); setMenuOpen(false); }}
                >
                  <span className="user-menu__item-avatar" style={{ background: user.avatarColor }}>
                    {user.name.charAt(0)}
                  </span>
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
