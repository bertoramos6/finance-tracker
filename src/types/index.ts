export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
  description: string;
  created_at?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  sort_order?: number;
  entries: InvestmentEntry[];
}

export interface InvestmentEntry {
  id?: string;
  investment_id?: string;
  month: string;
  value: number;
}

export type DateFilter = '6m' | '1y' | 'all';
export type InvRange = '1m' | '3m' | '6m' | 'ytd' | '1y' | 'all';
