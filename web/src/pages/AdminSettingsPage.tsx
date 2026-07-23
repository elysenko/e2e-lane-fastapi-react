import { useEffect, useState } from 'react';
import { signOut, useSession } from '../lib/session';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

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

type Status = 'loading' | 'ready' | 'error';

export default function AdminSettingsPage() {
  const { name } = useSession();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [savedKey, setSavedKey] = useState('');
  const [savingKey, setSavingKey] = useState('');

  // Load the real backing-service status from GET /api/admin/settings (admin JWT).
  useEffect(() => {
    let alive = true;
    api<{ services: Service[] }>('/api/admin/settings')
      .then((d) => {
        if (!alive) return;
        setServices(d.services);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  async function saveService(idx: number, values: Record<string, string>) {
    const svc = services[idx];
    setSavingKey(svc.name);
    setSavedKey('');
    try {
      const updated = await api<Service>(`/api/admin/settings/${svc.name}`, {
        method: 'PUT',
        body: JSON.stringify({ values }),
      });
      setServices((prev) => prev.map((s, i) => (i === idx ? updated : s)));
      setSavedKey(svc.name);
    } catch {
      setSavedKey('');
    } finally {
      setSavingKey('');
    }
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

      {status === 'loading' && (
        <div className="card state" data-testid="settings-loading" aria-busy="true">
          <p>Loading backing services…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-banner" data-testid="settings-error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>We couldn't load the settings right now. Please try again in a moment.</span>
        </div>
      )}

      {savedKey && <div className="notice" data-testid="settings-saved">✓ Saved {savedKey} settings.</div>}

      {status === 'ready' &&
        services.map((svc, idx) => (
          <form
            key={svc.name}
            className="card settings-group"
            data-testid={`service-${svc.name}`}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const values: Record<string, string> = {};
              svc.fields.forEach((f) => {
                values[f.key] = String(fd.get(f.key) ?? '');
              });
              saveService(idx, values);
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
                  name={f.key}
                  className="input"
                  type={f.type ?? 'text'}
                  placeholder={svc.configured ? '••••••••' : `Enter ${f.label.toLowerCase()}`}
                  data-testid={`input-${f.key}`}
                />
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingKey === svc.name}
              data-testid={`save-${svc.name}`}
            >
              {savingKey === svc.name ? 'Saving…' : `Save ${svc.name}`}
            </button>
          </form>
        ))}
    </section>
  );
}
