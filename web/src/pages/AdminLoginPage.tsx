import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/session';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter the admin username and password.');
      return;
    }
    // Mockup: service agent wires POST /api/admin/login and stores the returned JWT.
    signIn('admin', username.trim());
    navigate('/admin/settings');
  }

  return (
    <section className="auth-wrap" data-testid="admin-login-page">
      <div className="page-head">
        <div>
          <h1>Admin sign in</h1>
          <p className="page-sub">Restricted access for administrators.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={onSubmit} noValidate data-testid="admin-login-form">
        <div className="notice">🔒 This area is limited to admin accounts.</div>
        <div className="field">
          <label htmlFor="au">Username</label>
          <input id="au" className="input" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="admin-username" />
        </div>
        <div className="field">
          <label htmlFor="ap">Password</label>
          <input id="ap" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="admin-password" />
        </div>
        {error && (
          <span className="field-error" role="alert">
            {error}
          </span>
        )}
        <button type="submit" className="btn btn-primary btn-block" data-testid="admin-login-submit">
          Sign in as admin
        </button>
      </form>
    </section>
  );
}
