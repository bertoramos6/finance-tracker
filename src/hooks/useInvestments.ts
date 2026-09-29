import { useState, useEffect, useCallback } from 'react';
import type { Investment } from '../types';
import { errorMessage } from '../utils';
import {
  fetchInvestments,
  insertInvestment,
  deleteInvestment,
  upsertEntry,
} from '../services/investments';

export function useInvestments(userId: string) {
  const [invs, setInvs] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!userId) return;
    setError(null);
    fetchInvestments(userId)
      .then(setInvs)
      .catch(e => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(load, [load]);

  const addInv = async (inv: { name: string; type: string }) => {
    const created = await insertInvestment(inv, userId);
    setInvs(prev => [...prev, created]);
  };

  const removeInv = async (id: string) => {
    await deleteInvestment(id);
    setInvs(prev => prev.filter(i => i.id !== id));
  };

  const updateEntry = async (invId: string, month: string, value: number) => {
    await upsertEntry({ investment_id: invId, month, value }, userId);
    setInvs(prev =>
      prev.map(inv => {
        if (inv.id !== invId) return inv;
        const entries = inv.entries.filter(e => e.month !== month);
        return {
          ...inv,
          entries: [...entries, { month, value }].sort((a, b) => a.month.localeCompare(b.month)),
        };
      }),
    );
  };

  return { invs, loading, error, reload: load, addInv, removeInv, updateEntry };
}
