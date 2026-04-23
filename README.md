# Finance Tracker

A personal finance tracker built with React, TypeScript, Vite, and Supabase. Track expenses and income, manage investment portfolios, and visualise spending trends — all in a clean dark/light UI that works on desktop and mobile.

## Features

- **Overview** — stat cards, expense donut chart, monthly trends area chart, category breakdown table
- **Add Entry** — single transactions or batch templates for recurring expenses
- **History** — searchable, filterable transaction list with inline editing and CSV export
- **Investments** — portfolio tracking with stacked area chart, per-position sparklines, and editable monthly value table
- Auth via Supabase (email + password)
- Dark / light mode
- Fully responsive (mobile bottom nav, tablet/desktop sidebar)

## Tech stack

- React 18 + TypeScript
- Vite
- Supabase (Postgres + Auth + Row Level Security)
- No external UI library — all inline styles, custom SVG charts

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/finance-tracker.git
cd finance-tracker
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Once created, go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public** key (under *Legacy API Keys*)

### 3. Set up the database

In your Supabase project, open the **SQL Editor** and run the following:

```sql
-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  date date not null,
  category text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Users own their transactions"
  on transactions for all using (auth.uid() = user_id);

-- Investments
create table investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text default 'N/A',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table investments enable row level security;
create policy "Users own their investments"
  on investments for all using (auth.uid() = user_id);

create table investment_entries (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid references investments on delete cascade not null,
  month text not null,
  value numeric not null default 0,
  unique (investment_id, month)
);

alter table investment_entries enable row level security;
create policy "Users own their investment entries"
  on investment_entries for all
  using (investment_id in (
    select id from investments where user_id = auth.uid()
  ));

-- Batch templates
create table batch_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table batch_templates enable row level security;
create policy "Users own their batch templates"
  on batch_templates for all using (auth.uid() = user_id);

create table batch_entries (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batch_templates on delete cascade not null,
  category text not null,
  amount numeric not null,
  description text default '',
  sort_order int default 0
);

alter table batch_entries enable row level security;
create policy "Users own their batch entries"
  on batch_entries for all
  using (batch_id in (
    select id from batch_templates where user_id = auth.uid()
  ));
```

### 4. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Enable email auth in Supabase

Go to **Authentication → Providers** and make sure **Email** is enabled. New users sign up directly from the login page.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), create an account, and start tracking.

---

## Deploying to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Vercel auto-detects Vite — no extra config needed.
3. Add your environment variables in **Vercel → Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In Supabase, go to **Authentication → URL Configuration** and set:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`
5. Deploy. Every push to `main` will redeploy automatically.

---

## Project structure

```
src/
├── components/
│   ├── add-entry/      # Single entry form + batch add
│   ├── auth/           # Login page
│   ├── charts/         # DonutChart, AreaChart, StackedAreaChart, Sparkline
│   ├── history/        # Transaction list + inline edit
│   ├── investments/    # Portfolio dashboard
│   ├── layout/         # Sidebar / mobile bottom nav
│   └── overview/       # Dashboard cards, stat cards, category table
├── constants/          # Categories, colours, investment types
├── hooks/              # useAuth, useTransactions, useInvestments, useBatches, useWindowSize
├── services/           # Supabase client, CSV export
├── types/              # Shared TypeScript interfaces
└── utils/              # Date helpers, formatting, month key utilities
```

## Customising categories

Edit `src/constants/categories.ts` to change expense categories and their colours.

Edit `src/constants/investmentTypes.ts` to change the default list of investment positions shown in the dropdown.
