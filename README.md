# 📝 Personal Blog Platform

A modern, full-featured blogging platform built with React, Supabase, and TailwindCSS.

## 🚀 How to Run

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a **new project**
2. Wait for your project to be ready (takes ~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click "New Query"
5. Copy the **entire contents** of `database.sql` file
6. Paste it into the SQL Editor and click **Run**
7. This creates all tables, security policies, and functions

### Step 3: Configure Environment Variables

1. In Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** section
3. Copy your **Project URL** and **anon public** key
4. Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

5. Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run the Development Server

```bash
npm run dev
```

🎉 Open [http://localhost:5173](http://localhost:5173) in your browser!

## 📝 First Steps

1. **Sign up** for an account
2. **Create your first blog post** by clicking "Write"
3. **Publish** or save as draft
4. **Explore** other features like comments, likes, and groups

## 🛠️ Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## ✨ Features

- 🔐 Authentication (signup/login)
- ✍️ Rich text editor (Notion-like)
- 💬 Real-time comments
- ❤️ Like posts
- 👥 User profiles
- 🎓 Groups for collaboration
- 📊 View counter
- 📱 Responsive design

## 🐛 Troubleshooting

**"Missing Supabase environment variables" error:**

- Make sure `.env` file exists
- Check that variable names start with `VITE_`
- Restart dev server after changing `.env`

**Database errors:**

- Ensure you ran the complete `database.sql` script in Supabase
- Check SQL Editor in Supabase for any error messages

**Can't create posts:**

- Make sure you're signed in
- Check browser console for errors
- Verify Supabase credentials are correct

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import your repository
4. Add environment variables (same as `.env`)
5. Deploy!

Then update Supabase:

- Go to **Authentication** → **URL Configuration**
- Add your Vercel URL to "Site URL"
