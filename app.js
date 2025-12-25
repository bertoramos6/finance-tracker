// Import cloud modules
import { initAuth, getCurrentUser, onAuthStateChange } from './auth.js';
import { 
  fetchTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from './api.js';
import { 
  checkForLocalData, 
  migrateLocalDataToCloud, 
  clearLocalData,
  syncFromCloud,
  isMigrationCompleted,
  markMigrationCompleted
} from './sync.js';

// Application State
let transactions = [];
let cloudCategories = []; // Categories from Supabase
let currentTransactionType = 'expense';
let categoryChart = null;
let trendChart = null;
let dateFilter = { start: null, end: null };
let currentEditingId = null;
let currentCategoryType = 'expense'; // For category management tab
let currentEditingCategoryId = null;

// Get all categories for a type
function getCategories(type) {
  return cloudCategories.filter(cat => cat.type === type);
}

// DOM Elements - Migration
const migrationModal = document.getElementById('migration-modal');
const migrationTransactionCount = document.getElementById('migration-transaction-count');
const migrationCategoryCount = document.getElementById('migration-category-count');
const migrateBtnConfirm = document.getElementById('migration-confirm');
const migrateBtnSkip = document.getElementById('migration-skip');

// DOM Elements - App
const appContainer = document.getElementById('app-container');
const transactionForm = document.getElementById('transaction-form');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categorySelect = document.getElementById('category');
const commentInput = document.getElementById('comment');
const successMessage = document.getElementById('success-message');
const transactionList = document.getElementById('transaction-list');
const exportCsvBtn = document.getElementById('export-csv');

// Initialize App
async function init() {
  console.log('[INIT] Starting app initialization...');
  try {
    // Initialize anonymous authentication
    console.log('[INIT] Calling initAuth()...');
    const user = await initAuth();
    
    if (!user) {
      console.error('[INIT] Failed to initialize anonymous session - no user returned');
      alert('Failed to initialize app. Please check your Supabase configuration and ensure Anonymous authentication is enabled.');
      return;
    }
    
    console.log('[INIT] Anonymous user authenticated:', user.id);
    console.log('[INIT] User email:', user.email);
    console.log('[INIT] Full user object:', user);
    
    // Show app UI
    appContainer.style.display = 'block';
    console.log('[INIT] App container displayed');
    
    // Check for local data migration
    const localData = checkForLocalData();
    const migrationCompleted = isMigrationCompleted();
    console.log('[INIT] Migration check:', { hasData: localData.hasData, migrationCompleted });
    
    if (localData.hasData && !migrationCompleted) {
      // Show migration modal
      console.log('[INIT] Showing migration modal');
      showMigrationModal(localData);
    } else {
      // Load data from cloud
      console.log('[INIT] Loading cloud data...');
      await loadCloudData();
    }
    
    // Setup migration event listeners
    migrateBtnConfirm.addEventListener('click', handleMigrationConfirm);
    migrateBtnSkip.addEventListener('click', handleMigrationSkip);
    
    console.log('[INIT] Initialization complete');
  } catch (error) {
    console.error('[INIT] Error initializing app:', error);
    alert(`Failed to initialize app: ${error.message}\n\nPlease check:\n1. Your .env file has correct Supabase credentials\n2. Anonymous authentication is enabled in Supabase Dashboard`);
  }
}

// Handle user logged in

// Show migration modal
function showMigrationModal(localData) {
  migrationTransactionCount.textContent = localData.transactionCount;
  migrationCategoryCount.textContent = localData.categoryCount;
  migrationModal.style.display = 'flex';
}

// Hide migration modal
function hideMigrationModal() {
  migrationModal.style.display = 'none';
}

// Load data from cloud
async function loadCloudData() {
  try {
    const result = await syncFromCloud();
    
    if (result.error) {
      console.error('Error loading cloud data:', result.error);
      alert('Failed to load data from cloud: ' + result.error);
      return;
    }
    
    // Update local state
    cloudCategories = result.categories || [];
    transactions = result.transactions || [];
    
    // Initialize UI
    initializeApp();
  } catch (error) {
    console.error('Error in loadCloudData:', error);
  }
}

// Initialize app UI after data is loaded
function initializeApp() {
  // Set today's date as default
  dateInput.valueAsDate = new Date();
  
  // Setup event listeners (must be done after app UI is visible)
  setupEventListeners();
  
  // Populate categories
  populateCategories(currentTransactionType);
  
  // Populate year selector
  populateYearSelector();
  
  // Apply default filter (This Year)
  applyThisYearFilter();
  
  // Render transactions
  renderTransactions();
}

// Handle migration - Confirm
async function handleMigrationConfirm() {
  // Disable buttons
  migrateBtnConfirm.disabled = true;
  migrateBtnSkip.disabled = true;
  
  try {
    const result = await migrateLocalDataToCloud();
    
    if (result.success) {
      // Clear local data
      clearLocalData();
      
      // Mark migration as completed
      markMigrationCompleted();
      
      // Hide modal
      hideMigrationModal();
      
      // Load cloud data
      await loadCloudData();
    } else {
      alert(`Migration failed: ${result.error}`);
      migrateBtnConfirm.disabled = false;
      migrateBtnSkip.disabled = false;
    }
  } catch (error) {
    alert('An unexpected error occurred during migration');
    migrateBtnConfirm.disabled = false;
    migrateBtnSkip.disabled = false;
  }
}

// Handle migration - Skip
async function handleMigrationSkip() {
  // Mark migration as completed (user chose not to migrate)
  markMigrationCompleted();
  
  // Clear local data
  clearLocalData();
  
  // Hide modal
  hideMigrationModal();
  
  // Load cloud data
  await loadCloudData();
}

// Setup Event Listeners
function setupEventListeners() {
  // Transaction type toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTransactionType = btn.dataset.type;
      populateCategories(currentTransactionType);
    });
  });

  // Category type toggle (for category management)
  document.querySelectorAll('.category-type-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-type-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryType = btn.dataset.categoryType;
      renderCategories();
    });
  });

  // Form submit
  transactionForm.addEventListener('submit', handleFormSubmit);

  // Export CSV
  exportCsvBtn.addEventListener('click', exportToCSV);

  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // Date filter
  document.getElementById('apply-filter').addEventListener('click', applyDateFilter);
  document.getElementById('reset-filter').addEventListener('click', resetDateFilter);
  
  // Quick filters
  document.querySelectorAll('.btn-quick-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-quick-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      if (filter === 'this-year') {
        applyThisYearFilter();
      } else if (filter === 'all-time') {
        applyAllTimeFilter();
      }
    });
  });
  
  // Year selector
  const yearSelector = document.getElementById('year-selector');
  if (yearSelector) {
    yearSelector.addEventListener('change', (e) => {
      applyYearFilter(e.target.value);
    });
  }
}

