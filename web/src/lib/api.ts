// API client. All /api/* calls are prefixed with the ingress base path (Vite's BASE_URL,
// e.g. "/e2e-lane-fastapi-react/") so requests survive ingress routing; FastAPI's
// prefix-strip middleware also tolerates the bare path for direct access. Never hardcode
// a backend host — the SPA and API are served same-origin from one container.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number) {
    super(`${status}`);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const url = path.startsWith('/api/') ? `${BASE}${path}` : path;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}
