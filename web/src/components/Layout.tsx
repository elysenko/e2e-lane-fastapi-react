import { NavLink, Outlet } from 'react-router-dom';
import { useSession } from '../lib/session';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export default function Layout() {
  const { isAdmin } = useSession();

  const items: NavItem[] = [
    { to: '/tasks', label: 'Tasks', icon: '☑️' },
    { to: '/about', label: 'About', icon: 'ℹ️' },
    { to: isAdmin ? '/admin/settings' : '/login', label: isAdmin ? 'Admin' : 'Account', icon: isAdmin ? '⚙️' : '👤' },
  ];

  return (
    <div className="app" data-testid="app-ready">
      <header className="topbar">
        <NavLink to="/tasks" className="brand">
          <span className="brand-mark">{'✓'}</span>
          <span>Task List</span>
        </NavLink>
        <nav className="top-nav" aria-label="Primary">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {it.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Primary mobile">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <span className="ico" aria-hidden="true">
              {it.icon}
            </span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
