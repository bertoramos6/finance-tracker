import type { Transaction } from '../types';

export function exportCSV(txns: Transaction[]): void {
  const rows = [
    ['Date', 'Type', 'Amount', 'Category', 'Description'],
    ...txns.map(t => [t.date, t.type, String(t.amount), t.category, t.description]),
  ];
  const csv = rows
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'transactions.csv';
  a.click();
}