// Switch Tab
function switchTab(tabName) {
  // Update nav buttons
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Render content based on tab
  if (tabName === 'overview') {
    renderOverviewTab();
  } else if (tabName === 'categories') {
    renderCategories();
  }
}

// Populate Categories
function populateCategories(type) {
  const categories = getCategories(type);
  categorySelect.innerHTML = '';
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    if (cat.description) {
      option.title = cat.description;
    }
    categorySelect.appendChild(option);
  });
}

// Handle Form Submit
async function handleFormSubmit(e) {
  e.preventDefault();

  const amount = parseFloat(amountInput.value);
  const date = dateInput.value;
  const category_id = categorySelect.value;
  const comment = commentInput.value.trim();

  if (!amount || !date || !category_id) {
    alert('Please fill in all required fields');
    return;
  }

  const transaction = {
    type: currentTransactionType,
    amount,
    date,
    category_id,
    comment: comment || null
  };

  try {
    const { data, error } = await createTransaction(transaction);

    if (error) {
      alert('Error creating transaction: ' + error);
      return;
    }

    // Add to local state
    transactions.unshift(data);

    // Reset form
    transactionForm.reset();
    dateInput.valueAsDate = new Date();

    // Show success message
    showSuccessMessage();

    // Re-render
    renderTransactions();
    if (document.getElementById('overview-tab').classList.contains('active')) {
      renderOverviewTab();
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    alert('An unexpected error occurred');
  }
}

// Show Success Message
function showSuccessMessage() {
  successMessage.style.display = 'block';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

// Render Transactions
function renderTransactions() {
  if (transactions.length === 0) {
    transactionList.innerHTML = '<p class="empty-state">No transactions yet. Add your first transaction above!</p>';
    return;
  }

  transactionList.innerHTML = '';

  transactions.forEach(transaction => {
    const card = document.createElement('div');
    card.className = 'transaction-card';

    const categoryName = transaction.category?.name || 'Unknown';
    const isIncome = transaction.type === 'income';

    card.innerHTML = `
      <div class="transaction-header">
        <div class="transaction-category">
          <span class="category-icon">${isIncome ? '💰' : '💸'}</span>
          <span class="category-name">${categoryName}</span>
        </div>
        <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
          ${isIncome ? '+' : '-'}$${transaction.amount.toFixed(2)}
        </div>
      </div>
      <div class="transaction-details">
        <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
        ${transaction.comment ? `<div class="transaction-comment">${transaction.comment}</div>` : ''}
      </div>
      <div class="transaction-actions">
        <button class="btn-icon" onclick="window.openEditModal('${transaction.id}')" title="Edit">
          <span>✏️</span>
        </button>
        <button class="btn-icon" onclick="window.openDeleteModal('${transaction.id}')" title="Delete">
          <span>🗑️</span>
        </button>
      </div>
    `;

    transactionList.appendChild(card);
  });
}

// Export to CSV
function exportToCSV() {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  // Create CSV header
  let csv = 'Date,Type,Category,Amount,Comment\n';

  // Add transaction rows
  transactions.forEach(transaction => {
    const categoryName = transaction.category?.name || 'Unknown';
    const date = transaction.date;
    const type = transaction.type;
    const amount = transaction.amount;
    const comment = (transaction.comment || '').replace(/,/g, ';'); // Replace commas in comments

    csv += `${date},${type},${categoryName},${amount},"${comment}"\n`;
  });

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// OVERVIEW TAB - DATA VISUALIZATION FUNCTIONS
// ============================================

// Date Filter Functions
function applyDateFilter() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  dateFilter.start = startDate || null;
  dateFilter.end = endDate || null;

  renderOverviewTab();
}

function resetDateFilter() {
  dateFilter.start = null;
  dateFilter.end = null;
  document.getElementById('start-date').value = '';
  document.getElementById('end-date').value = '';
  renderOverviewTab();
}

function getFilteredTransactions() {
  let filtered = [...transactions];

  if (dateFilter.start) {
    filtered = filtered.filter(t => t.date >= dateFilter.start);
  }
  if (dateFilter.end) {
    filtered = filtered.filter(t => t.date <= dateFilter.end);
  }

  return filtered;
}

// Quick filter functions
function applyThisYearFilter() {
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;
  
  document.getElementById('filter-start-date').value = `${currentYear}-01`;
  document.getElementById('filter-end-date').value = `${currentYear}-12`;
  
  dateFilter.start = startDate;
  dateFilter.end = endDate;
  
  renderOverviewTab();
}

function applyAllTimeFilter() {
  dateFilter.start = null;
  dateFilter.end = null;
  
  document.getElementById('filter-start-date').value = '';
  document.getElementById('filter-end-date').value = '';
  
  renderOverviewTab();
}

function applyYearFilter(year) {
  if (!year) return;
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  document.getElementById('filter-start-date').value = `${year}-01`;
  document.getElementById('filter-end-date').value = `${year}-12`;
  
  dateFilter.start = startDate;
  dateFilter.end = endDate;
  
  // Update quick filter buttons
  document.querySelectorAll('.btn-quick-filter').forEach(b => b.classList.remove('active'));
  
  renderOverviewTab();
}

// Populate year selector
function populateYearSelector() {
  const yearSelector = document.getElementById('year-selector');
  if (!yearSelector || transactions.length === 0) return;
  
  // Get all unique years from transactions
  const years = new Set();
  transactions.forEach(t => {
    const year = new Date(t.date).getFullYear();
    years.add(year);
  });
  
  // Sort years descending
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  
  // Populate selector
  yearSelector.innerHTML = '<option value="">Select Year</option>';
  sortedYears.forEach(year => {
    yearSelector.innerHTML += `<option value="${year}">${year}</option>`;
  });
}

// Data Processing Functions
function calculateSummaryStats(filteredTransactions) {
  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = income - expenses;

  const avgIncome = income / Math.max(1, filteredTransactions.filter(t => t.type === 'income').length);
  const avgExpense = expenses / Math.max(1, filteredTransactions.filter(t => t.type === 'expense').length);

  return {
    income,
    expenses,
    balance,
    avgIncome,
    avgExpense,
    transactionCount: filteredTransactions.length
  };
}

function getMonthlyData(filteredTransactions) {
  const monthlyData = {};

  filteredTransactions.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    monthlyData[month][t.type] += parseFloat(t.amount);
  });

  return monthlyData;
}

