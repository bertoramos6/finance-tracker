export function fmtEur(n: number): string {
  return '€' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES');
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

// Use this when building monthKeys from JS Date objects — avoids UTC offset shifting the month
export function monthKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getMonthStats(txns: import('../types').Transaction[], mk: string) {
  const mt = txns.filter(t => monthKey(t.date) === mk);
  const income   = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses, txns: mt };
}
