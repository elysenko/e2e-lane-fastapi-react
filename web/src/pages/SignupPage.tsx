import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, type Role } from '../lib/session';
import { api, ApiError } from '../lib/api';

interface AuthResponse {
  token: string;
  user: { id: number; email: string; role: string; name: string };
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError('Choose an email and a password of at least 6 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      localStorage.setItem('token', res.token);
      const role = (res.user.role.toLowerCase() === 'admin' ? 'admin' : 'user') as Exclude<Role, null>;
      signIn(role, res.user.name || res.user.email);
      navigate('/tasks');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('That email is already registered.');
      } else {
        setError('Could not create your account. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-wrap" data-testid="signup-page">
      <div className="page-head">
        <div>
          <h1>Create your account</h1>
          <p className="page-sub">It only takes a moment.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={onSubmit} noValidate data-testid="signup-form">
        <div className="field">
          <label htmlFor="su">Email</label>
          <input id="su" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="signup-username" />
        </div>
        <div className="field">
          <label htmlFor="sp">Password</label>
          <input id="sp" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="signup-password" />
        </div>
        {error && (
          <span className="field-error" role="alert">
            {error}
          </span>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting} data-testid="signup-submit">
          {submitting ? 'Creating…' : 'Create account'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
