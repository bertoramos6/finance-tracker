// password-gate.js - Simple password protection for the app
const GATE_PASSWORD_KEY = 'finance_tracker_gate_auth';
const CORRECT_PASSWORD = import.meta.env.VITE_GATE_PASSWORD || 'your-secure-password';

// Track if event listener has been attached
let listenerAttached = false;

/**
 * Check if user has already authenticated
 */
export function isAuthenticated() {
  const stored = localStorage.getItem(GATE_PASSWORD_KEY);
  return stored === 'authenticated';
}

/**
 * Verify password and store authentication
 */
export function verifyPassword(password) {
  if (password === CORRECT_PASSWORD) {
    localStorage.setItem(GATE_PASSWORD_KEY, 'authenticated');
    return true;
  }
  return false;
}

/**
 * Clear authentication (for logout)
 */
export function clearAuthentication() {
  localStorage.removeItem(GATE_PASSWORD_KEY);
}

/**
 * Initialize password gate
 */
export function initPasswordGate(onSuccess) {
  const passwordGate = document.getElementById('password-gate');
  const appContainer = document.getElementById('app-container');
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('gate-password');
  const passwordError = document.getElementById('password-error');

  if (!passwordGate || !appContainer || !passwordForm) {
    console.error('[PASSWORD GATE] Required elements not found');
    return;
  }

  // Check if already authenticated
  if (isAuthenticated()) {
    passwordGate.style.display = 'none';
    appContainer.style.display = 'block';
    onSuccess();
    return;
  }

  // Show password gate
  passwordGate.style.display = 'flex';
  appContainer.style.display = 'none';

  // Remove existing listener if any to prevent duplicates
  if (listenerAttached) {
    const newForm = passwordForm.cloneNode(true);
    passwordForm.parentNode.replaceChild(newForm, passwordForm);
  }

  // Get fresh references after potential clone
  const form = document.getElementById('password-form');
  const input = document.getElementById('gate-password');
  const error = document.getElementById('password-error');

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const password = input.value;
    
    if (verifyPassword(password)) {
      // Success - hide gate and show app
      passwordGate.style.display = 'none';
      appContainer.style.display = 'block';
      onSuccess();
    } else {
      // Error - show message
      error.textContent = 'Incorrect password. Please try again.';
      error.classList.add('show');
      input.value = '';
      input.focus();
      
      // Hide error after 3 seconds
      setTimeout(() => {
        error.classList.remove('show');
      }, 3000);
    }
  });

  listenerAttached = true;
  
  // Focus the input
  input.focus();
}
