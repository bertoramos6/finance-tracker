// api.js - Supabase API layer for database operations
import { supabase } from './auth.js';

/**
 * Fetch all transactions for the current user
 */
export async function fetchTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, type)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Create a new transaction
 */
export async function createTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        date: transaction.date,
        category_id: transaction.category_id,
        comment: transaction.comment || null,
      }])
      .select(`
        *,
        category:categories(id, name, type)
      `)
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id, updates) {
  try {
    const updateData = {
      ...(updates.type && { type: updates.type }),
      ...(updates.amount && { amount: parseFloat(updates.amount) }),
      ...(updates.date && { date: updates.date }),
      ...(updates.category_id && { category_id: updates.category_id }),
      ...(updates.comment !== undefined && { comment: updates.comment || null }),
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, type)
      `)
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { error: error.message };
  }
}

/**
 * Fetch all categories for the current user
 */
export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('name');
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Create a new custom category
 */
export async function createCategory(category) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        type: category.type,
        name: category.name,
        description: category.description || null,
        is_default: false,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating category:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id, updates) {
  try {
    const updateData = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description || null }),
    };
    
    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating category:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Delete a category (only custom categories can be deleted)
 */
export async function deleteCategory(id) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('is_default', false); // Extra safety check
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: error.message };
  }
}

/**
 * Batch create multiple transactions (for migration)
 */
export async function batchCreateTransactions(transactions) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select(`
        *,
        category:categories(id, name, type)
      `);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error batch creating transactions:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Batch create multiple categories (for migration)
 */
export async function batchCreateCategories(categories) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error batch creating categories:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Check if a category name already exists for the user
 */
export async function categoryExists(type, name) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('type', type)
      .eq('name', name)
      .maybeSingle();
    
    if (error) throw error;
    
    return { exists: data !== null, categoryId: data?.id, error: null };
  } catch (error) {
    console.error('Error checking category existence:', error);
    return { exists: false, categoryId: null, error: error.message };
  }
}
