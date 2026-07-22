import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    // Mockup: service agent wires POST /api/auth/login and stores the JWT.
    signIn('user', username.trim());
    navigate('/tasks');
  }

  return (
    <section className="auth-wrap" data-testid="login-page">
      <div className="page-head">
        <div>
          <h1>Welcome back</h1>
          <p className="page-sub">Sign in to manage your tasks.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={onSubmit} noValidate data-testid="login-form">
        <div className="field">
          <label htmlFor="u">Username</label>
          <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="login-username" />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input id="p" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
        </div>
        {error && (
          <span className="field-error" role="alert">
            {error}
          </span>
        )}
        <button type="submit" className="btn btn-primary btn-block" data-testid="login-submit">
          Sign in
        </button>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
        <p className="auth-switch">
          <Link to="/admin/login">Admin sign in</Link>
        </p>
      </form>
    </section>
  );
}
