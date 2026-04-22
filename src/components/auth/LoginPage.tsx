import { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'Nunito, sans-serif',
  outline: 'none',
  width: '100%',
  ...extra,
});

export default function LoginPage({ onLogin }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
    }}>
      <form onSubmit={submit} style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '36px 32px', width: 360,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          💰 Finance Tracker
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>Sign in to your account</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>Email</div>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inp()}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>Password</div>
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inp()}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 8, padding: '9px 13px', fontSize: 13,
            color: 'var(--red)', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', border: 'none', borderRadius: 10,
          background: 'var(--accent)', color: 'var(--accent-text)',
          fontSize: 15, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          transition: 'all 0.14s',
        }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
