import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import '../pages/Board.css';

const PROJECT_NAME = 'Agentic AI Sprint management';

const TABS = [
  { path: '/summary', label: 'Summary' },
  { path: '/backlog', label: 'Backlog' },
  { path: '/board', label: 'Board' },
  { path: '/code', label: 'Code' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/pages', label: 'Pages' },
  { path: '/forms', label: 'Forms' },
];

export function JiraLayout() {
  return (
    <div className="jira-layout">
      <TopNav />
      <Sidebar />
      <main className="jira-main">
        <h1 className="jira-project-title">{PROJECT_NAME}</h1>
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
