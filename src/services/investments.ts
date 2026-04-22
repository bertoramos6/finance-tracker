import { supabase } from './supabase';
import type { Investment, InvestmentEntry } from '../types';

export async function fetchInvestments(userId: string): Promise<Investment[]> {
  const { data: invData, error: invErr } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order');
  if (invErr) throw invErr;

  const { data: entData, error: entErr } = await supabase
    .from('investment_entries')
    .select('*')
    .eq('user_id', userId)
    .order('month');
  if (entErr) throw entErr;

  return (invData ?? []).map(inv => ({
    id: inv.id,
    name: inv.name,
    type: inv.type,
    sort_order: inv.sort_order,
    entries: (entData ?? [])
      .filter(e => e.investment_id === inv.id)
      .map(e => ({ id: e.id, investment_id: e.investment_id, month: e.month, value: e.value })),
  }));
}

export async function insertInvestment(
  inv: { name: string; type: string },
  userId: string,
): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    .insert([{ name: inv.name, type: inv.type, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return { ...data, entries: [] };
}

export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase.from('investments').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertEntry(
  entry: InvestmentEntry & { investment_id: string },
  userId: string,
): Promise<InvestmentEntry> {
  const { data, error } = await supabase
    .from('investment_entries')
    .upsert(
      [{ investment_id: entry.investment_id, month: entry.month, value: entry.value, user_id: userId }],
      { onConflict: 'investment_id,month' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
