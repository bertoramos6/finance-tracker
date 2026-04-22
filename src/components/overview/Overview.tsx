import { useState } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Transaction } from '../../types';
import { CAT_MAP } from '../../constants/categories';
import { monthKey, monthKeyLocal, monthLabel, getMonthStats } from '../../utils';
import DonutChart from '../charts/DonutChart';
import AreaChart from '../charts/AreaChart';
import StatCard from './StatCard';
import CategoryTable from './CategoryTable';

interface Props {
  txns: Transaction[];
}

type StatRange  = 'month' | 'ytd' | '1y' | 'all';
type TrendRange = '6m' | 'ytd' | '1y' | 'all';
type CatRange   = '1m' | '3m' | '6m' | 'ytd' | '1y' | 'all';

const card: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18,
};
const cardTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text2)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14,
};
const pill = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
  fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 700, transition: 'all 0.12s',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? 'var(--accent-text)' : 'var(--text2)',
});
const rangeBtn = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
  fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 700, transition: 'all 0.12s',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? 'var(--accent-text)' : 'var(--text2)',
});

const STAT_LABELS: Record<StatRange, string> = {
  month: 'This month', ytd: 'YTD', '1y': '1 Year', all: 'All time',
};

// Build a list of consecutive months (local-safe) from startDate up to and including curMonth
function buildMonthList(startDate: Date, curMonthKey: string): string[] {
  const result: string[] = [];
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (monthKeyLocal(d) <= curMonthKey) {
    result.push(monthKeyLocal(d));
    d.setMonth(d.getMonth() + 1);
  }
  return result;
}

function getStatTxns(txns: Transaction[], range: StatRange, today: Date, curMonthKey: string): Transaction[] {
  const y = today.getFullYear();
  if (range === 'month') return txns.filter(t => monthKey(t.date) === curMonthKey);
  if (range === 'ytd')   return txns.filter(t => t.date >= `${y}-01-01`);
  if (range === '1y') {
    const start = new Date(today.getFullYear() - 1, today.getMonth() + 1, 1);
    return txns.filter(t => t.date >= monthKeyLocal(start) + '-01');
  }
  return txns;
}

function getTableMonths(range: CatRange, today: Date, curMonthKey: string, txns: Transaction[]): string[] {
  const y = today.getFullYear(), mo = today.getMonth();
  if (range === '1m')  return [curMonthKey];
  if (range === '3m')  return buildMonthList(new Date(y, mo - 2, 1), curMonthKey);
  if (range === '6m')  return buildMonthList(new Date(y, mo - 5, 1), curMonthKey);
  if (range === 'ytd') return buildMonthList(new Date(y, 0, 1), curMonthKey);
  if (range === '1y')  return buildMonthList(new Date(y - 1, mo + 1, 1), curMonthKey);
  // all
  const allMK = [...new Set(txns.map(t => monthKey(t.date)))].sort();
  if (!allMK.length) return [curMonthKey];
  return buildMonthList(new Date(allMK[0] + 'T12:00:00'), curMonthKey);
}

function getTrendMonths(range: TrendRange, today: Date, curMonthKey: string, txns: Transaction[]): string[] {
  const y = today.getFullYear(), mo = today.getMonth();
  if (range === '6m')  return buildMonthList(new Date(y, mo - 5, 1), curMonthKey);
  if (range === 'ytd') return buildMonthList(new Date(y, 0, 1), curMonthKey);
  if (range === '1y')  return buildMonthList(new Date(y - 1, mo, 1), curMonthKey);
  const allMK = [...new Set(txns.map(t => monthKey(t.date)))].sort();
  if (!allMK.length) return [curMonthKey];
  return buildMonthList(new Date(allMK[0] + 'T12:00:00'), curMonthKey);
}

