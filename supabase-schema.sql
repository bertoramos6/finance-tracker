-- ============================================
-- Finance Tracker - Supabase Database Schema
-- ============================================
-- This script creates all necessary tables, indexes, and Row Level Security policies
-- Run this in the Supabase SQL Editor after creating your project

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, type, name)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own non-default categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own non-default categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- ============================================
-- 2. TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TRIGGER FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transactions table
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNCTION TO SEED DEFAULT CATEGORIES
-- ============================================

-- Function to create default categories for a new user
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO categories (user_id, type, name, description, is_default) VALUES
    (p_user_id, 'income', 'Salary', 'Regular salary or wages', true),
    (p_user_id, 'income', 'Freelance', 'Freelance or contract work', true),
    (p_user_id, 'income', 'Investments', 'Investment returns', true),
    (p_user_id, 'income', 'Gifts', 'Monetary gifts received', true),
    (p_user_id, 'income', 'Other Income', 'Other sources of income', true);

  -- Insert default expense categories
  INSERT INTO categories (user_id, type, name, description, is_default) VALUES
    (p_user_id, 'expense', 'Housing', 'Rent, mortgage, property taxes', true),
    (p_user_id, 'expense', 'Transportation', 'Car, gas, public transit', true),
    (p_user_id, 'expense', 'Food & Dining', 'Groceries and restaurants', true),
    (p_user_id, 'expense', 'Utilities', 'Electric, water, internet', true),
    (p_user_id, 'expense', 'Healthcare', 'Medical expenses and insurance', true),
    (p_user_id, 'expense', 'Entertainment', 'Movies, games, hobbies', true),
    (p_user_id, 'expense', 'Shopping', 'Clothing and general shopping', true),
    (p_user_id, 'expense', 'Education', 'Courses, books, tuition', true),
    (p_user_id, 'expense', 'Travel', 'Vacations and trips', true),
    (p_user_id, 'expense', 'Personal Care', 'Haircuts, cosmetics', true),
    (p_user_id, 'expense', 'Subscriptions', 'Streaming, software, memberships', true),
    (p_user_id, 'expense', 'Other Expenses', 'Miscellaneous expenses', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER TO AUTO-CREATE DEFAULT CATEGORIES
-- ============================================

-- Function to automatically create default categories when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table (runs when new user is created)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Enable Email/Password authentication in Supabase Dashboard
-- 2. Configure Google OAuth (optional)
-- 3. Test by creating a user account
-- 4. Verify default categories are created automatically
