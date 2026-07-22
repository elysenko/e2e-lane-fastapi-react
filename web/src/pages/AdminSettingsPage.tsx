import { useState } from 'react';
import { signOut, useSession } from '../lib/session';
import { useNavigate } from 'react-router-dom';

interface ServiceField {
  key: string;
  label: string;
  type?: string;
}

interface Service {
  name: string;
  configured: boolean;
  fields: ServiceField[];
}

// Mockup shape mirrors GET /api/admin/settings (masked values + configured status).
// Service agent wires the real GET/PATCH; the save handler here just flips local state.
const INITIAL: Service[] = [
  {
    name: 'postgresql',
    configured: true,
    fields: [
      { key: 'DATABASE_URL', label: 'Database URL' },
      { key: 'POSTGRES_PASSWORD', label: 'Password', type: 'password' },
    ],
  },
  {
    name: 'minio',
    configured: false,
    fields: [
      { key: 'MINIO_ENDPOINT', label: 'Endpoint' },
      { key: 'MINIO_ACCESS_KEY', label: 'Access key' },
      { key: 'MINIO_SECRET_KEY', label: 'Secret key', type: 'password' },
    ],
  },
];

export default function AdminSettingsPage() {
  const { name } = useSession();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>(INITIAL);
  const [savedKey, setSavedKey] = useState('');

  function saveService(idx: number) {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, configured: true } : s)));
    setSavedKey(services[idx].name);
    window.setTimeout(() => setSavedKey(''), 2500);
  }

  function logout() {
    signOut();
    navigate('/admin/login');
  }

  return (
    <section data-testid="admin-settings-page">
      <div className="page-head">
        <div>
          <h1>Admin Settings</h1>
          <p className="page-sub">Signed in as {name || 'admin'} · configure backing services.</p>
        </div>
        <button className="btn btn-ghost" onClick={logout} data-testid="admin-logout">
          Sign out
        </button>
      </div>

      {savedKey && <div className="notice" data-testid="settings-saved">✓ Saved {savedKey} settings.</div>}

      {services.map((svc, idx) => (
        <form
          key={svc.name}
          className="card settings-group"
          data-testid={`service-${svc.name}`}
          onSubmit={(e) => {
            e.preventDefault();
            saveService(idx);
          }}
        >
          <div className="settings-group-head">
            <h3>{svc.name}</h3>
            <span className={`badge ${svc.configured ? 'ok' : 'off'}`} data-testid={`status-${svc.name}`}>
              {svc.configured ? 'Configured' : 'Not configured'}
            </span>
          </div>

          {svc.fields.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                className="input"
                type={f.type ?? 'text'}
                placeholder={svc.configured ? '••••••••' : `Enter ${f.label.toLowerCase()}`}
                data-testid={`input-${f.key}`}
              />
            </div>
          ))}

          <button type="submit" className="btn btn-primary" data-testid={`save-${svc.name}`}>
            Save {svc.name}
          </button>
        </form>
      ))}
    </section>
  );
}
