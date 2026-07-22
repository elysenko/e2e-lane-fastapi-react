import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../lib/session';

export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      setError('Choose a username and a password of at least 6 characters.');
      return;
    }
    // Mockup: service agent wires POST /api/auth/signup. First signup gets ADMIN role.
    signIn('user', username.trim());
    navigate('/tasks');
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
          <label htmlFor="su">Username</label>
          <input id="su" className="input" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="signup-username" />
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
        <button type="submit" className="btn btn-primary btn-block" data-testid="signup-submit">
          Create account
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
