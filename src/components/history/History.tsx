import { useState } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Transaction } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import { monthKey, monthLabel, fmtEur } from '../../utils';
import { exportCSV } from '../../services/csv';
import TransactionRow from './TransactionRow';

interface Props {
  txns: Transaction[];
  onEdit: (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 13px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', ...extra,
});

export default function History({ txns, onEdit, onDelete }: Props) {
  const { isMobile } = useWindowSize();
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = txns.filter(t => {
    if (filterCat && t.category !== filterCat) return false;
    const q = search.toLowerCase();
    if (q && !t.category.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !String(t.amount).includes(q)) return false;
    return true;
  });

  const byMonth: Record<string, Transaction[]> = {};
  filtered.forEach(t => {
    const mk = monthKey(t.date);
    if (!byMonth[mk]) byMonth[mk] = [];
    byMonth[mk].push(t);
  });
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ padding: isMobile ? '14px 12px' : '22px 24px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <input
          placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={inp({ flex: 1, minWidth: 0 })}
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={inp({ width: isMobile ? '100%' : 190 })}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        {!isMobile && (
          <button
            onClick={() => exportCSV(txns)}
            style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {sortedMonths.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text2)', paddingTop: 60 }}>No transactions found.</div>
      )}

      {sortedMonths.map(mk => {
        const mT = byMonth[mk];
        const spent  = mT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const income = mT.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
        return (
          <div key={mk} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>{monthLabel(mk)}</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                {income > 0 && <span>Income <strong style={{ color: 'var(--green)' }}>{fmtEur(income)}</strong></span>}
                <span>Spent <strong style={{ color: 'var(--red)' }}>{fmtEur(spent)}</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {mT.map(t => <TransactionRow key={t.id} txn={t} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
