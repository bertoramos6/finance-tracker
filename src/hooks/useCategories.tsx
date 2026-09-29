import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CATEGORIES, type Category } from '../constants/categories';
import { DEFAULT_INVESTMENT_TYPES } from '../constants/investmentTypes';
import { fetchCustomTypes, insertCustomTypes, type CustomType } from '../services/customTypes';
import { errorMessage } from '../utils';

const EXTRA_COLORS = ['#e879f9', '#facc15', '#f97316', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#8b5cf6', '#ef4444'];
const LEGACY_INV_TYPES_KEY = 'ft_inv_types';

interface CategoriesValue {
  expenseCats: Category[];
  catMap: Record<string, string>;
  invTypes: string[];
  addExpenseCat: (name: string) => Promise<void>;
  addInvType: (name: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesValue | null>(null);

export function useCustomTypes(userId: string) {
  const [custom, setCustom] = useState<CustomType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      // One-time move of investment types that used to live only in this browser
      const legacy: string[] = JSON.parse(localStorage.getItem(LEGACY_INV_TYPES_KEY) || '[]');
      if (legacy.length) {
        await insertCustomTypes(legacy.map(name => ({ kind: 'investment', name, color: null })), userId);
        localStorage.removeItem(LEGACY_INV_TYPES_KEY);
      }
      setCustom(await fetchCustomTypes());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const add = async (t: CustomType) => {
    await insertCustomTypes([t], userId);
    setCustom(prev => prev.some(p => p.kind === t.kind && p.name === t.name) ? prev : [...prev, t]);
  };

  const customExpense = custom.filter(t => t.kind === 'expense' && !CATEGORIES.some(c => c.name === t.name));
  const expenseCats: Category[] = [
    ...CATEGORIES,
    ...customExpense.map((t, i) => ({ name: t.name, color: t.color ?? EXTRA_COLORS[i % EXTRA_COLORS.length] })),
  ];

  const value: CategoriesValue = {
    expenseCats,
    catMap: Object.fromEntries(expenseCats.map(c => [c.name, c.color])),
    invTypes: [...DEFAULT_INVESTMENT_TYPES, ...custom.filter(t => t.kind === 'investment' && !DEFAULT_INVESTMENT_TYPES.includes(t.name)).map(t => t.name)],
    addExpenseCat: name => {
      const used = new Set(expenseCats.map(c => c.color));
      const color = EXTRA_COLORS.find(c => !used.has(c)) ?? EXTRA_COLORS[customExpense.length % EXTRA_COLORS.length];
      return add({ kind: 'expense', name, color });
    },
    addInvType: name => add({ kind: 'investment', name, color: null }),
  };

  return { value, error, reload: load };
}

export function CategoriesProvider({ value, children }: { value: CategoriesValue; children: ReactNode }) {
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider');
  return ctx;
}
