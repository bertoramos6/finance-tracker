# Finance Tracker

A modern, feature-rich personal finance tracking application with cloud synchronization and cross-device support.

![Finance Tracker](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

### Core Functionality
- ✅ **Transaction Management**: Add, edit, and delete income and expense transactions
- 📊 **Data Visualization**: Interactive charts and graphs powered by Chart.js
- 📈 **Analytics Dashboard**: Monthly summaries, spending trends, and category breakdowns
- 💾 **Data Persistence**: Cloud-based storage with offline support
- 📱 **Cross-Device Sync**: Access your data from any device (PC, iPhone, tablet)
- 🔐 **Secure Authentication**: Email/password and Google OAuth sign-in
- 🏷️ **Custom Categories**: Create and manage your own income and expense categories
- 📤 **CSV Export**: Download your transaction history for external analysis

### Technical Features
- 🎨 **Modern UI**: Beautiful, responsive design with glassmorphism effects
- 🌙 **Dark Mode**: Eye-friendly dark color scheme
- ⚡ **Real-time Sync**: Automatic synchronization across devices
- 🔒 **Row Level Security**: Your data is protected at the database level
- 📴 **Offline Support**: Continue working even without internet connection

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern semantic markup and styling
- **JavaScript (ES6+)**: Vanilla JavaScript for application logic
- **Chart.js**: Data visualization library
- **Vite**: Build tool and development server

### Backend
- **Supabase**: PostgreSQL database with built-in authentication
- **Row Level Security (RLS)**: Database-level access control

### Hosting & Deployment
- **Vercel**: Frontend hosting with automatic deployments
- **GitHub**: Version control and CI/CD integration

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase account (free tier available)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production**
   ```bash
   npm run build
   ```

## 🗄️ Database Schema

### Tables

#### `categories`
Stores default and custom user categories.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| user_id | UUID | Foreign key to auth.users |
| type | TEXT | 'income' or 'expense' |
| name | TEXT | Category name |
| description | TEXT | Optional description |
| is_default | BOOLEAN | True for default categories |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `transactions`
Stores all user transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| user_id | UUID | Foreign key to auth.users |
| type | TEXT | 'income' or 'expense' |
| amount | DECIMAL(10,2) | Transaction amount |
| date | DATE | Transaction date |
| category_id | BIGINT | Foreign key to categories |
| comment | TEXT | Optional comment |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Row Level Security (RLS)

All tables have RLS policies ensuring users can only access their own data:
- Users can view, insert, update, and delete their own records
- Default categories cannot be deleted (enforced by policy)
- All policies use `auth.uid()` for user identification

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Traditional signup and login
- **Google OAuth**: One-click sign-in with Google account

### Session Management
- Sessions persist for 7 days by default
- Automatic token refresh
- Secure logout functionality

## 📦 Project Structure

```
finance-tracker/
├── index.html              # Main HTML file
├── app.js                  # Application logic
├── index.css               # Styles
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── .env                    # Environment variables (not in Git)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚢 Deployment

### Vercel Deployment

1. **Connect GitHub repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

2. **Configure environment variables**
   - Add `VITE_SUPABASE_URL` in Vercel dashboard
   - Add `VITE_SUPABASE_ANON_KEY` in Vercel dashboard

3. **Deploy**
   - Automatic deployment on every push to `main` branch
   - Preview deployments for pull requests

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create account with email/password
- [ ] Sign in with Google OAuth
- [ ] Add income transaction
- [ ] Add expense transaction
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Create custom category
- [ ] Edit custom category
- [ ] Delete custom category
- [ ] Export to CSV
- [ ] Test cross-device sync (login from different device)
- [ ] Test offline mode

## 📊 Default Categories

### Income Categories
- Salary
- Freelance
- Investments
- Gifts
- Other Income

### Expense Categories
- Housing
- Transportation
- Food & Dining
- Utilities
- Healthcare
- Entertainment
- Shopping
- Education
- Travel
- Personal Care
- Subscriptions
- Other Expenses

## 🔄 Data Migration

When you first log in after deployment, the app will automatically migrate any existing localStorage data to the cloud:
1. Detects existing local transactions and categories
2. Prompts for migration confirmation
3. Uploads all data to Supabase
4. Links transactions to your user account
5. Maintains data integrity and relationships

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to open an issue for bugs or feature requests.

## 📝 License

MIT License - feel free to use this project for your own personal finance tracking needs.

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [Supabase](https://supabase.com/) for the amazing backend platform
- [Vercel](https://vercel.com/) for seamless deployment

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for better personal finance management**