function getCategoryData(filteredTransactions) {
  const categoryData = {};

  filteredTransactions.forEach(t => {
    const categoryName = t.category?.name || 'Unknown';
    const key = `${t.type}-${categoryName}`;
    
    if (!categoryData[key]) {
      categoryData[key] = {
        name: categoryName,
        type: t.type,
        total: 0,
        count: 0
      };
    }
    categoryData[key].total += parseFloat(t.amount);
    categoryData[key].count++;
  });

  return Object.values(categoryData);
}

function getExpenseBreakdown(filteredTransactions) {
  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const breakdown = {};
  expenses.forEach(t => {
    const categoryName = t.category?.name || 'Unknown';
    if (!breakdown[categoryName]) {
      breakdown[categoryName] = {
        total: 0,
        count: 0,
        percentage: 0
      };
    }
    breakdown[categoryName].total += parseFloat(t.amount);
    breakdown[categoryName].count++;
  });

  // Calculate percentages
  Object.keys(breakdown).forEach(cat => {
    breakdown[cat].percentage = (breakdown[cat].total / totalExpenses) * 100;
  });

  // Sort by total descending
  return Object.entries(breakdown)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
}

// Rendering Functions
function renderOverviewTab() {
  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    renderNoDataMessage();
    return;
  }

  renderSummaryCards(filteredTransactions);
  renderCategoryChart(filteredTransactions);
  renderTrendChart(filteredTransactions);
  renderBreakdownTable(filteredTransactions);
}

