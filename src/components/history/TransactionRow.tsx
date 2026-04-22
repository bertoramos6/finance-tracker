import { useState } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Transaction } from '../../types';
import { CAT_MAP, CATEGORIES } from '../../constants/categories';
import { fmtDate, fmtEur } from '../../utils';

interface Props {
  txn: Transaction;
  onEdit: (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 13px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', ...extra,
});
const ghostBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8,
  fontFamily: 'Nunito, sans-serif', fontWeight: 700, transition: 'all 0.14s',
  color: 'var(--text2)', padding: '4px 9px', fontSize: 13, ...extra,
});

export default function TransactionRow({ txn, onEdit, onDelete }: Props) {
  const { isMobile } = useWindowSize();
  const [hov,     setHov]     = useState(false);
  const [editing, setEditing] = useState(false);
  const [ed,      setEd]      = useState({ ...txn });

  if (editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--hover)', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
        <input type="number" value={ed.amount} onChange={e => setEd(d => ({ ...d, amount: +e.target.value }))} style={inp({ width: 110 })} />
        <input type="date" value={ed.date} onChange={e => setEd(d => ({ ...d, date: e.target.value }))} style={inp({ flex: 1 })} />
        <select value={ed.category} onChange={e => setEd(d => ({ ...d, category: e.target.value }))} style={inp({ flex: 1 })}>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <input value={ed.description} onChange={e => setEd(d => ({ ...d, description: e.target.value }))} placeholder="Description" style={inp({ flex: 1 })} />
        <button onClick={async () => { await onEdit(txn.id, ed); setEditing(false); }} style={{ ...ghostBtn(), background: 'var(--accent)', color: 'var(--accent-text)', padding: '9px 18px' }}>Save</button>
        <button onClick={() => setEditing(false)} style={ghostBtn()}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => isMobile && setHov(h => !h)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 9, background: hov ? 'var(--hover)' : 'var(--card)', transition: 'background 0.12s' }}
    >
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 3, background: txn.type === 'income' ? 'var(--green)' : (CAT_MAP[txn.category] || '#555'), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{txn.category}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtDate(txn.date)}</span>
          {txn.description && (
            <span style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              · {txn.description}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontWeight: 800, fontSize: 15, color: txn.type === 'expense' ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}>
        {txn.type === 'expense' ? '-' : '+'}{fmtEur(txn.amount)}
      </span>
      {hov && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} style={ghostBtn()}>✎</button>
          <button onClick={() => onDelete(txn.id)} style={ghostBtn({ color: 'var(--red)' })}>✕</button>
        </div>
      )}
    </div>
  );
}
