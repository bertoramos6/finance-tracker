# Phase 3B Setup Instructions

This document provides step-by-step instructions for setting up the GitHub repository and Supabase backend.

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account
- [ ] Git installed on your computer
- [ ] Email address for Supabase account
- [ ] Google account (for OAuth setup)

## Part 1: GitHub Repository Setup

### Step 1: Initialize Git Repository

Open Terminal and navigate to your project directory:

```bash
cd /Users/bertoramos/.gemini/antigravity/scratch/finance-tracker
```

Initialize Git (if not already done):

```bash
git init
```

### Step 2: Make Initial Commit

Add all files to Git:

```bash
git add .
```

Create the initial commit:

```bash
git commit -m "Initial commit: Finance tracker with custom categories and data visualization"
```

### Step 3: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in the repository details:
   - **Repository name**: `finance-tracker`
   - **Description**: `Personal finance tracking application with cloud sync`
   - **Visibility**: Select **Private** ⚠️
   - **DO NOT** check "Initialize this repository with a README"
   - **DO NOT** add .gitignore or license (we already have them)
3. Click **"Create repository"**

### Step 4: Push Code to GitHub

After creating the repository, GitHub will show you commands. Run these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 5: Verify Upload

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/finance-tracker`
2. Verify that all files are present
3. **IMPORTANT**: Check that `.env` file is **NOT** visible (it should be ignored by .gitignore)
4. Verify that `.env.example` **IS** visible

✅ **GitHub Setup Complete!**

---

## Part 2: Supabase Backend Setup

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

### Step 2: Create New Project

1. Click **"New Project"**
2. Select or create an organization (use default if unsure)
3. Fill in project details:
   - **Name**: `finance-tracker`
   - **Database Password**: Click "Generate a password" and **SAVE IT SECURELY** 🔑
   - **Region**: Choose the closest region to your location
   - **Pricing Plan**: Select **Free** (should be selected by default)
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to be provisioned ⏳

### Step 3: Get Your Supabase Credentials

1. Once the project is ready, go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
4. **Keep this page open** - you'll need these values soon

### Step 4: Create Database Schema

1. In the left sidebar, click **SQL Editor**
2. Click **"New query"**
3. Open the file `supabase-schema.sql` in your project directory
4. Copy the **entire contents** of that file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd+Enter)
7. You should see "Success. No rows returned" - this is correct! ✅

### Step 5: Verify Database Setup

1. In the left sidebar, click **Table Editor**
2. You should see two tables:
   - `categories`
   - `transactions`
3. Click on `categories` - it should be empty (no rows yet)
4. Click on `transactions` - it should also be empty

✅ **Database Schema Created!**

### Step 6: Configure Email/Password Authentication

1. In the left sidebar, click **Authentication**
2. Click **Providers** tab
3. **Email** provider should already be enabled (green toggle)
4. Click on **Email** to configure:
   - **Enable Email Confirmations**: Toggle ON (recommended for security)
   - **Secure Email Change**: Toggle ON
   - Click **"Save"**

✅ **Email Authentication Configured!**

### Step 7: Configure Google OAuth (Optional but Recommended)

This step is more involved. Follow the detailed guide in `GOOGLE_OAUTH_SETUP.md`.

**Quick Summary**:
1. Create Google Cloud project
2. Configure OAuth consent screen
3. Create OAuth credentials (Client ID + Secret)
4. Add Supabase callback URL to Google
5. Add Google credentials to Supabase

**Detailed Instructions**: See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

⏭️ **You can skip this for now and add it later if you prefer**

### Step 8: Create Environment File

1. In your project directory, create a new file called `.env`
2. Copy the contents from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in your text editor
4. Replace the placeholder values with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```
5. Save the file
6. **VERIFY**: The `.env` file should **NOT** be committed to Git (it's in .gitignore)

### Step 9: Test Database with a Test User

Let's verify everything works by creating a test user:

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: Your email address
   - **Password**: Create a test password
   - **Auto Confirm User**: Toggle ON (for testing)
4. Click **"Create user"**

5. Now verify default categories were created:
   - Go to **Table Editor** → **categories**
   - You should see 17 rows (5 income + 12 expense categories)
   - All should have `is_default = true`
   - All should have the same `user_id` (your test user's ID)

✅ **If you see the categories, everything is working perfectly!**

---

## Part 3: Verification Checklist

### GitHub Repository ✅
- [ ] Repository is created and set to **Private**
- [ ] All code files are pushed to GitHub
- [ ] `.env` file is **NOT** visible on GitHub
- [ ] `.env.example` **IS** visible on GitHub
- [ ] README.md displays correctly

### Supabase Database ✅
- [ ] Project is created and running
- [ ] `categories` table exists
- [ ] `transactions` table exists
- [ ] Row Level Security (RLS) is enabled on both tables
- [ ] Test user created successfully
- [ ] Default categories created automatically for test user

### Authentication ✅
- [ ] Email/password authentication is enabled
- [ ] Email confirmation is configured
- [ ] Google OAuth is configured (optional)
- [ ] Test user can be created

### Local Environment ✅
- [ ] `.env` file exists locally
- [ ] `.env` contains correct Supabase URL
- [ ] `.env` contains correct anon key
- [ ] `.env` is in `.gitignore`

---

## 🎉 Phase 3B Complete!

You've successfully:
- ✅ Created a private GitHub repository
- ✅ Set up Supabase backend with database schema
- ✅ Configured Row Level Security policies
- ✅ Enabled authentication (email/password + optional Google OAuth)
- ✅ Verified everything works with a test user

## 📝 Important Information to Save

Make sure you have saved these securely:

1. **GitHub Repository URL**: `https://github.com/YOUR_USERNAME/finance-tracker`
2. **Supabase Project URL**: `https://your-project-ref.supabase.co`
3. **Supabase Anon Key**: `eyJ...` (in your `.env` file)
4. **Supabase Database Password**: (the one you generated)
5. **Google OAuth Credentials** (if configured):
   - Client ID
   - Client Secret

## 🚀 Next Steps: Phase 3C

Now that the backend is set up, the next phase will:
1. Install Supabase JavaScript client library
2. Create authentication UI (login/signup pages)
3. Implement API layer for CRUD operations
4. Build data migration from localStorage to Supabase
5. Add real-time sync capabilities

---

## 🆘 Troubleshooting

### Git Push Fails
- Make sure you've replaced `YOUR_USERNAME` with your actual GitHub username
- If prompted for credentials, use a Personal Access Token (not password)
- Generate token at: https://github.com/settings/tokens

### Supabase SQL Script Fails
- Make sure you copied the **entire** script
- Check for any error messages in the SQL Editor
- Try running the script again (it's safe to run multiple times)

### Default Categories Not Created
- Check that the trigger was created: Go to Database → Triggers
- Delete the test user and create a new one
- Check the SQL Editor for any error messages

### Can't Find Supabase Credentials
- Go to Settings → API in your Supabase project
- The URL and keys are always available there

---

**Need Help?** Check the Supabase documentation or create an issue in your GitHub repository.
