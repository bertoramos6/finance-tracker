import { useWindowSize } from '../../hooks/useWindowSize';

interface Props {
  tab: string;
  setTab: (tab: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  onLogout: () => void;
}

const NAV = [
  { id: 'overview',    label: 'Overview',    icon: '◫' },
  { id: 'add',         label: 'Add',         icon: '＋' },
  { id: 'history',     label: 'History',     icon: '☰' },
  { id: 'investments', label: 'Invest',      icon: '↗' },
];

const navBtn = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
  padding: '10px 14px', marginBottom: 2,
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? 'var(--accent-text)' : 'var(--text2)',
  border: 'none', borderRadius: 10, cursor: 'pointer',
  fontSize: 14, fontWeight: active ? 800 : 500,
  fontFamily: 'Nunito, sans-serif', textAlign: 'left',
  transition: 'all 0.13s',
});

const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 11, width: '100%',
  padding: '10px 14px', background: 'transparent', color: 'var(--text2)',
  border: 'none', borderRadius: 10, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'Nunito, sans-serif',
  transition: 'all 0.13s',
};

export default function Sidebar({ tab, setTab, dark, setDark, onLogout }: Props) {
  const { isMobile } = useWindowSize();

  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--sidebar)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch',
        height: 60, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, border: 'none', cursor: 'pointer',
              background: 'transparent', fontFamily: 'Nunito, sans-serif',
              color: active ? 'var(--accent)' : 'var(--text2)',
              transition: 'all 0.13s',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => setDark(!dark)} style={{
          width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--text2)', fontFamily: 'Nunito, sans-serif',
        }}>
          <span style={{ fontSize: 16 }}>{dark ? '☀' : '🌙'}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{dark ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    );
  }

  return (
    <aside style={{
      width: 220, background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '26px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>💰 Finance</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, fontWeight: 600 }}>Personal tracker</div>
      </div>

      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} style={navBtn(active)}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; } }}
            >
              <span style={{ fontSize: 16, lineHeight: '1' }}>{item.icon}</span>
              {item.label === 'Add' ? 'Add Entry' : item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setDark(!dark)} style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
        >
          <span style={{ fontSize: 15 }}>{dark ? '☀' : '🌙'}</span>
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <button onClick={onLogout} style={ghostBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
        >
          <span style={{ fontSize: 15 }}>⎋</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