function renderNoDataMessage() {
  const summaryCards = document.getElementById('summary-cards');
  if (summaryCards) {
    summaryCards.innerHTML = '<p class="empty-state">No data available for the selected period. Add some transactions to see your financial overview!</p>';
  }
  
  // Clear charts
  const categoryChartCanvas = document.getElementById('category-chart');
  const trendChartCanvas = document.getElementById('trend-chart');
  
  if (categoryChart) categoryChart.destroy();
  if (trendChart) trendChart.destroy();
  
  if (categoryChartCanvas) {
    categoryChartCanvas.getContext('2d').clearRect(0, 0, categoryChartCanvas.width, categoryChartCanvas.height);
  }
  if (trendChartCanvas) {
    trendChartCanvas.getContext('2d').clearRect(0, 0, trendChartCanvas.width, trendChartCanvas.height);
  }
  
  // Clear breakdown
  const breakdownTable = document.getElementById('breakdown-table');
  if (breakdownTable) {
    breakdownTable.innerHTML = '';
  }
}

function renderSummaryCards(filteredTransactions) {
  const stats = calculateSummaryStats(filteredTransactions);
  const summaryCards = document.getElementById('summary-cards');

  summaryCards.innerHTML = `
    <div class="stat-card income">
      <div class="stat-icon">💰</div>
      <div class="stat-content">
        <div class="stat-label">Total Income</div>
        <div class="stat-value">$${stats.income.toFixed(2)}</div>
      </div>
    </div>
    <div class="stat-card expense">
      <div class="stat-icon">💸</div>
      <div class="stat-content">
        <div class="stat-label">Total Expenses</div>
        <div class="stat-value">$${stats.expenses.toFixed(2)}</div>
      </div>
    </div>
    <div class="stat-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}">
      <div class="stat-icon">${stats.balance >= 0 ? '📈' : '📉'}</div>
      <div class="stat-content">
        <div class="stat-label">Balance</div>
        <div class="stat-value">$${stats.balance.toFixed(2)}</div>
      </div>
    </div>
  `;
}

