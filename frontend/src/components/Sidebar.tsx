const PROJECT_NAME = 'Agentic AI Sprint management';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <a href="#for-you" className="sidebar__link">For you</a>
        <a href="#spaces" className="sidebar__link">Spaces</a>
        <a href="#recent" className="sidebar__link">Recent</a>
      </nav>
      <div className="sidebar__recent">
        <span className="sidebar__recent-label">Recent</span>
        <a href="#project" className="sidebar__project sidebar__project--active">
          {PROJECT_NAME}
        </a>
      </div>
      <a href="#more" className="sidebar__link sidebar__link--secondary">More spaces</a>
    </aside>
  );
}
