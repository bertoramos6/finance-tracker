// Default Categories Configuration
const DEFAULT_CATEGORIES = {
    income: [
        { id: 'paycheck', name: 'Paycheck', description: 'Primary income from work', isDefault: true },
        { id: 'other-income', name: 'Other income', description: 'Other income you get (birthday money, etc.)', isDefault: true }
    ],
    expense: [
        { id: 'housing', name: 'Housing', description: 'Rent, mortgage, property fixes, property taxes...', isDefault: true },
        { id: 'transportation', name: 'Transportation', description: 'Car payment, public transport, car fixes, gas...', isDefault: true },
        { id: 'suministros', name: 'Suministros', description: 'Electricity, garbage, water, heating, phone, wifi, cable...', isDefault: true },
        { id: 'grocery', name: 'Grocery', description: 'Groceries, pet food...', isDefault: true },
        { id: 'restaurants', name: 'Restaurants', description: 'Restaurantes, comer fuera y pedir a domicilio', isDefault: true },
        { id: 'clothing', name: 'Clothing', description: 'Clothes and shoes', isDefault: true },
        { id: 'subscription', name: 'Subscription', description: 'Spotify, Netflix and other types of subscriptions', isDefault: true },
        { id: 'desarrollo-personal', name: 'Desarrollo personal', description: 'Libros, cuota gym, suplementos...', isDefault: true },
        { id: 'otros-gastos', name: 'Otros gastos personales', description: 'Cortes de pelo, cosméticos u otros gastos difícil de categorizar', isDefault: true },
        { id: 'gifts', name: 'Gifts', description: 'All types of gift giving', isDefault: true },
        { id: 'entertainment', name: 'Entertainment', description: 'Games, movies, concerts...', isDefault: true },
        { id: 'vacation', name: 'Vacation', description: 'Vacation spendings or savings', isDefault: true },
        { id: 'drinks-tapas', name: 'Drinks, Tapas, Tomar Algo', description: 'Cervecillas y tomar algo por ahí', isDefault: true },
        { id: 'party', name: 'Party', description: 'Salir de fiesta, taxis, ubers de vuelta...', isDefault: true },
        { id: 'efectivo', name: 'Efectivo', description: 'Sacar efectivo', isDefault: true },
        { id: 'planes-finde', name: 'Planes finde', description: 'Planes fin de semana (trenes, alojamientos...)', isDefault: true },
        { id: 'golf', name: 'Golf', description: 'Gastos de golf', isDefault: true },
        { id: 'impuestos-multas', name: 'Impuestos/multas', description: 'Jodiendas a pagar', isDefault: true },
        { id: 'deporte', name: 'Deporte', description: 'Gastos relacionados con el deporte', isDefault: true },
        { id: 'glovo', name: 'Glovo', description: 'Glovos u otros caprichos como tartas de queso y demás', isDefault: true }
    ]
};

// Application State
let transactions = [];
let customCategories = []; // User's custom categories
let currentTransactionType = 'expense';
let categoryChart = null;
let trendChart = null;
let dateFilter = { start: null, end: null };
let currentEditingId = null;
let currentCategoryType = 'expense'; // For category management tab
let currentEditingCategoryId = null;

// Get all categories (default + custom) for a type
function getCategories(type) {
    const defaults = DEFAULT_CATEGORIES[type] || [];
    const customs = customCategories.filter(c => c.type === type);
    return [...defaults, ...customs];
}

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categorySelect = document.getElementById('category');
const commentInput = document.getElementById('comment');
const successMessage = document.getElementById('success-message');
const transactionList = document.getElementById('transaction-list');
const exportCsvBtn = document.getElementById('export-csv');

// Initialize App
function init() {
    // Set today's date as default
    dateInput.valueAsDate = new Date();
    
    // Load custom categories from localStorage
    loadCustomCategories();
    
    // Load transactions from localStorage
    loadTransactions();
    
    // Populate category dropdown
    populateCategories('expense');
    
    // Setup event listeners
    setupEventListeners();
    
    // Render transaction history
    renderTransactions();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Transaction type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTransactionType = btn.dataset.type;
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateCategories(currentTransactionType);
        });
    });
    
    // Form submission
    transactionForm.addEventListener('submit', handleFormSubmit);
    
    // Export CSV
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Date filter controls
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyDateFilter);
    }
    
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetDateFilter);
    }
}

