import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';

export function useTransactions(userId: string) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchTransactions()
      .then(setTxns)
      .finally(() => setLoading(false));
  }, [userId]);

  const addTxn = async (t: Omit<Transaction, 'id' | 'created_at'>) => {
    const created = await insertTransaction(t, userId);
    setTxns(prev => [created, ...prev]);
  };

  const updateTxn = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
    const updated = await updateTransaction(id, updates);
    setTxns(prev => prev.map(t => (t.id === id ? updated : t)));
  };

  const removeTxn = async (id: string) => {
    await deleteTransaction(id);
    setTxns(prev => prev.filter(t => t.id !== id));
  };

  return { txns, loading, addTxn, updateTxn, removeTxn };
}
