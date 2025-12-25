// auth.js - Single static user authentication for personal use
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth state
let currentUser = null;

/**
 * Initialize authentication - auto-login with static credentials
 * This creates a persistent session that works across all devices
 */
export async function initAuth() {
  try {
    console.log('[AUTH] Checking for existing session...');
    
    // Check if we already have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AUTH] Error getting session:', sessionError);
    }

    if (session) {
      currentUser = session.user;
      console.log('[AUTH] Session restored for user:', currentUser.email);
      return currentUser;
    }

    // No session exists, sign in with static credentials
    const email = import.meta.env.VITE_USER_EMAIL;
    const password = import.meta.env.VITE_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('Missing user credentials in .env file. Please add VITE_USER_EMAIL and VITE_USER_PASSWORD');
    }

    console.log('[AUTH] No session found, signing in with credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[AUTH] Error signing in:', error);
      throw error;
    }

    currentUser = data.user;
    console.log('[AUTH] Successfully signed in as:', currentUser.email);
    return currentUser;
  } catch (error) {
    console.error('[AUTH] Auth initialization failed:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Listen to Supabase auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    callback(event, session);
  });
}
