import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useInvestments } from './hooks/useInvestments';
import { useWindowSize } from './hooks/useWindowSize';
import { useCustomTypes, CategoriesProvider } from './hooks/useCategories';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Overview from './components/overview/Overview';
import AddEntry from './components/add-entry/AddEntry';
import History from './components/history/History';
import Investments from './components/investments/Investments';

type Tab = 'overview' | 'add' | 'history' | 'investments';

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth();

  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem('ft_tab') as Tab) || 'overview');
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ft_dark');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => { localStorage.setItem('ft_tab', tab); }, [tab]);
  useEffect(() => {
    localStorage.setItem('ft_dark', String(dark));
    if (dark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [dark]);

  const { txns, error: txnsError, reload: reloadTxns, addTxn, updateTxn, removeTxn } = useTransactions(user?.id ?? '');
  const { invs, error: invsError, reload: reloadInvs, addInv, removeInv, updateEntry } = useInvestments(user?.id ?? '');
  const { value: categories, error: typesError, reload: reloadTypes } = useCustomTypes(user?.id ?? '');
  const { isMobile } = useWindowSize();
  const loadError = txnsError || invsError || typesError;
  const retryLoad = () => {
    if (txnsError) reloadTxns();
    if (invsError) reloadInvs();
    if (typesError) reloadTypes();
  };

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text2)', fontSize: 14 }}>
      Loading…
    </div>
  );

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <CategoriesProvider value={categories}>
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Nunito, sans-serif', overflow: 'hidden' }}>
      {!isMobile && (
        <Sidebar tab={tab} setTab={t => setTab(t as Tab)} dark={dark} setDark={setDark} onLogout={logout} />
      )}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: isMobile ? 60 : 0 }}>
        {loadError && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0,
            margin: isMobile ? '12px 12px 0' : '16px 24px 0', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Couldn't load your data</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, minWidth: 0 }}>{loadError}</span>
            <button onClick={retryLoad} style={{
              padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer',
              background: 'var(--card)', color: 'var(--text)', fontFamily: 'Nunito,sans-serif', fontWeight: 700, fontSize: 12,
            }}>Retry</button>
          </div>
        )}
        {tab === 'overview'    && <Overview    txns={txns} />}
        {tab === 'add'         && <AddEntry    userId={user.id} onAdd={addTxn} />}
        {tab === 'history'     && <History     txns={txns} onEdit={updateTxn} onDelete={removeTxn} />}
        {tab === 'investments' && <Investments invs={invs} onUpdateEntry={updateEntry} onAddInv={addInv} onRemoveInv={removeInv} />}
      </main>
      {isMobile && (
        <Sidebar tab={tab} setTab={t => setTab(t as Tab)} dark={dark} setDark={setDark} onLogout={logout} />
      )}
    </div>
    </CategoriesProvider>
  );
}