export default function Overview({ txns }: Props) {
  const today = new Date();
  const curMonthKey = monthKeyLocal(today);
  const prevMonthKey = monthKeyLocal(new Date(today.getFullYear(), today.getMonth() - 1, 1));

  const { isMobile } = useWindowSize();
  const [statRange,  setStatRange]  = useState<StatRange>('month');
  const [trendRange, setTrendRange] = useState<TrendRange>('6m');
  const [catRange,   setCatRange]   = useState<CatRange>('3m');

  // Stat cards
  const rangeTxns = getStatTxns(txns, statRange, today, curMonthKey);
  const income   = rangeTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = rangeTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;

  // Comparison banner (This month only)
  const day = today.getDate();
  const curSoFar  = txns.filter(t => monthKey(t.date) === curMonthKey && t.type === 'expense' && new Date(t.date + 'T12:00:00').getDate() <= day).reduce((s, t) => s + t.amount, 0);
  const prevSoFar = txns.filter(t => monthKey(t.date) === prevMonthKey && t.type === 'expense' && new Date(t.date + 'T12:00:00').getDate() <= day).reduce((s, t) => s + t.amount, 0);
  const compDiff  = prevSoFar - curSoFar;

  // Donut
  const byCat: Record<string, number> = {};
  rangeTxns.filter(t => t.type === 'expense').forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const donutData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([label, value]) => ({ label, value, color: CAT_MAP[label] || '#888' }));

  // Trend chart
  const trendMonths = getTrendMonths(trendRange, today, curMonthKey, txns);
  const trendLabels = trendMonths.map((mk, i) => {
    const step = trendMonths.length <= 7 ? 1 : trendMonths.length <= 13 ? 2 : 3;
    // always label the last point (current month)
    return (i % step === 0 || i === trendMonths.length - 1) ? monthLabel(mk).split(' ')[0] : '';
  });

  // Category table
  const tableMonths = getTableMonths(catRange, today, curMonthKey, txns);
  const allCats = [...new Set(txns.filter(t => t.type === 'expense' && tableMonths.includes(monthKey(t.date))).map(t => t.category))].sort();

  const CAT_RANGE_LABELS: Record<CatRange, string> = {
    '1m': '1M', '3m': '3M', '6m': '6M', ytd: 'YTD', '1y': '1Y', all: 'All',
  };

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '22px 24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      {/* Stat range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginRight: 4 }}>
          {STAT_LABELS[statRange]}
        </h2>
        {(['month', 'ytd', '1y', 'all'] as StatRange[]).map(r => (
          <button key={r} onClick={() => setStatRange(r)} style={pill(statRange === r)}>
            {isMobile ? (r === 'month' ? 'Mo' : r.toUpperCase()) : STAT_LABELS[r]}
          </button>
        ))}
        {statRange === 'month' && (
          <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 2 }}>Day {day}</span>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 8 : 12, marginBottom: 12 }}>
        <StatCard label="Income"   value={income}   color="var(--green)" sign={1} />
        <StatCard label="Expenses" value={expenses} color="var(--red)"   sign={-1} />
        <div style={isMobile ? { gridColumn: '1 / -1' } : undefined}>
          <StatCard label="Balance"  value={balance}  color={balance >= 0 ? 'var(--blue)' : 'var(--red)'} sign={1} />
        </div>
      </div>

      {/* Comparison banner — This month only */}
      {statRange === 'month' && prevSoFar > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          background: compDiff >= 0 ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
          border: `1px solid ${compDiff >= 0 ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.22)'}`,
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 14 }}>{compDiff >= 0 ? '📉' : '📈'}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Day {day} vs {monthLabel(prevMonthKey)}:</span>
          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>€{curSoFar.toFixed(2)} spent</span>
          {!isMobile && <span style={{ fontSize: 12, color: 'var(--text2)' }}>vs €{prevSoFar.toFixed(2)} then</span>}
          <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: compDiff >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
            {compDiff >= 0 ? `€${compDiff.toFixed(2)} less ✓` : `€${Math.abs(compDiff).toFixed(2)} more`}
          </span>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: 12, marginBottom: 12, minWidth: 0 }}>
        <div style={{ ...card, minWidth: 0, overflow: 'hidden' }}>
          <div style={cardTitle}>Expense Distribution</div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14, alignItems: isMobile ? 'stretch' : 'center' }}>
            <DonutChart data={donutData} size={isMobile ? 130 : 150} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              {donutData.slice(0, 7).map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{d.label}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>€{d.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...card, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <div style={cardTitle}>Monthly Trends</div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
              {(['6m', 'ytd', '1y', 'all'] as TrendRange[]).map(val => (
                <button key={val} onClick={() => setTrendRange(val)} style={rangeBtn(trendRange === val)}>
                  {val === '6m' ? '6M' : val === 'ytd' ? 'YTD' : val === '1y' ? '1Y' : 'All'}
                </button>
              ))}
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 12 }}>
                {([['Income', 'var(--green)'], ['Expenses', 'var(--red)'], ['Balance', 'var(--blue)']] as const).map(([l, c]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                    <span style={{ display: 'inline-block', width: 18, height: 2.5, background: c, borderRadius: 2 }} />
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>
          <AreaChart
            series={[
              { label: 'Income',   color: 'var(--green)', data: trendMonths.map(mk => getMonthStats(txns, mk).income) },
              { label: 'Expenses', color: 'var(--red)',   data: trendMonths.map(mk => getMonthStats(txns, mk).expenses) },
              { label: 'Balance',  color: 'var(--blue)',  data: trendMonths.map(mk => { const s = getMonthStats(txns, mk); return s.income - s.expenses; }) },
            ]}
            labels={trendLabels}
            height={isMobile ? 180 : 155}
          />
        </div>
      </div>

      {/* Category table with its own range */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={cardTitle}>Category Breakdown</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {(['1m', '3m', '6m', 'ytd', '1y', 'all'] as CatRange[]).map(r => (
              <button key={r} onClick={() => setCatRange(r)} style={rangeBtn(catRange === r)}>
                {CAT_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <CategoryTable txns={txns} tableMonths={tableMonths} allCats={allCats} />
      </div>
    </div>
  );
}