// Switch Tab
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh content based on tab
    if (tabName === 'history') {
        renderTransactions();
    } else if (tabName === 'overview') {
        renderOverviewTab();
    }
}

// Populate Categories
function populateCategories(type) {
    categorySelect.innerHTML = '';
    const categories = getCategories(type);
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.title = category.description;
        categorySelect.appendChild(option);
    });
}

// Handle Form Submit
function handleFormSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: currentTransactionType,
        amount: parseFloat(amountInput.value),
        date: dateInput.value,
        category: categorySelect.value,
        categoryName: categorySelect.options[categorySelect.selectedIndex].text,
        comment: commentInput.value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Add transaction
    transactions.push(transaction);
    
    // Save to localStorage
    saveTransactions();
    
    // Show success message
    showSuccessMessage();
    
    // Reset form
    transactionForm.reset();
    dateInput.valueAsDate = new Date();
    amountInput.focus();
    
    // Update history
    renderTransactions();
}

// Show Success Message
function showSuccessMessage() {
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 3000);
}

// Save Transactions to localStorage
function saveTransactions() {
    localStorage.setItem('finance-tracker-transactions', JSON.stringify(transactions));
}

// Load Transactions from localStorage
function loadTransactions() {
    const stored = localStorage.getItem('finance-tracker-transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// Render Transactions
function renderTransactions() {
    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-state">No transactions yet. Add your first transaction!</div>';
        return;
    }
    
    // Sort by date (newest first)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactionList.innerHTML = sorted.map(transaction => {
        const isExpense = transaction.type === 'expense';
        const sign = isExpense ? '-' : '+';
        const formattedDate = new Date(transaction.date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    ${isExpense ? 
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/></svg>' :
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'
                    }
                </div>
                <div class="transaction-details">
                    <div class="transaction-category">${transaction.categoryName}</div>
                    ${transaction.comment ? `<div class="transaction-comment">${transaction.comment}</div>` : ''}
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${sign}€${transaction.amount.toFixed(2)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon edit" onclick="openEditModal(${transaction.id})" title="Edit transaction">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="openDeleteModal(${transaction.id})" title="Delete transaction">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Export to CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    // Sort by date (oldest first for CSV)
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Create CSV content
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Comment'];
    const rows = sorted.map(t => [
        t.date,
        t.type,
        t.categoryName,
        t.amount.toFixed(2),
        t.comment || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// OVERVIEW TAB - DATA VISUALIZATION FUNCTIONS
// ============================================

// Date Filter Functions
function applyDateFilter() {
    const startInput = document.getElementById('filter-start-date');
    const endInput = document.getElementById('filter-end-date');
    
    dateFilter.start = startInput.value ? new Date(startInput.value + '-01') : null;
    dateFilter.end = endInput.value ? new Date(endInput.value + '-01') : null;
    
    // Set end date to last day of month
    if (dateFilter.end) {
        dateFilter.end = new Date(dateFilter.end.getFullYear(), dateFilter.end.getMonth() + 1, 0);
    }
    
    renderOverviewTab();
}

function resetDateFilter() {
    dateFilter = { start: null, end: null };
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    renderOverviewTab();
}

function getFilteredTransactions() {
    if (!dateFilter.start && !dateFilter.end) {
        return transactions;
    }
    
    return transactions.filter(t => {
        const transDate = new Date(t.date);
        if (dateFilter.start && transDate < dateFilter.start) return false;
        if (dateFilter.end && transDate > dateFilter.end) return false;
        return true;
    });
}

// Data Processing Functions
function calculateSummaryStats(filteredTransactions) {
    const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        avgMonthlyExpenses: 0,
        transactionCount: filteredTransactions.length
    };
    
    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            stats.totalIncome += t.amount;
        } else {
            stats.totalExpenses += t.amount;
        }
    });
    
    stats.netBalance = stats.totalIncome - stats.totalExpenses;
    
    // Calculate average monthly expenses
    const monthlyExpenses = getMonthlyData(filteredTransactions.filter(t => t.type === 'expense'));
    const pastMonths = Object.keys(monthlyExpenses).filter(month => {
        const monthDate = new Date(month + '-01');
        return monthDate <= new Date();
    });
    
    if (pastMonths.length > 0) {
        const totalPastExpenses = pastMonths.reduce((sum, month) => sum + monthlyExpenses[month], 0);
        stats.avgMonthlyExpenses = totalPastExpenses / pastMonths.length;
    }
    
    return stats;
}

function getMonthlyData(filteredTransactions) {
    const monthlyData = {};
    
    filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += t.amount;
    });
    
    return monthlyData;
}

