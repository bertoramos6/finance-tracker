# Personal Finance Tracker

A modern, privacy-focused personal finance tracker with cloud sync capabilities. Track your income and expenses across all your devices with a clean, intuitive interface.

## ✨ Features

- 📊 **Visual Analytics** - Interactive charts and monthly category breakdowns
- 💰 **Transaction Management** - Easy income/expense tracking with custom categories
- 📱 **Cross-Device Sync** - Access your data from phone, tablet, and desktop
- 🔒 **Privacy-First** - Your data, your control with Supabase backend
- 🎨 **Modern UI** - Clean, responsive design that works on all devices
- 📈 **Smart Filtering** - Quick filters for This Year, All Time, or specific years
- 📋 **Category Breakdown** - Monthly spending analysis by category
- 💾 **CSV Export** - Download your transaction history anytime

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- A Supabase account (free tier works great)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/finance-tracker.git
cd finance-tracker
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase SQL Editor:
   - Copy contents of `supabase-schema.sql`
   - Paste and run in your Supabase SQL Editor
3. Create your user account in Supabase Dashboard:
   - Go to **Authentication** → **Users** → **Add user**
   - Create with your email and password
   - ✅ Check "Auto Confirm User"

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USER_EMAIL=your-email@example.com
VITE_USER_PASSWORD=your-password
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 📱 Mobile Access

The app is fully responsive and works great on mobile browsers. Once deployed, simply visit the URL on your phone!

## 🌐 Deploy to Production

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_USER_EMAIL`
   - `VITE_USER_PASSWORD`
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and import your repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

## 🔧 Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Chart.js
- **Hosting**: Vercel/Netlify

## 📖 Usage

### Adding Transactions

1. Click **Add Entry** tab
2. Select type (Expense/Income)
3. Enter amount, date, category, and optional comment
4. Click **Add Transaction**

### Viewing Analytics

1. Click **Overview** tab
2. Use quick filters: **This Year**, **All Time**, or select a specific year
3. View charts and monthly category breakdown table

### Managing Categories

1. Click **Categories** tab
2. Switch between Expense/Income categories
3. Add custom categories or edit existing ones

### Exporting Data

1. Go to **History** tab
2. Click **Export CSV**
3. Save your transaction history

## 🔒 Security Notes

- ✅ `.env` file is git-ignored (never commit secrets!)
- ✅ Supabase RLS (Row Level Security) protects your data
- ✅ Only you can access your transactions
- ✅ Use a strong, unique password

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

MIT License - feel free to use this for your personal finance tracking!

## 🙏 Acknowledgments

Built with ❤️ for personal finance management

---

**Note**: This is a personal finance tracker designed for single-user use. All your data is stored securely in your Supabase database.
