import { useState } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Transaction } from '../../types';
import { CATEGORIES } from '../../constants/categories';
import BatchAdd from './BatchAdd';

const INCOME_CATS = ['Paycheck', 'Other income'];

interface Props {
  userId: string;
  onAdd: (t: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
}

const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 13px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', ...extra,
});

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7,
  display: 'block',
};

export default function AddEntry({ userId, onAdd }: Props) {
  const { isMobile } = useWindowSize();
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [type,   setType]   = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10));
  const [cat,    setCat]    = useState(CATEGORIES[0].name);
  const [incomeCat, setIncomeCat] = useState(INCOME_CATS[0]);
  const [desc,   setDesc]   = useState('');
  const [flash,  setFlash]  = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || isNaN(+amount) || +amount <= 0) return;
    setLoading(true);
    try {
      await onAdd({
        type,
        amount: +amount,
        date,
        category: type === 'income' ? incomeCat : cat,
        description: desc,
      });
      setAmount(''); setDesc(''); setFlash(true);
      setTimeout(() => setFlash(false), 1400);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  const addBatch = async (txns: Omit<Transaction, 'id' | 'created_at'>[]) => {
    for (const t of txns) await onAdd(t);
  };

  if (mode === 'batch') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0', borderBottom: '1px solid var(--border)' }}>
          {(['single', 'batch'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '8px 20px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
              fontFamily: 'Nunito,sans-serif', fontWeight: 700, fontSize: 13,
              background: mode === m ? 'var(--card)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text2)',
              borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.12s',
            }}>
              {m === 'single' ? 'Single entry' : 'Batch add'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BatchAdd userId={userId} onAddBatch={addBatch} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0', borderBottom: '1px solid var(--border)' }}>
        {(['single', 'batch'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '8px 20px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontFamily: 'Nunito,sans-serif', fontWeight: 700, fontSize: 13,
            background: mode === m ? 'var(--card)' : 'transparent',
            color: mode === m ? 'var(--text)' : 'var(--text2)',
            borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.12s',
          }}>
            {m === 'single' ? 'Single entry' : 'Batch add'}
          </button>
        ))}
      </div>
    <div style={{ flex: 1, overflowY: 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 28, letterSpacing: '-0.02em' }}>Add Transaction</h2>

        <div style={{ marginBottom: 22 }}>
          <div style={lbl}>Type</div>
          <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: 11, padding: 3, border: '1px solid var(--border)' }}>
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                fontFamily: 'Nunito,sans-serif', fontWeight: 800, fontSize: 14, transition: 'all 0.15s',
                background: type === t ? (t === 'expense' ? 'var(--red)' : 'var(--green)') : 'transparent',
                color: type === t ? '#fff' : 'var(--text2)',
              }}>
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={lbl}>Amount (€)</div>
          <input
            type="number" step="0.01" placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={onKey}
            style={inp({ width: '100%', fontSize: 30, fontWeight: 800, padding: '14px 18px', letterSpacing: '-0.02em' })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <div style={lbl}>Date</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp({ width: '100%' })} />
          </div>
          {type === 'expense' && (
            <div>
              <div style={lbl}>Category</div>
              <select value={cat} onChange={e => setCat(e.target.value)} style={inp({ width: '100%' })}>
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}
          {type === 'income' && (
            <div>
              <div style={lbl}>Category</div>
              <select value={incomeCat} onChange={e => setIncomeCat(e.target.value)} style={inp({ width: '100%' })}>
                {INCOME_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 26 }}>
          <div style={lbl}>Description <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></div>
          <textarea
            placeholder="What did you spend on?" value={desc}
            onChange={e => setDesc(e.target.value)} rows={3}
            style={inp({ width: '100%', resize: 'vertical', lineHeight: '1.6' })}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', fontSize: 16, borderRadius: 11, border: 'none',
            background: flash ? 'var(--green)' : 'var(--accent)',
            color: flash ? '#fff' : 'var(--accent-text)',
            fontFamily: 'Nunito, sans-serif', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
          }}
        >
          {flash ? '✓ Added!' : '+ Add Transaction'}
        </button>
      </div>
    </div>
    </div>
    </div>
  );
}