function getCategoryData(filteredTransactions) {
    const categoryData = {};
    
    filteredTransactions.forEach(t => {
        if (t.type === 'expense') {
            if (!categoryData[t.categoryName]) {
                categoryData[t.categoryName] = 0;
            }
            categoryData[t.categoryName] += t.amount;
        }
    });
    
    return categoryData;
}

function getExpenseBreakdown(filteredTransactions) {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const breakdown = {};
    const months = new Set();
    
    // Collect all months and initialize breakdown structure
    expenses.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
        
        if (!breakdown[t.categoryName]) {
            breakdown[t.categoryName] = {};
        }
        
        if (!breakdown[t.categoryName][monthKey]) {
            breakdown[t.categoryName][monthKey] = 0;
        }
        
        breakdown[t.categoryName][monthKey] += t.amount;
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(months).sort();
    
    // Calculate averages (excluding future months)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const pastMonths = sortedMonths.filter(month => month <= currentMonthKey);
    
    Object.keys(breakdown).forEach(category => {
        const categoryMonths = breakdown[category];
        const pastValues = pastMonths
            .map(month => categoryMonths[month] || 0)
            .filter(val => val > 0);
        
        breakdown[category].average = pastValues.length > 0
            ? pastValues.reduce((sum, val) => sum + val, 0) / pastValues.length
            : 0;
    });
    
    return { breakdown, months: sortedMonths };
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
    summaryCards.innerHTML = `
        <div class="no-data-message" style="grid-column: 1 / -1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p>No transaction data available. Add some transactions to see your financial overview!</p>
        </div>
    `;
    
    // Clear other sections
    document.getElementById('breakdown-table-wrapper').innerHTML = '';
    document.getElementById('projections-content').innerHTML = '';
    
    // Destroy existing charts
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
}

function renderSummaryCards(filteredTransactions) {
    const stats = calculateSummaryStats(filteredTransactions);
    const summaryCards = document.getElementById('summary-cards');
    
    summaryCards.innerHTML = `
        <div class="summary-card">
            <div class="summary-card-label">Total Income</div>
            <div class="summary-card-value positive">€${stats.totalIncome.toFixed(2)}</div>
            <div class="summary-card-subtitle">${filteredTransactions.filter(t => t.type === 'income').length} transactions</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-label">Total Expenses</div>
            <div class="summary-card-value negative">€${stats.totalExpenses.toFixed(2)}</div>
            <div class="summary-card-subtitle">${filteredTransactions.filter(t => t.type === 'expense').length} transactions</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-label">Net Balance</div>
            <div class="summary-card-value ${stats.netBalance >= 0 ? 'positive' : 'negative'}">€${stats.netBalance.toFixed(2)}</div>
            <div class="summary-card-subtitle">${stats.netBalance >= 0 ? 'Surplus' : 'Deficit'}</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-label">Avg Monthly Spending</div>
            <div class="summary-card-value neutral">€${stats.avgMonthlyExpenses.toFixed(2)}</div>
            <div class="summary-card-subtitle">Based on past months</div>
        </div>
    `;
}

function renderCategoryChart(filteredTransactions) {
    const categoryData = getCategoryData(filteredTransactions);
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    
    if (categories.length === 0) {
        return;
    }
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const ctx = document.getElementById('category-chart');
    
    // Generate colors
    const colors = generateColors(categories.length);
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderColor: '#1e2740',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        padding: 15,
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
    const incomeByMonth = getMonthlyData(filteredTransactions.filter(t => t.type === 'income'));
    const expensesByMonth = getMonthlyData(filteredTransactions.filter(t => t.type === 'expense'));
    
    // Get all unique months
    const allMonths = new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)]);
    const sortedMonths = Array.from(allMonths).sort();
    
    if (sortedMonths.length === 0) {
        return;
    }
    
    const incomeData = sortedMonths.map(month => incomeByMonth[month] || 0);
    const expenseData = sortedMonths.map(month => expensesByMonth[month] || 0);
    
    // Format month labels
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }
    
    const ctx = document.getElementById('trend-chart');
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '€' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        }
    });
}

