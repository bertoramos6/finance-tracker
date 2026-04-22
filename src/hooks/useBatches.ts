import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface BatchEntry {
  id: string;
  batch_id?: string;
  category: string;
  amount: number;
  description: string;
  sort_order?: number;
}

export interface BatchTemplate {
  id: string;
  name: string;
  entries: BatchEntry[];
}

function uid() { return Math.random().toString(36).slice(2); }

export function useBatches(userId: string) {
  const [batches, setBatches] = useState<BatchTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: tmpl } = await supabase
        .from('batch_templates')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order');
      const { data: entries } = await supabase
        .from('batch_entries')
        .select('*')
        .in('batch_id', (tmpl ?? []).map(t => t.id))
        .order('sort_order');
      setBatches((tmpl ?? []).map(t => ({
        id: t.id, name: t.name,
        entries: (entries ?? []).filter(e => e.batch_id === t.id),
      })));
      setLoading(false);
    })();
  }, [userId]);

  const createBatch = async (name: string): Promise<string> => {
    const { data } = await supabase
      .from('batch_templates')
      .insert([{ name, user_id: userId }])
      .select()
      .single();
    const newBatch: BatchTemplate = { id: data.id, name: data.name, entries: [] };
    setBatches(p => [...p, newBatch]);
    return data.id;
  };

  const renameBatch = async (id: string, name: string) => {
    await supabase.from('batch_templates').update({ name }).eq('id', id);
    setBatches(p => p.map(b => b.id === id ? { ...b, name } : b));
  };

  const deleteBatch = async (id: string) => {
    await supabase.from('batch_templates').delete().eq('id', id);
    setBatches(p => p.filter(b => b.id !== id));
  };

  const addEntry = async (batchId: string, entry: Omit<BatchEntry, 'id' | 'batch_id'>) => {
    const { data } = await supabase
      .from('batch_entries')
      .insert([{ ...entry, batch_id: batchId }])
      .select()
      .single();
    setBatches(p => p.map(b => b.id === batchId
      ? { ...b, entries: [...b.entries, data] }
      : b));
  };

  const updateEntry = async (batchId: string, entryId: string, patch: Partial<Omit<BatchEntry, 'id'>>) => {
    await supabase.from('batch_entries').update(patch).eq('id', entryId);
    setBatches(p => p.map(b => b.id === batchId
      ? { ...b, entries: b.entries.map(e => e.id === entryId ? { ...e, ...patch } : e) }
      : b));
  };

  const deleteEntry = async (batchId: string, entryId: string) => {
    await supabase.from('batch_entries').delete().eq('id', entryId);
    setBatches(p => p.map(b => b.id === batchId
      ? { ...b, entries: b.entries.filter(e => e.id !== entryId) }
      : b));
  };

  return { batches, loading, createBatch, renameBatch, deleteBatch, addEntry, updateEntry, deleteEntry };
}
