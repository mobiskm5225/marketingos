import { useState } from 'react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--sn-bg)', fontFamily: 'var(--sn-font)',
    }}>
      <div style={{
        width: 380, background: '#fff', border: '1px solid var(--sn-border)',
        borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.10)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--sn-top)', padding: '24px 28px', textAlign: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#121212',
            color: 'var(--sn-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, margin: '0 auto 12px',
            boxShadow: '0 0 0 1px rgba(255,255,255,.1)',
          }}>a</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-.01em' }}>
            Acefone MI
          </div>
          <div style={{ color: '#9dbbc4', fontSize: 13, marginTop: 4 }}>
            Marketing Intelligence Hub
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '28px 28px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1b3038', marginBottom: 20 }}>
            Sign in to your workspace
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#344951', marginBottom: 5 }}>
                Username
              </label>
              <input
                className="sn-input"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#344951', marginBottom: 5 }}>
                Password
              </label>
              <input
                className="sn-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--sn-red-soft)', border: '1px solid #ffc9c9',
                color: 'var(--sn-red)', borderRadius: 6, padding: '9px 12px',
                fontSize: 13, fontWeight: 600, marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="sn-btn sn-btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 38, fontSize: 14 }}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{
          borderTop: '1px solid var(--sn-border)', padding: '12px 28px',
          background: '#fafbfc', fontSize: 12, color: '#697a82', textAlign: 'center',
        }}>
          Acefone Intelligence · Internal tool · v2.0
        </div>
      </div>
    </div>
  );
}
