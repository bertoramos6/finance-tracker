// ============================================
// Phase 3C: Cloud Integration - Main Entry Point
// ============================================
// This file integrates authentication, API, and sync with the existing app

import { initAuth, signUp, signIn, signOut, getCurrentUser, onAuthStateChange, isAuthenticated } from './auth.js';
import { fetchTransactions, fetchCategories, createTransaction, updateTransaction, deleteTransaction, createCategory, updateCategory, deleteCategory } from './api.js';
import { checkForLocalData, migrateLocalDataToCloud, syncFromCloud, isMigrationCompleted, markMigrationCompleted, clearLocalData } from './sync.js';

// ============================================
// AUTHENTICATION UI HANDLERS
// ============================================

// DOM Elements - Auth
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');

// Error/Success elements
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const signupSuccess = document.getElementById('signup-success');

// Migration modal
const migrationModal = document.getElementById('migration-modal');
const migrationConfirmBtn = document.getElementById('migration-confirm');
const migrationSkipBtn = document.getElementById('migration-skip');

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('Initializing Finance Tracker...');
  
  // Setup auth UI event listeners
  setupAuthEventListeners();
  
  // Check for existing session
  const user = await initAuth();
  
  if (user) {
    console.log('User already logged in:', user.email);
    await handleUserLoggedIn(user);
  } else {
    console.log('No active session, showing login');
    showAuthUI();
  }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
  // Toggle between login and signup
  showSignupBtn.addEventListener('click', () => {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'block';
    clearAuthErrors();
  });
  
  showLoginBtn.addEventListener('click', () => {
    signupContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    clearAuthErrors();
  });
  
  // Login form
  loginForm.addEventListener('submit', handleLogin);
  
  // Signup form
  signupForm.addEventListener('submit', handleSignup);
  
  // Logout button
  logoutBtn.addEventListener('click', handleLogout);
  
  // Migration modal
  migrationConfirmBtn.addEventListener('click', handleMigrationConfirm);
  migrationSkipBtn.addEventListener('click', handleMigrationSkip);
  
  // Listen for auth state changes
  onAuthStateChange(async (user) => {
    if (user) {
      await handleUserLoggedIn(user);
    } else {
      showAuthUI();
    }
  });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  // Show loading state
  setButtonLoading('login-submit', true);
  clearAuthErrors();
  
  const { user, error } = await signIn(email, password);
  
  setButtonLoading('login-submit', false);
  
  if (error) {
    showError(loginError, error);
  } else {
    console.log('Login successful:', user.email);
    // handleUserLoggedIn will be called by onAuthStateChange
  }
}

/**
 * Handle signup form submission
 */
async function handleSignup(e) {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-password-confirm').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showError(signupError, 'Passwords do not match');
    return;
  }
  
  // Show loading state
  setButtonLoading('signup-submit', true);
  clearAuthErrors();
  
  const { user, error } = await signUp(email, password);
  
  setButtonLoading('signup-submit', false);
  
  if (error) {
    showError(signupError, error);
  } else {
    showSuccess(signupSuccess, 'Account created successfully! Please check your email to confirm your account.');
    // Clear form
    signupForm.reset();
    // Switch to login after 2 seconds
    setTimeout(() => {
      showLoginBtn.click();
    }, 2000);
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  const { error } = await signOut();
  
  if (error) {
    console.error('Logout error:', error);
    alert('Error signing out. Please try again.');
  } else {
    console.log('Logged out successfully');
    // showAuthUI will be called by onAuthStateChange
  }
}

/**
 * Handle user logged in
 */
async function handleUserLoggedIn(user) {
  console.log('Handling logged in user:', user.email);
  
  // Update UI
  userEmailSpan.textContent = user.email;
  authContainer.style.display = 'none';
  appContainer.style.display = 'block';
  
  // Check for local data migration
  if (!isMigrationCompleted()) {
    const localData = checkForLocalData();
    
    if (localData.hasData) {
      showMigrationModal(localData);
    } else {
      // No local data, just load from cloud
      await loadCloudData();
      markMigrationCompleted();
    }
  } else {
    // Already migrated, load from cloud
    await loadCloudData();
  }
  
  // Initialize the main app (from original app.js)
  initMainApp();
}