function renderBreakdownTable(filteredTransactions) {
    const { breakdown, months } = getExpenseBreakdown(filteredTransactions);
    const categories = Object.keys(breakdown).sort();
    
    if (categories.length === 0 || months.length === 0) {
        document.getElementById('breakdown-table-wrapper').innerHTML = '<p class="no-data-message">No expense data available</p>';
        return;
    }
    
    // Format month headers
    const monthHeaders = months.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return {
            key: month,
            label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        };
    });
    
    // Calculate column totals
    const columnTotals = {};
    months.forEach(month => {
        columnTotals[month] = categories.reduce((sum, cat) => sum + (breakdown[cat][month] || 0), 0);
    });
    
    // Build table HTML
    let tableHTML = '<table class="breakdown-table"><thead><tr>';
    tableHTML += '<th>Category</th>';
    monthHeaders.forEach(mh => {
        tableHTML += `<th>${mh.label}</th>`;
    });
    tableHTML += '<th class="average-col">Average</th>';
    tableHTML += '<th>Total</th>';
    tableHTML += '</tr></thead><tbody>';
    
    // Add category rows
    categories.forEach(category => {
        tableHTML += '<tr>';
        tableHTML += `<td>${category}</td>`;
        
        let rowTotal = 0;
        months.forEach(month => {
            const amount = breakdown[category][month] || 0;
            rowTotal += amount;
            if (amount > 0) {
                tableHTML += `<td>€${amount.toFixed(2)}</td>`;
            } else {
                tableHTML += '<td class="empty-cell">-</td>';
            }
        });
        
        const average = breakdown[category].average || 0;
        tableHTML += `<td class="average-col">€${average.toFixed(2)}</td>`;
        tableHTML += `<td><strong>€${rowTotal.toFixed(2)}</strong></td>`;
        tableHTML += '</tr>';
    });
    
    // Add total row
    tableHTML += '<tr class="total-row">';
    tableHTML += '<td><strong>TOTAL</strong></td>';
    
    let grandTotal = 0;
    months.forEach(month => {
        const total = columnTotals[month];
        grandTotal += total;
        tableHTML += `<td><strong>€${total.toFixed(2)}</strong></td>`;
    });
    
    // Calculate average of monthly totals (past months only)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const pastMonths = months.filter(month => month <= currentMonthKey);
    const avgMonthlyTotal = pastMonths.length > 0
        ? pastMonths.reduce((sum, month) => sum + columnTotals[month], 0) / pastMonths.length
        : 0;
    
    tableHTML += `<td class="average-col"><strong>€${avgMonthlyTotal.toFixed(2)}</strong></td>`;
    tableHTML += `<td><strong>€${grandTotal.toFixed(2)}</strong></td>`;
    tableHTML += '</tr>';
    
    tableHTML += '</tbody></table>';
    
    document.getElementById('breakdown-table-wrapper').innerHTML = tableHTML;
}

// Utility function to generate colors for charts
function generateColors(count) {
    const hueStep = 360 / count;
    const colors = [];
    
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
function openEditModal(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    currentEditingId = transactionId;
    
    // Populate form fields
    document.getElementById('edit-transaction-id').value = transaction.id;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-date').value = transaction.date;
    document.getElementById('edit-comment').value = transaction.comment || '';
    
    // Set transaction type
    const expenseBtn = document.getElementById('edit-type-expense');
    const incomeBtn = document.getElementById('edit-type-income');
    
    if (transaction.type === 'expense') {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
        populateEditCategories('expense');
    } else {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
        populateEditCategories('income');
    }
    
    // Set category after populating options
    setTimeout(() => {
        document.getElementById('edit-category').value = transaction.category;
    }, 10);
    
    // Show modal
    document.getElementById('edit-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentEditingId = null;
    document.getElementById('edit-transaction-form').reset();
}

function populateEditCategories(type) {
    const categorySelect = document.getElementById('edit-category');
    categorySelect.innerHTML = '';
    const categories = getCategories(type);
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.title = category.description;
        categorySelect.appendChild(option);
    });
}

