// sync.js - Data synchronization and migration logic
import { fetchCategories, fetchTransactions, batchCreateCategories, batchCreateTransactions, categoryExists } from './api.js';

/**
 * Check if there's data in localStorage
 */
export function checkForLocalData() {
  const transactions = localStorage.getItem('finance-tracker-transactions');
  const categories = localStorage.getItem('finance-tracker-categories');
  
  const hasTransactions = transactions && JSON.parse(transactions).length > 0;
  const hasCategories = categories && JSON.parse(categories).length > 0;
  
  return {
    hasData: hasTransactions || hasCategories,
    transactionCount: hasTransactions ? JSON.parse(transactions).length : 0,
    categoryCount: hasCategories ? JSON.parse(categories).length : 0,
  };
}

/**
 * Migrate localStorage data to Supabase
 */
export async function migrateLocalDataToCloud() {
  try {
    const localTransactions = JSON.parse(localStorage.getItem('finance-tracker-transactions') || '[]');
    const localCategories = JSON.parse(localStorage.getItem('finance-tracker-categories') || '[]');
    
    // Fetch existing cloud categories to create a mapping
    const { data: cloudCategories, error: fetchError } = await fetchCategories();
    if (fetchError) throw new Error(fetchError);
    
    // Create a map of category names to IDs
    const categoryMap = new Map();
    cloudCategories.forEach(cat => {
      categoryMap.set(`${cat.type}:${cat.name}`, cat.id);
    });
    
    // Migrate custom categories first
    const categoriesToCreate = [];
    for (const localCat of localCategories) {
      const key = `${localCat.type}:${localCat.name}`;
      
      // Check if category already exists
      if (!categoryMap.has(key)) {
        categoriesToCreate.push({
          type: localCat.type,
          name: localCat.name,
          description: localCat.description || null,
          is_default: false,
        });
      }
    }
    
    // Batch create custom categories
    let newCategories = [];
    if (categoriesToCreate.length > 0) {
      const { data, error } = await batchCreateCategories(categoriesToCreate);
      if (error) throw new Error(error);
      newCategories = data;
      
      // Add new categories to the map
      newCategories.forEach(cat => {
        categoryMap.set(`${cat.type}:${cat.name}`, cat.id);
      });
    }
    
    // Migrate transactions
    const transactionsToCreate = [];
    for (const localTx of localTransactions) {
      // Find the category ID from the map
      // Local transactions might have category as a string name
      const categoryKey = `${localTx.type}:${localTx.category}`;
      const categoryId = categoryMap.get(categoryKey);
      
      if (!categoryId) {
        console.warn(`Category not found for transaction: ${localTx.category}`);
        continue; // Skip transactions with unknown categories
      }
      
      transactionsToCreate.push({
        type: localTx.type,
        amount: parseFloat(localTx.amount),
        date: localTx.date,
        category_id: categoryId,
        comment: localTx.comment || null,
      });
    }
    
    // Batch create transactions
    let migratedTransactions = [];
    if (transactionsToCreate.length > 0) {
      const { data, error } = await batchCreateTransactions(transactionsToCreate);
      if (error) throw new Error(error);
      migratedTransactions = data;
    }
    
    return {
      success: true,
      categoriesMigrated: newCategories.length,
      transactionsMigrated: migratedTransactions.length,
      error: null,
    };
  } catch (error) {
    console.error('Error migrating data:', error);
    return {
      success: false,
      categoriesMigrated: 0,
      transactionsMigrated: 0,
      error: error.message,
    };
  }
}

/**
 * Clear localStorage data after successful migration
 */
export function clearLocalData() {
  localStorage.removeItem('finance-tracker-transactions');
  localStorage.removeItem('finance-tracker-categories');
}

/**
 * Backup localStorage data before migration
 */
export function backupLocalData() {
  const transactions = localStorage.getItem('finance-tracker-transactions');
  const categories = localStorage.getItem('finance-tracker-categories');
  
  const backup = {
    transactions: transactions ? JSON.parse(transactions) : [],
    categories: categories ? JSON.parse(categories) : [],
    timestamp: new Date().toISOString(),
  };
  
  // Create a downloadable backup file
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-tracker-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return backup;
}

/**
 * Sync data from cloud to local state
 */
export async function syncFromCloud() {
  try {
    const [categoriesResult, transactionsResult] = await Promise.all([
      fetchCategories(),
      fetchTransactions(),
    ]);
    
    if (categoriesResult.error) throw new Error(categoriesResult.error);
    if (transactionsResult.error) throw new Error(transactionsResult.error);
    
    return {
      categories: categoriesResult.data,
      transactions: transactionsResult.data,
      error: null,
    };
  } catch (error) {
    console.error('Error syncing from cloud:', error);
    return {
      categories: null,
      transactions: null,
      error: error.message,
    };
  }
}

/**
 * Check if migration has been completed
 */
export function isMigrationCompleted() {
  return localStorage.getItem('finance-tracker-migration-completed') === 'true';
}

/**
 * Mark migration as completed
 */
export function markMigrationCompleted() {
  localStorage.setItem('finance-tracker-migration-completed', 'true');
}

/**
 * Reset migration status (for testing)
 */
export function resetMigrationStatus() {
  localStorage.removeItem('finance-tracker-migration-completed');
}
