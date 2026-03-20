import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../context/UserContext';

export function Login() {
  const { login, users, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(username.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate(from, { replace: true });
    }
  }

  function handleQuickLogin(user: { username: string }) {
    setUsername(user.username);
    setPassword('123');
    setError(null);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0052CC" />
            <path d="M10 22L16 10l6 12H10z" fill="#fff" />
          </svg>
          <h1 className="login-title">Jira</h1>
        </div>
        <p className="login-subtitle">Log in to continue</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username" className="login-label">Username</label>
            <input
              id="username"
              className="login-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label htmlFor="password" className="login-label">Password</label>
            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button
            type="submit"
            className="login-submit"
            disabled={loading || !username.trim() || !password}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="login-divider">
          <span>or quick login as</span>
        </div>

        <div className="login-quick-users">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`login-quick-user ${username === u.username ? 'login-quick-user--selected' : ''}`}
              onClick={() => handleQuickLogin(u)}
            >
              <span className="login-quick-avatar" style={{ background: u.avatarColor }}>
                {u.name.charAt(0)}
              </span>
              <span className="login-quick-name">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