function handleEditSubmit(e) {
    e.preventDefault();
    
    if (!currentEditingId) return;
    
    const transactionIndex = transactions.findIndex(t => t.id === currentEditingId);
    if (transactionIndex === -1) return;
    
    // Get form values
    const type = document.getElementById('edit-type-expense').classList.contains('active') ? 'expense' : 'income';
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const date = document.getElementById('edit-date').value;
    const category = document.getElementById('edit-category').value;
    const categoryName = document.getElementById('edit-category').options[document.getElementById('edit-category').selectedIndex].text;
    const comment = document.getElementById('edit-comment').value.trim();
    
    // Update transaction
    transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        type,
        amount,
        date,
        category,
        categoryName,
        comment
    };
    
    // Save to localStorage
    saveTransactions();
    
    // Close modal
    closeEditModal();
    
    // Refresh views
    renderTransactions();
    
    // Refresh overview if on that tab
    const overviewTab = document.getElementById('overview-tab');
    if (overviewTab.classList.contains('active')) {
        renderOverviewTab();
    }
}

// Delete Modal Functions
function openDeleteModal(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    currentEditingId = transactionId;
    
    // Populate transaction details
    const formattedDate = new Date(transaction.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const detailsHtml = `
        <div class="delete-detail-row">
            <span class="delete-detail-label">Type:</span>
            <span class="delete-detail-value">${transaction.type === 'expense' ? 'Expense' : 'Income'}</span>
        </div>
        <div class="delete-detail-row">
            <span class="delete-detail-label">Category:</span>
            <span class="delete-detail-value">${transaction.categoryName}</span>
        </div>
        <div class="delete-detail-row">
            <span class="delete-detail-label">Amount:</span>
            <span class="delete-detail-value">€${transaction.amount.toFixed(2)}</span>
        </div>
        <div class="delete-detail-row">
            <span class="delete-detail-label">Date:</span>
            <span class="delete-detail-value">${formattedDate}</span>
        </div>
        ${transaction.comment ? `
            <div class="delete-detail-row">
                <span class="delete-detail-label">Comment:</span>
                <span class="delete-detail-value">${transaction.comment}</span>
            </div>
        ` : ''}
    `;
    
    document.getElementById('delete-transaction-details').innerHTML = detailsHtml;
    
    // Show modal
    document.getElementById('delete-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentEditingId = null;
}

function confirmDelete() {
    if (!currentEditingId) return;
    
    // Remove transaction from array
    transactions = transactions.filter(t => t.id !== currentEditingId);
    
    // Save to localStorage
    saveTransactions();
    
    // Close modal
    closeDeleteModal();
    
    // Refresh views
    renderTransactions();
    
    // Refresh overview if on that tab
    const overviewTab = document.getElementById('overview-tab');
    if (overviewTab.classList.contains('active')) {
        renderOverviewTab();
    }
}

// Setup Modal Event Listeners
function setupModalEventListeners() {
    // Edit modal
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-transaction-form');
    const editClose = document.getElementById('edit-modal-close');
    const editCancel = document.getElementById('edit-cancel');
    const editOverlay = document.getElementById('edit-modal-overlay');
    
    // Edit type toggle
    document.getElementById('edit-type-expense').addEventListener('click', () => {
        document.getElementById('edit-type-expense').classList.add('active');
        document.getElementById('edit-type-income').classList.remove('active');
        populateEditCategories('expense');
    });
    
    document.getElementById('edit-type-income').addEventListener('click', () => {
        document.getElementById('edit-type-income').classList.add('active');
        document.getElementById('edit-type-expense').classList.remove('active');
        populateEditCategories('income');
    });
    
    editForm.addEventListener('submit', handleEditSubmit);
    editClose.addEventListener('click', closeEditModal);
    editCancel.addEventListener('click', closeEditModal);
    editOverlay.addEventListener('click', closeEditModal);
    
    // Delete modal
    const deleteModal = document.getElementById('delete-modal');
    const deleteClose = document.getElementById('delete-modal-close');
    const deleteCancel = document.getElementById('delete-cancel');
    const deleteConfirm = document.getElementById('delete-confirm');
    const deleteOverlay = document.getElementById('delete-modal-overlay');
    
    deleteClose.addEventListener('click', closeDeleteModal);
    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteConfirm.addEventListener('click', confirmDelete);
    deleteOverlay.addEventListener('click', closeDeleteModal);
    
    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editModal.classList.contains('active')) {
                closeEditModal();
            }
            if (deleteModal.classList.contains('active')) {
                closeDeleteModal();
            }
        }
    });
}

// ============================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================

// Load custom categories from localStorage
function loadCustomCategories() {
    const saved = localStorage.getItem('finance-tracker-categories');
    if (saved) {
        customCategories = JSON.parse(saved);
    }
}

// Save custom categories to localStorage
function saveCustomCategories() {
    localStorage.setItem('finance-tracker-categories', JSON.stringify(customCategories));
}