/**
 * Show migration modal
 */
function showMigrationModal(localData) {
  document.getElementById('migration-transaction-count').textContent = localData.transactionCount;
  document.getElementById('migration-category-count').textContent = localData.categoryCount;
  migrationModal.classList.add('active');
}

/**
 * Handle migration confirmation
 */
async function handleMigrationConfirm() {
  console.log('Starting data migration...');
  
  // Show loading state
  migrationConfirmBtn.disabled = true;
  migrationConfirmBtn.innerHTML = `
    <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Migrating...
  `;
  
  const result = await migrateLocalDataToCloud();
  
  migrationModal.classList.remove('active');
  
  if (result.success) {
    alert(`Successfully migrated ${result.transactionsMigrated} transactions and ${result.categoriesMigrated} categories!`);
    markMigrationCompleted();
    await loadCloudData();
  } else {
    alert(`Migration failed: ${result.error}. Your local data is still safe.`);
  }
  
  // Reset button
  migrationConfirmBtn.disabled = false;
  migrationConfirmBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    Migrate Data
  `;
}

/**
 * Handle migration skip
 */
async function handleMigrationSkip() {
  migrationModal.classList.remove('active');
  markMigrationCompleted();
  await loadCloudData();
}

/**
 * Load data from cloud
 */
async function loadCloudData() {
  console.log('Loading data from cloud...');
  
  setSyncStatus('syncing');
  
  const { categories, transactions, error } = await syncFromCloud();
  
  if (error) {
    console.error('Error loading cloud data:', error);
    setSyncStatus('offline');
    alert('Error loading data from cloud. Using local data.');
    return;
  }
  
  // Update global state (these will be defined in the main app)
  window.cloudCategories = categories || [];
  window.cloudTransactions = transactions || [];
  
  setSyncStatus('synced');
  console.log(`Loaded ${transactions?.length || 0} transactions and ${categories?.length || 0} categories`);
}

/**
 * Show auth UI
 */
function showAuthUI() {
  authContainer.style.display = 'flex';
  appContainer.style.display = 'none';
  loginContainer.style.display = 'block';
  signupContainer.style.display = 'none';
  clearAuthErrors();
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  const textSpan = button.querySelector('.btn-text');
  const loadingSpan = button.querySelector('.btn-loading');
  
  if (loading) {
    textSpan.style.display = 'none';
    loadingSpan.style.display = 'flex';
    button.disabled = true;
  } else {
    textSpan.style.display = 'block';
    loadingSpan.style.display = 'none';
    button.disabled = false;
  }
}

/**
 * Show error message
 */
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

/**
 * Show success message
 */
function showSuccess(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

/**
 * Clear auth errors
 */
function clearAuthErrors() {
  [loginError, signupError, signupSuccess].forEach(el => {
    el.classList.remove('show');
    el.textContent = '';
  });
}

/**
 * Set sync status
 */
function setSyncStatus(status) {
  const syncStatusEl = document.getElementById('sync-status');
  syncStatusEl.className = 'sync-status ' + status;
  
  const statusText = {
    'synced': 'Synced',
    'syncing': 'Syncing...',
    'offline': 'Offline'
  };
  
  syncStatusEl.querySelector('span') ? 
    syncStatusEl.lastChild.textContent = statusText[status] :
    syncStatusEl.textContent = statusText[status];
}

/**
 * Initialize main app (placeholder - will be replaced with actual app.js logic)
 */
function initMainApp() {
  console.log('Initializing main app...');
  // The original app.js init() function will be called here
  // For now, we'll just log
  if (typeof init === 'function') {
    init();
  }
}

// ============================================
// START THE APP
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for use in other modules
export { loadCloudData, setSyncStatus };
