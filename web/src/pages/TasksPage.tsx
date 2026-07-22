import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTasks, type Task } from '../lib/tasksStore';
import TaskRow from '../components/TaskRow';

type Status = 'loading' | 'ready' | 'error';

export default function TasksPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let alive = true;
    listTasks()
      .then((t) => {
        if (!alive) return;
        setTasks(t);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section data-testid="tasks-page">
      <div className="page-head">
        <div>
          <h1 data-testid="tasks-title">My Tasks</h1>
          <p className="page-sub">Everything on your plate, in one place.</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary" data-testid="add-task-btn">
          + Add Task
        </Link>
      </div>

      {status === 'loading' && (
        <ul className="task-list" data-testid="tasks-loading" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="skeleton" />
          ))}
        </ul>
      )}

      {status === 'error' && (
        <div className="error-banner" data-testid="tasks-error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>We couldn't load your tasks right now. Please try again in a moment.</span>
        </div>
      )}

      {status === 'ready' && tasks.length === 0 && (
        <div className="card state" data-testid="tasks-empty">
          <span className="emoji" aria-hidden="true">
            📝
          </span>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started.</p>
          <Link to="/tasks/new" className="btn btn-primary">
            + Add Task
          </Link>
        </div>
      )}

      {status === 'ready' && tasks.length > 0 && (
        <ul className="task-list" data-testid="tasks-list">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </section>
  );
}
