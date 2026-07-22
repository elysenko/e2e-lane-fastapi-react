// Task data access — wired to the real backend (GET/POST /api/tasks). Errors propagate
// to the caller so the UI can show its loading / friendly-error states (e.g. a 503 when
// the database is unavailable surfaces the error banner rather than stale local data).
import { api } from './api';

export interface Task {
  id: number;
  title: string;
  status: 'To do' | 'Done';
  created_at: string;
}

export async function listTasks(): Promise<Task[]> {
  // Backend returns tasks newest-first already; kept stable here regardless.
  return api<Task[]>('/api/tasks');
}

export async function createTask(title: string): Promise<Task> {
  return api<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}
