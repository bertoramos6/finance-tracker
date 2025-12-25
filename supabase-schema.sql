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
    (p_user_id, 'income', 'Paycheck', 'Primary income from work', true),
    (p_user_id, 'income', 'Other income', 'Other income you get (birthday money, etc.)', true);

  -- Insert default expense categories
  INSERT INTO categories (user_id, type, name, description, is_default) VALUES
    (p_user_id, 'expense', 'Housing', 'Rent, mortgage, property taxes', true),
    (p_user_id, 'expense', 'Transportation', 'Car, gas, public transit', true),
    (p_user_id, 'expense', 'Suministros', 'Electricity, garbage, water, heating, phone, wifi, cable...', true),
    (p_user_id, 'expense', 'Grocery', 'Groceries, pet food...', true),
    (p_user_id, 'expense', 'Restaurants', 'Restaurantes, comer fuera y pedir a domicilio', true),
    (p_user_id, 'expense', 'Clothing', 'Clothes and shoes', true),
    (p_user_id, 'expense', 'Subscription', 'Sportify, Netflix and other types of subscriptions', true),
    (p_user_id, 'expense', 'Desarrollo personal', 'Libros, suplementos...', true),
    (p_user_id, 'expense', 'Otros gastos personales', 'Cortes de pelo, cosméticos u otros gastos difícil de categorizar', true),
    (p_user_id, 'expense', 'Gifts', 'All types of gift giving', true),
    (p_user_id, 'expense', 'Entertainment', 'Games, movies, concerts...', true),
    (p_user_id, 'expense', 'Vacation', 'Vacation spendings or savings', true),
    (p_user_id, 'expense', 'Drinks, Tapas, Tomar Algo', 'Cervecillas y tomar algo por ahí', true),
    (p_user_id, 'expense', 'Party', 'Salir de fiesta, taxis, ubers de vuelta...', true),
    (p_user_id, 'expense', 'Efectivo', 'Sacar efectivo', true),
    (p_user_id, 'expense', 'Planes finde', 'Planes fin de semana (trenes, alojamientos...) (restaurantes y tomar algo van en sus respectivas cuentas, no aquí)', true),
    (p_user_id, 'expense', 'Golf', 'Gastos de golf', true),
    (p_user_id, 'expense', 'Impuestos/multas', 'Jodiendas a pagar', true),
    (p_user_id, 'expense', 'Deporte', 'Gastos relacionados con el deporte (zapatos de correr, ropa, inscripciones de carreras, geles...)', true),
    (p_user_id, 'expense', 'Glovo', 'Glovos u otros caprichos como tartas de queso y demás (separar de restaurantes)', true);
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
