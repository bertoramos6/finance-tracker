import { supabase } from './supabase';

export type CustomTypeKind = 'expense' | 'investment';

export interface CustomType {
  kind: CustomTypeKind;
  name: string;
  color: string | null;
}

export async function fetchCustomTypes(): Promise<CustomType[]> {
  const { data, error } = await supabase
    .from('custom_types')
    .select('kind, name, color')
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function insertCustomTypes(types: CustomType[], userId: string): Promise<void> {
  const { error } = await supabase
    .from('custom_types')
    .upsert(types.map(t => ({ ...t, user_id: userId })), { onConflict: 'user_id,kind,name', ignoreDuplicates: true });
  if (error) throw error;
}
