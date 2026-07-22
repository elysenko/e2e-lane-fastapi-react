interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const done = status.toLowerCase() === 'done';
  return (
    <span className={`badge ${done ? 'done' : 'todo'}`} data-testid="status-badge">
      {status}
    </span>
  );
}