function renderCategoryChart(filteredTransactions) {
  const categoryData = getCategoryData(filteredTransactions);
  const canvas = document.getElementById('category-chart');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart
  if (categoryChart) {
    categoryChart.destroy();
  }

  // Only show expense data
  const expenseData = categoryData.filter(c => c.type === 'expense');

  if (expenseData.length === 0) {
    // No expense data, show message
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px Inter';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data available', canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = expenseData.map(c => c.name);
  const data = expenseData.map(c => c.total);
  const colors = generateColors(labels.length);

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            padding: 10,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: €${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderTrendChart(filteredTransactions) {
  const monthlyData = getMonthlyData(filteredTransactions);
  const canvas = document.getElementById('trend-chart');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart
  if (trendChart) {
    trendChart.destroy();
  }

  // Sort months
  const months = Object.keys(monthlyData).sort();
  const incomeData = months.map(m => monthlyData[m].income);
  const expenseData = months.map(m => monthlyData[m].expense);
  const balanceData = months.map(m => monthlyData[m].income - monthlyData[m].expense);

  // Format month labels
  const labels = months.map(m => {
    const [year, month] = m.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Balance',
          data: balanceData,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0',
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9ca3af',
            callback: function(value) {
              return '$' + value.toFixed(0);
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#9ca3af'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

function renderBreakdownTable(filteredTransactions) {
  const table = document.getElementById('breakdown-table');

  if (filteredTransactions.length === 0) {
    table.innerHTML = '<p class="empty-state">No data available</p>';
    return;
  }

  // Group transactions by month and category
  const monthlyData = {};
  const allMonths = new Set();
  const allCategories = new Set();

  filteredTransactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const categoryName = t.category?.name || 'Unknown';
    
    allMonths.add(monthKey);
    allCategories.add(categoryName);

    if (!monthlyData[categoryName]) {
      monthlyData[categoryName] = {};
    }
    if (!monthlyData[categoryName][monthKey]) {
      monthlyData[categoryName][monthKey] = 0;
    }
    
    // Only count expenses for the breakdown
    if (t.type === 'expense') {
      monthlyData[categoryName][monthKey] += parseFloat(t.amount);
    }
  });

  // Sort months chronologically
  const sortedMonths = Array.from(allMonths).sort();
  const sortedCategories = Array.from(allCategories).sort();

  // Build table HTML
  let html = '<thead><tr><th>Category</th>';
  
  // Add month headers
  sortedMonths.forEach(month => {
    const [year, monthNum] = month.split('-');
    const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    html += `<th>${monthName}</th>`;
  });
  
  html += '<th class="average-col">Average</th></tr></thead><tbody>';

  // Add category rows
  sortedCategories.forEach(category => {
    html += `<tr><td><strong>${category}</strong></td>`;
    
    let total = 0;
    let count = 0;
    
    sortedMonths.forEach(month => {
      const amount = monthlyData[category]?.[month] || 0;
      if (amount > 0) {
        html += `<td>€${amount.toFixed(2)}</td>`;
        total += amount;
        count++;
      } else {
        html += '<td class="empty-cell">-</td>';
      }
    });
    
    // Calculate average
    const average = count > 0 ? total / count : 0;
    html += `<td class="average-col">€${average.toFixed(2)}</td>`;
    html += '</tr>';
  });

  // Add total row
  html += '<tr class="total-row"><td><strong>Total</strong></td>';
  sortedMonths.forEach(month => {
    let monthTotal = 0;
    sortedCategories.forEach(category => {
      monthTotal += monthlyData[category]?.[month] || 0;
    });
    html += `<td><strong>€${monthTotal.toFixed(2)}</strong></td>`;
  });
  
  // Calculate overall average
  let grandTotal = 0;
  sortedCategories.forEach(category => {
    sortedMonths.forEach(month => {
      grandTotal += monthlyData[category]?.[month] || 0;
    });
  });
  const overallAverage = sortedMonths.length > 0 ? grandTotal / sortedMonths.length : 0;
  html += `<td class="average-col"><strong>€${overallAverage.toFixed(2)}</strong></td>`;
  html += '</tr></tbody>';

  table.innerHTML = html;
}

// Utility function to generate colors for charts
function generateColors(count) {
  const colors = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = i * hueStep;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return colors;
}

// ============================================
// EDIT & DELETE TRANSACTION FUNCTIONS
// ============================================

// Edit Modal Functions
window.openEditModal = function(transactionId) {
  const transaction = transactions.find(t => t.id === transactionId);
  if (!transaction) return;

  currentEditingId = transactionId;

  // Populate form
  document.getElementById('edit-type').value = transaction.type;
  document.getElementById('edit-amount').value = transaction.amount;
  document.getElementById('edit-date').value = transaction.date;
  document.getElementById('edit-comment').value = transaction.comment || '';

  // Populate categories for the transaction type
  populateEditCategories(transaction.type);
  
  // Set selected category
  document.getElementById('edit-category').value = transaction.category_id;

  // Show modal
  document.getElementById('edit-modal').style.display = 'flex';
};

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditingId = null;
}

function populateEditCategories(type) {
  const categories = getCategories(type);
  const select = document.getElementById('edit-category');
  select.innerHTML = '';
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    if (cat.description) {
      option.title = cat.description;
    }
    select.appendChild(option);
  });
}

async function handleEditSubmit(e) {
  e.preventDefault();

  if (!currentEditingId) return;

  const type = document.getElementById('edit-type').value;
  const amount = parseFloat(document.getElementById('edit-amount').value);
  const date = document.getElementById('edit-date').value;
  const category_id = document.getElementById('edit-category').value;
  const comment = document.getElementById('edit-comment').value.trim();

  try {
    const { data, error } = await updateTransaction(currentEditingId, {
      type,
      amount,
      date,
      category_id,
      comment: comment || null
    });

    if (error) {
      alert('Error updating transaction: ' + error);
      return;
    }

    // Update local state
    const index = transactions.findIndex(t => t.id === currentEditingId);
    if (index !== -1) {
      transactions[index] = data;
    }

    // Close modal
    closeEditModal();

    // Re-render
    renderTransactions();
    if (document.getElementById('overview-tab').classList.contains('active')) {
      renderOverviewTab();
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    alert('An unexpected error occurred');
  }
}

// Delete Modal Functions
window.openDeleteModal = function(transactionId) {
  const transaction = transactions.find(t => t.id === transactionId);
  if (!transaction) return;

  currentEditingId = transactionId;

  const categoryName = transaction.category?.name || 'Unknown';
  const message = `
    <div class="delete-transaction-info">
      <p><strong>Type:</strong> ${transaction.type === 'income' ? 'Income' : 'Expense'}</p>
      <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
      <p><strong>Category:</strong> ${categoryName}</p>
      <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
      ${transaction.comment ? `<p><strong>Comment:</strong> ${transaction.comment}</p>` : ''}
    </div>
    <p style="margin-top: 1rem; color: #f87171;">Are you sure you want to delete this transaction? This action cannot be undone.</p>
  `;

  document.getElementById('delete-message').innerHTML = message;
  document.getElementById('delete-modal').style.display = 'flex';
};

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
  currentEditingId = null;
}

async function confirmDelete() {
  if (!currentEditingId) return;

  try {
    const { error } = await deleteTransaction(currentEditingId);

    if (error) {
      alert('Error deleting transaction: ' + error);
      return;
    }

    // Remove from local state
    transactions = transactions.filter(t => t.id !== currentEditingId);

    // Close modal
    closeDeleteModal();

    // Re-render
    renderTransactions();
    if (document.getElementById('overview-tab').classList.contains('active')) {
      renderOverviewTab();
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    alert('An unexpected error occurred');
  }
}

// Setup Modal Event Listeners
function setupModalEventListeners() {
  // Edit modal - check if elements exist
  const editType = document.getElementById('edit-type');
  const editForm = document.getElementById('edit-form');
  const cancelEdit = document.getElementById('cancel-edit');
  const editModalOverlay = document.querySelector('#edit-modal .modal-overlay');
  
  if (editType) {
    editType.addEventListener('change', (e) => {
      populateEditCategories(e.target.value);
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
  }

  if (cancelEdit) {
    cancelEdit.addEventListener('click', closeEditModal);
  }

  if (editModalOverlay) {
    editModalOverlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeEditModal();
      }
    });
  }

  // Delete modal - check if elements exist
  const confirmDelete = document.getElementById('confirm-delete');
  const cancelDelete = document.getElementById('cancel-delete');
  const deleteModalOverlay = document.querySelector('#delete-modal .modal-overlay');
  
  if (confirmDelete) {
    confirmDelete.addEventListener('click', confirmDelete);
  }

  if (cancelDelete) {
    cancelDelete.addEventListener('click', closeDeleteModal);
  }

  if (deleteModalOverlay) {
    deleteModalOverlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeDeleteModal();
      }
    });
  }
}

