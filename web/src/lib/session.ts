// Lightweight client-side session for the mockup. The real backend (full_auth) issues
// a JWT; here we track role locally so the UI reflects logged-out / user / admin states
// and gates the admin section. Service agent replaces the setters with real auth calls.
import { useSyncExternalStore } from 'react';

export type Role = 'admin' | 'user' | null;

const KEY = 'session.role';
const NAME_KEY = 'session.name';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getRole(): Role {
  return (localStorage.getItem(KEY) as Role) || null;
}

export function getName(): string {
  return localStorage.getItem(NAME_KEY) || '';
}

export function signIn(role: Exclude<Role, null>, name: string) {
  localStorage.setItem(KEY, role);
  localStorage.setItem(NAME_KEY, name);
  emit();
}

export function signOut() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem('token');
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSession() {
  const role = useSyncExternalStore(subscribe, getRole, () => null);
  const name = useSyncExternalStore(subscribe, getName, () => '');
  return { role, name, isAdmin: role === 'admin' };
}
