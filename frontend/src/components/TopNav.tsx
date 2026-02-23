export function TopNav() {
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
        <div className="top-nav__avatar" aria-hidden>U</div>
      </div>
    </header>
  );
}
