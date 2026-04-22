import { useState } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Investment } from '../../types';
import type { InvRange } from '../../types';
import { INV_PALETTE } from '../../constants/colors';
import { DEFAULT_INVESTMENT_TYPES } from '../../constants/investmentTypes';
import { monthKeyLocal, monthLabel, fmtEur } from '../../utils';
import StackedAreaChart from '../charts/StackedAreaChart';
import Sparkline from '../charts/Sparkline';

function useInvTypes() {
  const [custom, setCustom] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ft_inv_types') || '[]'); } catch { return []; }
  });
  const all = [...DEFAULT_INVESTMENT_TYPES, ...custom.filter(t => !DEFAULT_INVESTMENT_TYPES.includes(t))];
  const add = (t: string) => {
    const next = [...custom, t];
    setCustom(next);
    localStorage.setItem('ft_inv_types', JSON.stringify(next));
  };
  return { types: all, addType: add };
}

interface Props {
  invs: Investment[];
  onUpdateEntry: (invId: string, month: string, value: number) => Promise<void>;
  onAddInv: (inv: { name: string; type: string }) => Promise<void>;
  onRemoveInv: (id: string) => Promise<void>;
}

const RANGES: { key: InvRange; label: string }[] = [
  { key: '1m', label: '1M' }, { key: '3m', label: '3M' },
  { key: '6m', label: '6M' }, { key: 'ytd', label: 'YTD' },
  { key: '1y', label: '1Y' }, { key: 'all', label: 'All' },
];

const card: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18,
};
const cardTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14,
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7,
};
const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 13px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', ...extra,
});
const thBase: React.CSSProperties = {
  padding: '6px 8px 10px 8px', color: 'var(--text2)', fontWeight: 700,
  fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase',
  borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap',
};

function getVal(inv: Investment, mk: string): number {
  const e = inv.entries.find(e => e.month === mk);
  if (e) return e.value;
  const prev = inv.entries.filter(e => e.month <= mk).sort((a, b) => b.month.localeCompare(a.month))[0];
  return prev ? prev.value : 0;
}

function NWStat({ label, value, base }: { label: string; value: number; base: number }) {
  const pct = base > 0 ? (Math.abs(value) / base * 100).toFixed(1) : null;
  return (
    <div>
      <div style={{ ...lbl, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: value >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {value >= 0 ? '+' : '-'}{fmtEur(Math.abs(value))}
        {pct && <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 5, opacity: 0.7 }}>({pct}%)</span>}
      </div>
    </div>
  );
}

function ChangeRow({ label, change, pct }: { label: string; change: number; pct: number }) {
  const isPos = change >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 11, color: 'var(--text2)', width: 54 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isPos ? 'var(--green)' : 'var(--red)' }}>
        {isPos ? '+' : '-'}{fmtEur(Math.abs(change))}
      </span>
      <span style={{ fontSize: 11, color: isPos ? 'var(--green)' : 'var(--red)', opacity: 0.75 }}>
        ({isPos ? '+' : ''}{pct.toFixed(1)}%)
      </span>
    </div>
  );
}

