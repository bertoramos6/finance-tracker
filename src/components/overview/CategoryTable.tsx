import { useState } from 'react';
import type { Transaction } from '../../types';
import { CAT_MAP } from '../../constants/categories';
import { monthKey, monthLabel, fmtDate, fmtEur } from '../../utils';

interface Props {
  txns: Transaction[];
  tableMonths: string[];
  allCats: string[];
}

interface Tip {
  cat: string;
  ci: number;
  txns: Transaction[];
  rect: DOMRect;
}

const thBase: React.CSSProperties = {
  padding: '6px 8px 10px 8px', color: 'var(--text2)', fontWeight: 700,
  fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase',
  borderBottom: '2px solid var(--border)',
};

export default function CategoryTable({ txns, tableMonths, allCats }: Props) {
  const [tip, setTip] = useState<Tip | null>(null);

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ ...thBase, textAlign: 'left', paddingLeft: 0 }}>Category</th>
            {tableMonths.map(mk => <th key={mk} style={{ ...thBase, textAlign: 'right' }}>{monthLabel(mk)}</th>)}
            <th style={{ ...thBase, textAlign: 'right' }}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {allCats.map(cat => {
            const vals = tableMonths.map(mk =>
              txns.filter(t => t.category === cat && monthKey(t.date) === mk && t.type === 'expense')
                  .reduce((s, t) => s + t.amount, 0)
            );
            const nz = vals.filter(v => v > 0);
            const avg = nz.length ? nz.reduce((a, b) => a + b, 0) / nz.length : 0;
            return (
              <tr key={cat} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px 8px 0', fontWeight: 600, color: 'var(--text)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_MAP[cat] || '#888', flexShrink: 0 }} />
                    {cat}
                  </div>
                </td>
                {vals.map((v, ci) => {
                  const cellTxns = txns.filter(t => t.category === cat && monthKey(t.date) === tableMonths[ci] && t.type === 'expense');
                  const isHov = tip && tip.cat === cat && tip.ci === ci;
                  return (
                    <td key={ci} style={{ padding: '8px', textAlign: 'right', position: 'relative' }}
                      onMouseEnter={e => { if (v > 0) setTip({ cat, ci, txns: cellTxns, rect: e.currentTarget.getBoundingClientRect() }); }}
                      onMouseLeave={() => setTip(null)}>
                      <span style={{ color: v > 0 ? 'var(--text)' : 'var(--text2)', background: isHov ? 'var(--hover)' : 'transparent', padding: '2px 6px', borderRadius: 4, transition: 'background 0.1s' }}>
                        {v > 0 ? fmtEur(v) : '—'}
                      </span>
                    </td>
                  );
                })}
                <td style={{ padding: '8px 0 8px 8px', textAlign: 'right', color: 'var(--text2)', fontStyle: 'italic' }}>{avg > 0 ? fmtEur(avg) : '—'}</td>
              </tr>
            );
          })}
          {(() => {
            const tots = tableMonths.map(mk => txns.filter(t => monthKey(t.date) === mk && t.type === 'expense').reduce((s, t) => s + t.amount, 0));
            const avgT = tots.filter(v => v > 0).reduce((a, b) => a + b, 0) / (tots.filter(v => v > 0).length || 1);
            return (
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td style={{ padding: '10px 12px 10px 0', color: 'var(--text)' }}>Total</td>
                {tots.map((v, i) => <td key={i} style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text)' }}>{fmtEur(v)}</td>)}
                <td style={{ padding: '10px 0 10px 8px', textAlign: 'right', color: 'var(--text2)', fontStyle: 'italic' }}>{fmtEur(avgT)}</td>
              </tr>
            );
          })()}
        </tbody>
      </table>

      {tip && tip.txns.length > 0 && (
        <div style={{
          position: 'fixed',
          top: tip.rect.bottom + 6,
          left: Math.min(tip.rect.left, window.innerWidth - 240),
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '10px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          zIndex: 1000, minWidth: 200, maxWidth: 280, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>{tip.cat}</div>
          {tip.txns.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || fmtDate(t.date)}</span>
              <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{fmtEur(t.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
