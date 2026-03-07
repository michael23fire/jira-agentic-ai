import { Outlet, NavLink, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useSpaces } from '../context/SpaceContext';
import '../pages/Board.css';

const TABS = [
  { path: '/summary', label: 'Summary' },
  { path: '/backlog', label: 'Backlog' },
  { path: '/board', label: 'Board' },
  { path: '/code', label: 'Code' },
  { path: '/timeline', label: 'Timeline' },
];

export function JiraLayout() {
  const { currentSpace } = useSpaces();

  return (
    <div className="jira-layout">
      <TopNav />
      <Sidebar />
      <main className="jira-main">
        <Link to="/spaces" className="jira-project-header">
          <span
            className="jira-project-dot"
            style={{ background: currentSpace.color }}
          />
          <h1 className="jira-project-title">{currentSpace.name}</h1>
          <span className="jira-project-key">{currentSpace.key}</span>
        </Link>
        <nav className="jira-tabs" aria-label="Project views">
          {TABS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `jira-tab ${isActive ? 'jira-tab--active' : ''}`}
              end={path === '/board'}
            >
              {label}
            </NavLink>
          ))}
          <button type="button" className="jira-tab jira-tab--add" aria-label="Add view">
            +
          </button>
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