export default function Investments({ invs, onUpdateEntry, onAddInv, onRemoveInv }: Props) {
  const { isMobile } = useWindowSize();
  const today    = new Date();
  const curMonth = monthKeyLocal(today);
  const [range,    setRange]    = useState<InvRange>('all');
  const [editCell, setEditCell] = useState<{ id: string; month: string } | null>(null);
  const [editVal,  setEditVal]  = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const [newName,  setNewName]  = useState(DEFAULT_INVESTMENT_TYPES[0]);
  const [customNameInput, setCustomNameInput] = useState('');
  const { types: invTypes, addType } = useInvTypes();

  const allEntryMonths = [...new Set(invs.flatMap(i => i.entries.map(e => e.month)))].sort();
  const PORTFOLIO_START = '2024-09';
  const earliest = (allEntryMonths[0] && allEntryMonths[0] < PORTFOLIO_START) ? allEntryMonths[0] : PORTFOLIO_START;

  const buildMonths = (): string[] => {
    const endDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let startDate: Date;
    if (range === '1m')       startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    else if (range === '3m')  startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    else if (range === '6m')  startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    else if (range === 'ytd') startDate = new Date(today.getFullYear(), 0, 1);
    else if (range === '1y')  startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    else {
      const [y, m] = earliest.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
    }

    const result: string[] = [];
    let cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cur <= end) {
      result.push(monthKeyLocal(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return result;
  };

  const chartMonths = buildMonths();
  const netByMonth  = chartMonths.map(mk => invs.reduce((s, inv) => s + getVal(inv, mk), 0));
  const curNW       = netByMonth[netByMonth.length - 1] || 0;
  const prevNW      = netByMonth[netByMonth.length - 2] || 0;
  const moDiff      = curNW - prevNW;
  const rangeStart  = netByMonth[0] || 0;
  const rangeDiff   = curNW - rangeStart;

  const allMonths7 = Array.from({ length: 7 }, (_, i) => monthKeyLocal(new Date(today.getFullYear(), today.getMonth() - 6 + i, 1)));
  const netAll7    = allMonths7.map(mk => invs.reduce((s, inv) => s + getVal(inv, mk), 0));

  const stackSeries = invs.map((inv, idx) => ({
    label: inv.name,
    color: INV_PALETTE[idx % INV_PALETTE.length],
    data: chartMonths.map(mk => getVal(inv, mk)),
  }));

  const chartLabels = chartMonths.map((mk, i) => {
    const step = chartMonths.length <= 7 ? 1 : chartMonths.length <= 13 ? 2 : 3;
    return i % step === 0 ? monthLabel(mk).split(' ')[0] : '';
  });

  const recentMonths = chartMonths;

  const commitEdit = async () => {
    if (editCell && editVal !== '') {
      await onUpdateEntry(editCell.id, editCell.month, parseFloat(editVal) || 0);
    }
    setEditCell(null); setEditVal('');
  };

  return (
    <div style={{ padding: isMobile ? '14px 12px' : '22px 24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Net worth hero */}
      <div style={{ ...card, marginBottom: 14, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...lbl, marginBottom: 6 }}>Total Net Worth</div>
          <div style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtEur(curNW)}</div>
        </div>
        {!isMobile && (
          <div style={{ marginLeft: 'auto' }}>
            <Sparkline data={netAll7} color="var(--blue)" w={120} h={44} />
          </div>
        )}
        <div style={{ display: 'flex', gap: isMobile ? 16 : 28, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
          <NWStat label="This month"  value={moDiff}    base={prevNW} />
          <NWStat label="This period" value={rangeDiff} base={rangeStart} />
          {!isMobile && (
            <div>
              <div style={{ ...lbl, marginBottom: 5 }}>Last updated</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{monthLabel(curMonth)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)} style={{
            padding: '5px 14px', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 700, transition: 'all 0.12s',
            background: range === r.key ? 'var(--accent)' : 'transparent',
            color: range === r.key ? 'var(--accent-text)' : 'var(--text2)',
          }}>{r.label}</button>
        ))}
      </div>

      {/* Stacked area chart */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={cardTitle}>Portfolio Evolution</div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', justifyContent: 'flex-end' }}>
            {invs.map((inv, idx) => (
              <span key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: INV_PALETTE[idx % INV_PALETTE.length] }} />
                {inv.name}
              </span>
            ))}
          </div>
        </div>
        {chartMonths.length < 2 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0', fontSize: 13 }}>Add more monthly entries to see the chart.</div>
        ) : (
          <StackedAreaChart series={stackSeries} labels={chartLabels} tooltipLabels={chartMonths.map(mk => monthLabel(mk))} height={220} />
        )}
      </div>

      {/* Investment cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 14 }}>
        {invs.map((inv, idx) => {
          const color    = INV_PALETTE[idx % INV_PALETTE.length];
          const curVal   = getVal(inv, curMonth);
          const prevVal  = getVal(inv, recentMonths[recentMonths.length - 2] || curMonth);
          const firstVal = inv.entries.length ? inv.entries[0].value : curVal;
          const mChg = curVal - prevVal, mPct = prevVal > 0 ? (mChg / prevVal * 100) : 0;
          const aChg = curVal - firstVal, aPct = firstVal > 0 ? (aChg / firstVal * 100) : 0;
          const spark = chartMonths.map(mk => getVal(inv, mk));
          return (
            <div key={inv.id} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '12px 0 0 12px' }} />
              <div style={{ paddingLeft: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.name}</div>
                  </div>
                  <button onClick={() => onRemoveInv(inv.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 11, color: 'var(--text2)', opacity: 0.4, borderRadius: 6, fontFamily: 'Nunito, sans-serif' }}>✕</button>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 10 }}>{fmtEur(curVal)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  <ChangeRow label="Month"    change={mChg} pct={mPct} />
                  <ChangeRow label="All time" change={aChg} pct={aPct} />
                </div>
                <Sparkline data={spark.filter(v => v > 0)} color={color} w={180} h={36} />
              </div>
            </div>
          );
        })}

        {!showAdd && (
          <button onClick={() => setShowAdd(true)} style={{
            ...card, border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--text2)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
            minHeight: 160, transition: 'all 0.14s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
          >
            + Add Position
          </button>
        )}

        {showAdd && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>New Position</div>
            <select value={newName} onChange={e => setNewName(e.target.value)} style={inp({ width: '100%' })} autoFocus>
              {invTypes.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__custom__">+ Add custom…</option>
            </select>
            {newName === '__custom__' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  autoFocus placeholder="Position name…" value={customNameInput}
                  onChange={e => setCustomNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && customNameInput.trim()) { addType(customNameInput.trim()); setNewName(customNameInput.trim()); setCustomNameInput(''); } }}
                  style={inp({ flex: 1 })}
                />
                <button
                  onClick={() => { if (customNameInput.trim()) { addType(customNameInput.trim()); setNewName(customNameInput.trim()); setCustomNameInput(''); } }}
                  style={{ padding: '9px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-text)', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                  Save
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => { if (newName && newName !== '__custom__') { await onAddInv({ name: newName, type: 'N/A' }); setShowAdd(false); setNewName(DEFAULT_INVESTMENT_TYPES[0]); } }}
                style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-text)', fontFamily: 'Nunito,sans-serif', fontWeight: 700, opacity: (!newName || newName === '__custom__') ? 0.5 : 1 }}>
                Add
              </button>
              <button onClick={() => { setShowAdd(false); setNewName(DEFAULT_INVESTMENT_TYPES[0]); setCustomNameInput(''); }} style={{ padding: '9px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Monthly values table */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={cardTitle}>Monthly Values</div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text2)' }}>Click a cell to update this month's value</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thBase, textAlign: 'left', paddingLeft: 0 }}>Asset</th>
                {recentMonths.map(mk => <th key={mk} style={{ ...thBase, textAlign: 'right' }}>{monthLabel(mk)}</th>)}
                <th style={{ ...thBase, textAlign: 'right' }}>Change</th>
                <th style={{ ...thBase, textAlign: 'right' }}>Alloc%</th>
              </tr>
            </thead>
            <tbody>
              {invs.map((inv, idx) => {
                const color  = INV_PALETTE[idx % INV_PALETTE.length];
                const vals   = recentMonths.map(mk => getVal(inv, mk));
                const curVal = vals[vals.length - 1] || 0;
                const pval   = vals[vals.length - 2] || 0;
                const chg    = curVal - pval;
                const alloc  = curNW > 0 ? (curVal / curNW * 100).toFixed(1) + '%' : '—';
                return (
                  <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 0', fontWeight: 700, color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {inv.name}
                      </div>
                    </td>
                    {recentMonths.map((mk, mi) => {
                      const isEdit = editCell && editCell.id === inv.id && editCell.month === mk;
                      return (
                        <td key={mk} style={{ padding: '9px 8px', textAlign: 'right' }}
                          onClick={() => { setEditCell({ id: inv.id, month: mk }); setEditVal(String(vals[mi] || '')); }}>
                          {isEdit ? (
                            <input
                              autoFocus type="number" value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditCell(null); setEditVal(''); } }}
                              style={inp({ width: 100, textAlign: 'right', padding: '4px 8px', fontSize: 13 })}
                            />
                          ) : (
                            <span style={{ cursor: 'pointer', padding: '2px 7px', borderRadius: 5, color: vals[mi] > 0 ? 'var(--text)' : 'var(--text2)', transition: 'background 0.1s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                              {vals[mi] > 0 ? fmtEur(vals[mi]) : '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, color: chg >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                      {pval > 0 ? (chg >= 0 ? '+' : '-') + fmtEur(Math.abs(chg)) : '—'}
                    </td>
                    <td style={{ padding: '9px 0 9px 8px', textAlign: 'right', color: 'var(--text2)' }}>{alloc}</td>
                  </tr>
                );
              })}
              {(() => {
                const tots = recentMonths.map(mk => invs.reduce((s, inv) => s + getVal(inv, mk), 0));
                const tc = tots[tots.length - 1] - tots[tots.length - 2];
                return (
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 800 }}>
                    <td style={{ padding: '10px 0', color: 'var(--text)' }}>Total</td>
                    {tots.map((v, i) => <td key={i} style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text)' }}>{fmtEur(v)}</td>)}
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: tc >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {(tc >= 0 ? '+' : '-') + fmtEur(Math.abs(tc))}
                    </td>
                    <td style={{ padding: '10px 0 10px 8px', textAlign: 'right', color: 'var(--text2)' }}>100%</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