// ============================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================

// Render categories list
function renderCategories() {
  const categories = getCategories(currentCategoryType);
  const list = document.getElementById('category-list');

  if (!list) {
    console.warn('[RENDER] category-list element not found');
    return;
  }

  if (categories.length === 0) {
    list.innerHTML = '<p class="empty-state">No categories found. Add your first custom category!</p>';
    return;
  }

  list.innerHTML = '';

  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-item';

    card.innerHTML = `
      <div class="category-item-content">
        <div class="category-item-name">${cat.name}</div>
        ${cat.description ? `<div class="category-item-description">${cat.description}</div>` : ''}
        ${cat.is_default ? '<span class="category-badge">Default</span>' : '<span class="category-badge custom">Custom</span>'}
      </div>
      ${!cat.is_default ? `
        <div class="category-item-actions">
          <button class="btn-icon" onclick="window.openEditCategoryModal('${cat.id}')" title="Edit">
            <span>✏️</span>
          </button>
          <button class="btn-icon" onclick="window.openDeleteCategoryModal('${cat.id}')" title="Delete">
            <span>🗑️</span>
          </button>
        </div>
      ` : ''}
    `;

    list.appendChild(card);
  });
}

// Open add category modal
function openAddCategoryModal() {
  currentEditingCategoryId = null;
  const modalTitle = document.getElementById('category-modal-title');
  const categoryForm = document.getElementById('category-form');
  const categoryTypeInput = document.getElementById('category-type-hidden');
  const categoryModal = document.getElementById('category-modal');
  
  if (modalTitle) modalTitle.textContent = 'Add Custom Category';
  if (categoryForm) categoryForm.reset();
  if (categoryTypeInput) categoryTypeInput.value = currentCategoryType;
  if (categoryModal) categoryModal.style.display = 'flex';
}

