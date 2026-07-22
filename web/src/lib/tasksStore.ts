// Mockup task store. Attempts the real API first (service agent wires GET/POST
// /api/tasks); when the backend is unavailable — as in the static preview — it falls
// back to a localStorage-backed store seeded with the 3 tasks from the plan so the full
// "add a task → see it in the list → persists on reload" journey is demonstrable.
import { api } from './api';

export interface Task {
  id: number;
  title: string;
  status: 'To do' | 'Done';
  created_at: string;
}

const KEY = 'mock.tasks';

const SEED: Task[] = [
  { id: 3, title: 'Review the quarterly report', status: 'To do', created_at: '2026-07-20T09:00:00Z' },
  { id: 2, title: 'Prepare the launch checklist', status: 'To do', created_at: '2026-07-19T14:30:00Z' },
  { id: 1, title: 'Set up the project workspace', status: 'Done', created_at: '2026-07-18T11:15:00Z' },
];

function read(): Task[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return [...SEED];
  }
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [...SEED];
  }
}

function write(tasks: Task[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

export async function listTasks(): Promise<Task[]> {
  try {
    return await api<Task[]>('/api/tasks');
  } catch {
    // Preview / offline fallback — newest first.
    return read().sort((a, b) => b.id - a.id);
  }
}

export async function createTask(title: string): Promise<Task> {
  try {
    return await api<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  } catch {
    const tasks = read();
    const nextId = tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    const task: Task = {
      id: nextId,
      title,
      status: 'To do',
      created_at: new Date().toISOString(),
    };
    write([task, ...tasks]);
    return task;
  }
}
