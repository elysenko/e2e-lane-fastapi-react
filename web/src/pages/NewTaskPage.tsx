import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createTask } from '../lib/tasksStore';

export default function NewTaskPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Client validation: block empty titles — no request is fired.
    if (title.trim().length === 0) {
      setError('Please enter a title for your task.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createTask(title.trim());
      navigate('/tasks');
    } catch {
      setError('Something went wrong creating the task. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section data-testid="new-task-page">
      <div className="page-head">
        <div>
          <h1>Add Task</h1>
          <p className="page-sub">Give your task a clear, actionable title.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={onSubmit} noValidate data-testid="new-task-form">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            className={`input ${error ? 'err' : ''}`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Draft the release notes"
            autoFocus
            data-testid="title-input"
          />
          {error && (
            <span className="field-error" role="alert" data-testid="title-error">
              {error}
            </span>
          )}
        </div>

        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="create-btn">
            {submitting ? 'Creating…' : 'Create'}
          </button>
          <Link to="/tasks" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