// Open edit category modal
window.openEditCategoryModal = function(categoryId) {
  const category = cloudCategories.find(c => c.id === categoryId);
  if (!category || category.is_default) return;

  currentEditingCategoryId = categoryId;
  document.getElementById('category-modal-title').textContent = 'Edit Category';
  document.getElementById('category-type-hidden').value = category.type;
  document.getElementById('category-name-input').value = category.name;
  document.getElementById('category-description-input').value = category.description || '';
  document.getElementById('category-modal').style.display = 'flex';
};

// Close category modal
function closeCategoryModal() {
  document.getElementById('category-modal').style.display = 'none';
  currentEditingCategoryId = null;
}

// Handle category form submit
async function handleCategorySubmit(e) {
  e.preventDefault();

  const type = document.getElementById('category-type-hidden').value;
  const name = document.getElementById('category-name-input').value.trim();
  const description = document.getElementById('category-description-input').value.trim();

  if (!name) {
    alert('Please enter a category name');
    return;
  }

  try {
    if (currentEditingCategoryId) {
      // Update existing category
      const { data, error } = await updateCategory(currentEditingCategoryId, {
        name,
        description: description || null
      });

      if (error) {
        alert('Error updating category: ' + error);
        return;
      }

      // Update local state
      const index = cloudCategories.findIndex(c => c.id === currentEditingCategoryId);
      if (index !== -1) {
        cloudCategories[index] = data;
      }
    } else {
      // Create new category
      const { data, error } = await createCategory({
        type,
        name,
        description: description || null
      });

      if (error) {
        alert('Error creating category: ' + error);
        return;
      }

      // Add to local state
      cloudCategories.push(data);
    }

    // Close modal
    closeCategoryModal();

    // Re-render
    renderCategories();
    populateCategories(currentTransactionType);
  } catch (error) {
    console.error('Error saving category:', error);
    alert('An unexpected error occurred');
  }
}

