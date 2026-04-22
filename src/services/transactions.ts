import { supabase } from './supabase';
import type { Transaction } from '../types';

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    date: r.date,
    category: r.category ?? '',
    description: r.description ?? '',
    created_at: r.created_at,
  }));
}

export async function insertTransaction(
  t: Omit<Transaction, 'id' | 'created_at'>,
  userId: string,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...t, user_id: userId }])
    .select()
    .single();
  if (error) throw error;
  return { ...data, description: data.description ?? '' };
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'created_at'>>,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, description: data.description ?? '' };
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
