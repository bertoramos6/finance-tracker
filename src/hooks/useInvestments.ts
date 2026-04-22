import { useState, useEffect } from 'react';
import type { Investment } from '../types';
import {
  fetchInvestments,
  insertInvestment,
  deleteInvestment,
  upsertEntry,
} from '../services/investments';

export function useInvestments(userId: string) {
  const [invs, setInvs] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchInvestments(userId)
      .then(setInvs)
      .finally(() => setLoading(false));
  }, [userId]);

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

  return { invs, loading, addInv, removeInv, updateEntry };
}
