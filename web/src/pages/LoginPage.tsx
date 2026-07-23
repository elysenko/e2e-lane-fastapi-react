import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, type Role } from '../lib/session';
import { api } from '../lib/api';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; role: string; name: string };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      localStorage.setItem('token', res.token);
      const role = (res.user.role.toLowerCase() === 'admin' ? 'admin' : 'user') as Exclude<Role, null>;
      signIn(role, res.user.name || res.user.email);
      navigate('/tasks');
    } catch {
      setError('Invalid email or password.');
      setSubmitting(false);
    }
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
          <label htmlFor="u">Email</label>
          <input id="u" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-username" />
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
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting} data-testid="login-submit">
          {submitting ? 'Signing in…' : 'Sign in'}
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
