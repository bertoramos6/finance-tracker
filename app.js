// Expense Categories Configuration
const CATEGORIES = {
    income: [
        { id: 'paycheck', name: 'Paycheck', description: 'Primary income from work' },
        { id: 'other-income', name: 'Other income', description: 'Other income you get (birthday money, etc.)' }
    ],
    expense: [
        { id: 'housing', name: 'Housing', description: 'Rent, mortgage, property fixes, property taxes...' },
        { id: 'transportation', name: 'Transportation', description: 'Car payment, public transport, car fixes, gas...' },
        { id: 'suministros', name: 'Suministros', description: 'Electricity, garbage, water, heating, phone, wifi, cable...' },
        { id: 'grocery', name: 'Grocery', description: 'Groceries, pet food...' },
        { id: 'restaurants', name: 'Restaurants', description: 'Restaurantes, comer fuera y pedir a domicilio' },
        { id: 'clothing', name: 'Clothing', description: 'Clothes and shoes' },
        { id: 'subscription', name: 'Subscription', description: 'Spotify, Netflix and other types of subscriptions' },
        { id: 'desarrollo-personal', name: 'Desarrollo personal', description: 'Libros, cuota gym, suplementos...' },
        { id: 'otros-gastos', name: 'Otros gastos personales', description: 'Cortes de pelo, cosméticos u otros gastos difícil de categorizar' },
        { id: 'gifts', name: 'Gifts', description: 'All types of gift giving' },
        { id: 'entertainment', name: 'Entertainment', description: 'Games, movies, concerts...' },
        { id: 'vacation', name: 'Vacation', description: 'Vacation spendings or savings' },
        { id: 'drinks-tapas', name: 'Drinks, Tapas, Tomar Algo', description: 'Cervecillas y tomar algo por ahí' },
        { id: 'party', name: 'Party', description: 'Salir de fiesta, taxis, ubers de vuelta...' },
        { id: 'efectivo', name: 'Efectivo', description: 'Sacar efectivo' },
        { id: 'planes-finde', name: 'Planes finde', description: 'Planes fin de semana (trenes, alojamientos...)' },
        { id: 'golf', name: 'Golf', description: 'Gastos de golf' },
        { id: 'impuestos-multas', name: 'Impuestos/multas', description: 'Jodiendas a pagar' },
        { id: 'deporte', name: 'Deporte', description: 'Gastos relacionados con el deporte' },
        { id: 'glovo', name: 'Glovo', description: 'Glovos u otros caprichos como tartas de queso y demás' }
    ]
};

// Application State
let transactions = [];
let currentTransactionType = 'expense';

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
    
    // Refresh transaction list if switching to history
    if (tabName === 'history') {
        renderTransactions();
    }
}

// Populate Categories
function populateCategories(type) {
    categorySelect.innerHTML = '';
    const categories = CATEGORIES[type];
    
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