// Delete category
window.openDeleteCategoryModal = function(categoryId) {
  const category = cloudCategories.find(c => c.id === categoryId);
  if (!category || category.is_default) return;

  if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
    deleteSelectedCategory(categoryId);
  }
};

async function deleteSelectedCategory(categoryId) {
  try {
    const { error } = await deleteCategory(categoryId);

    if (error) {
      alert('Error deleting category: ' + error);
      return;
    }

    // Remove from local state
    cloudCategories = cloudCategories.filter(c => c.id !== categoryId);

    // Re-render
    renderCategories();
    populateCategories(currentTransactionType);
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('An unexpected error occurred');
  }
}

// Setup category management event listeners
function setupCategoryEventListeners() {
  const addCategoryBtn = document.getElementById('add-category-btn');
  const categoryForm = document.getElementById('category-form');
  const cancelCategory = document.getElementById('cancel-category');
  const categoryModalOverlay = document.querySelector('#category-modal .modal-overlay');
  
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
  }
  
  if (categoryForm) {
    categoryForm.addEventListener('submit', handleCategorySubmit);
  }
  
  if (cancelCategory) {
    cancelCategory.addEventListener('click', closeCategoryModal);
  }
  
  if (categoryModalOverlay) {
    categoryModalOverlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeCategoryModal();
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Setup all event listeners first (must be done before init)
  setupEventListeners();
  setupModalEventListeners();
  setupCategoryEventListeners();
  
  // Then initialize auth and load data
  init();
});
