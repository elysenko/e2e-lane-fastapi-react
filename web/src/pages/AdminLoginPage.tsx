import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/session';
import { api } from '../lib/api';

interface TokenOut {
  token: string;
  role: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter the admin username and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api<TokenOut>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      localStorage.setItem('token', res.token);
      signIn('admin', username.trim());
      navigate('/admin/settings');
    } catch {
      setError('Invalid admin credentials.');
      setSubmitting(false);
    }
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
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
          data-testid="admin-login-submit"
        >
          {submitting ? 'Signing in…' : 'Sign in as admin'}
        </button>
      </form>
    </section>
  );
}