// Render categories list
function renderCategories() {
    const categoryList = document.getElementById('category-list');
    const categories = getCategories(currentCategoryType);
    
    if (categories.length === 0) {
        categoryList.innerHTML = '<div class="category-empty">No categories found.</div>';
        return;
    }
    
    categoryList.innerHTML = categories.map(category => {
        const usageCount = transactions.filter(t => t.category === category.id).length;
        const isDefault = category.isDefault || false;
        
        return `
            <div class="category-item ${isDefault ? 'default-category' : ''}">
                <div class="category-info">
                    <div class="category-item-header">
                        <span class="category-item-name">${category.name}</span>
                        <span class="category-badge ${isDefault ? 'default' : 'custom'}">
                            ${isDefault ? 'Default' : 'Custom'}
                        </span>
                    </div>
                    ${category.description ? `<div class="category-item-description">${category.description}</div>` : ''}
                    <div class="category-item-usage">Used in ${usageCount} transaction${usageCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="category-actions">
                    ${!isDefault ? `
                        <button class="btn-icon edit" onclick="openEditCategoryModal('${category.id}')" title="Edit category">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="openDeleteCategoryModal('${category.id}')" title="Delete category" ${usageCount > 0 ? 'disabled' : ''}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Open add category modal
function openAddCategoryModal() {
    currentEditingCategoryId = null;
    document.getElementById('category-modal-title').textContent = 'Add Category';
    document.getElementById('category-id').value = '';
    document.getElementById('category-type-hidden').value = currentCategoryType;
    document.getElementById('category-name').value = '';
    document.getElementById('category-description').value = '';
    document.getElementById('category-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Open edit category modal
function openEditCategoryModal(categoryId) {
    const category = customCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    currentEditingCategoryId = categoryId;
    document.getElementById('category-modal-title').textContent = 'Edit Category';
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-type-hidden').value = category.type;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    document.getElementById('category-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close category modal
function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentEditingCategoryId = null;
    document.getElementById('category-form').reset();
}

// Handle category form submit
function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    const type = document.getElementById('category-type-hidden').value;
    
    if (currentEditingCategoryId) {
        // Edit existing category
        const index = customCategories.findIndex(c => c.id === currentEditingCategoryId);
        if (index !== -1) {
            customCategories[index] = {
                ...customCategories[index],
                name,
                description
            };
        }
    } else {
        // Add new category
        const newCategory = {
            id: `custom-${Date.now()}`,
            type,
            name,
            description,
            isDefault: false
        };
        customCategories.push(newCategory);
    }
    
    saveCustomCategories();
    closeCategoryModal();
    renderCategories();
    
    // Update category dropdowns in forms
    populateCategories(currentTransactionType);
    populateEditCategories(currentTransactionType);
}

// Delete category
function openDeleteCategoryModal(categoryId) {
    const category = customCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    const usageCount = transactions.filter(t => t.category === categoryId).length;
    
    if (usageCount > 0) {
        alert(`Cannot delete category "${category.name}" because it is used in ${usageCount} transaction${usageCount !== 1 ? 's' : ''}. Please reassign or delete those transactions first.`);
        return;
    }
    
    if (confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
        customCategories = customCategories.filter(c => c.id !== categoryId);
        saveCustomCategories();
        renderCategories();
        
        // Update category dropdowns
        populateCategories(currentTransactionType);
        populateEditCategories(currentTransactionType);
    }
}

// Setup category management event listeners
function setupCategoryEventListeners() {
    // Category type tabs
    document.querySelectorAll('.category-type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentCategoryType = tab.dataset.categoryType;
            document.querySelectorAll('.category-type-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCategories();
        });
    });
    
    // Add category button
    document.getElementById('add-category-btn').addEventListener('click', openAddCategoryModal);
    
    // Category modal
    const categoryForm = document.getElementById('category-form');
    const categoryClose = document.getElementById('category-modal-close');
    const categoryCancel = document.getElementById('category-cancel');
    const categoryOverlay = document.getElementById('category-modal-overlay');
    
    categoryForm.addEventListener('submit', handleCategorySubmit);
    categoryClose.addEventListener('click', closeCategoryModal);
    categoryCancel.addEventListener('click', closeCategoryModal);
    categoryOverlay.addEventListener('click', closeCategoryModal);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupModalEventListeners();
    setupCategoryEventListeners();
});
