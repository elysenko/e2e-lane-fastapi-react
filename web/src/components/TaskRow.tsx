import type { Task } from '../lib/tasksStore';
import StatusBadge from './StatusBadge';

interface Props {
  task: Task;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function TaskRow({ task }: Props) {
  return (
    <li className="task-row" data-testid="task-row">
      <div>
        {/* React escapes text on render → titles like <script> render as literal text */}
        <div className="task-title" data-testid="task-title">
          {task.title}
        </div>
        <p className="task-meta">Added {formatDate(task.created_at)}</p>
      </div>
      <StatusBadge status={task.status} />
    </li>
  );
}
