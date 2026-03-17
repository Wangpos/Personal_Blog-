# Personal Blog Platform - Complete Implementation Guide

## 📋 Project Overview

A collaborative blog platform where:

- Writers can create and edit their own blog posts (like Notion)
- Readers can browse all blogs and comment
- Groups for student-teacher collaboration
- Full authentication system
- All using FREE tier services

---

## 🛠️ Tech Stack (All Free Tier)

### Frontend

- **React** (with Vite) - Fast, modern frontend
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching & caching

### Backend & Database

- **Supabase** - Free tier includes:
  - PostgreSQL database (500MB)
  - Authentication
  - Real-time subscriptions
  - Storage (1GB)
  - Row Level Security (RLS)

### Text Editor

- **Tiptap** or **Slate.js** - Rich text editor (Notion-like)
- Alternative: **react-quill** (simpler)

### Deployment

- **Vercel** - Frontend hosting (free)
- **Supabase** - Backend (already hosted)

---

## 📐 Database Schema

### Tables Structure

```sql
-- Users table (handled by Supabase Auth)
-- No need to create, but we'll extend it with profiles

-- Profiles table
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('student', 'teacher', 'writer')),
  bio TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Blogs/Posts table
posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB, -- Rich text content in JSON format
  author_id UUID REFERENCES profiles(id),
  group_id UUID REFERENCES groups(id), -- Optional
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  views INTEGER DEFAULT 0
)

-- Groups table (for student-teacher collaboration)
groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP
)

-- Group Members table
group_members (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP,
  UNIQUE(group_id, user_id)
)

-- Comments table
comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id), -- For nested comments
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Likes table (optional feature)
likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  UNIQUE(post_id, user_id)
)
```

---

## 🚀 Step-by-Step Implementation

### Phase 1: Setup & Configuration (Day 1)

#### 1.1 Create Supabase Project

```bash
1. Go to https://supabase.com
2. Sign up with GitHub (free)
3. Create new project
4. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secret!)
```

#### 1.2 Initialize React Project

```bash
# Create React app with Vite
npm create vite@latest personal-blog -- --template react
cd personal-blog

# Install dependencies
npm install

# Install required packages
npm install @supabase/supabase-js
npm install react-router-dom
npm install @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install zustand # State management
npm install react-hot-toast # Notifications
npm install lucide-react # Icons

# Initialize Tailwind
npx tailwindcss init -p
```

#### 1.3 Configure Tailwind

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 1.4 Setup Environment Variables

```bash
# Create .env file in root
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### 1.5 Create Supabase Client

```javascript
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### Phase 2: Database Setup (Day 1-2)

#### 2.1 Create Tables in Supabase

Go to Supabase Dashboard → SQL Editor → New Query

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'writer' CHECK (role IN ('student', 'teacher', 'writer')),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  views INTEGER DEFAULT 0
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(group_id, user_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX posts_author_id_idx ON posts(author_id);
CREATE INDEX posts_group_id_idx ON posts(group_id);
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX group_members_group_id_idx ON group_members(group_id);
CREATE INDEX group_members_user_id_idx ON group_members(user_id);
```

#### 2.2 Setup Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Groups are viewable by members"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Group members are viewable by group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2.3 Create Trigger for Profile Creation

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Phase 3: Authentication (Day 2-3)

#### 3.1 Create Auth Context

```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const signUp = async (email, password, username, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    profile,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

#### 3.2 Create Auth Pages

```javascript
// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

```javascript
// src/pages/SignUp.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, username, fullName);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              minLength="6"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### Phase 4: Core Features (Day 3-7)

#### 4.1 Home Page - All Blogs

```javascript
// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns"; // npm install date-fns

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id (username, full_name, avatar_url),
        comments (count),
        likes (count)
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error) {
      setPosts(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Latest Blog Posts</h1>

      <div className="space-y-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/post/${post.id}`}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <span>{post.profiles?.full_name || post.profiles?.username}</span>
              <span className="mx-2">•</span>
              <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
            </div>
            <p className="text-gray-700 line-clamp-3">
              {/* Extract plain text from content */}
              {post.content?.content?.[0]?.content?.[0]?.text ||
                "No preview available"}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>👁 {post.views} views</span>
              <span>💬 {post.comments?.[0]?.count || 0} comments</span>
              <span>❤️ {post.likes?.[0]?.count || 0} likes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### 4.2 Rich Text Editor Component

```javascript
// src/components/Editor.jsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function Editor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your blog post...",
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b p-2 flex gap-2 bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${editor.isActive("bold") ? "bg-gray-300" : "bg-white"}`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${editor.isActive("italic") ? "bg-gray-300" : "bg-white"}`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`px-3 py-1 rounded ${editor.isActive("heading", { level: 1 }) ? "bg-gray-300" : "bg-white"}`}
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`px-3 py-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-300" : "bg-white"}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded ${editor.isActive("bulletList") ? "bg-gray-300" : "bg-white"}`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1 rounded ${editor.isActive("codeBlock") ? "bg-gray-300" : "bg-white"}`}
        >
          Code
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[400px]"
      />
    </div>
  );
}
```

#### 4.3 Create/Edit Post Page

```javascript
// src/pages/CreatePost.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Editor from "../components/Editor";
import toast from "react-hot-toast";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          content,
          author_id: user.id,
          is_published: isPublished,
        },
      ])
      .select();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Post created successfully!");
      navigate(`/post/${data[0].id}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 text-2xl font-bold border-b-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <Editor content={content} onChange={setContent} />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Publish immediately</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : isPublished ? "Publish" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

#### 4.4 View Post with Comments

```javascript
// src/pages/ViewPost.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import toast from "react-hot-toast";

export default function ViewPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: post?.content,
    editable: false,
  });

  useEffect(() => {
    fetchPost();
    fetchComments();
    incrementViews();
  }, [id]);

  useEffect(() => {
    if (editor && post) {
      editor.commands.setContent(post.content);
    }
  }, [editor, post]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id (username, full_name, avatar_url)
      `,
      )
      .eq("id", id)
      .single();

    if (!error) {
      setPost(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles:user_id (username, full_name, avatar_url)
      `,
      )
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setComments(data);
    }
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_views", { post_id: id });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        post_id: id,
        user_id: user.id,
        content: newComment,
      },
    ]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Comment added!");
      setNewComment("");
      fetchComments();
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!post) {
    return <div className="text-center py-12">Post not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-gray-600 mb-8">
          <div className="flex items-center gap-2">
            {post.profiles?.avatar_url && (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.full_name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span>{post.profiles?.full_name || post.profiles?.username}</span>
          </div>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.views} views</span>
        </div>

        <div className="prose max-w-none">
          <EditorContent editor={editor} />
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">
          Comments ({comments.length})
        </h2>

        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
            />
            <button
              type="submit"
              className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Post Comment
            </button>
          </form>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {comment.profiles?.full_name || comment.profiles?.username}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 4.5 Groups Feature

```javascript
// src/pages/Groups.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from("group_members")
      .select(
        `
        groups (
          *,
          profiles:created_by (username, full_name)
        )
      `,
      )
      .eq("user_id", user.id);

    if (data) {
      setGroups(data.map((item) => item.groups));
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();

    const { data: group, error } = await supabase
      .from("groups")
      .insert([
        {
          name: newGroupName,
          description: newGroupDesc,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    // Add creator as admin
    await supabase.from("group_members").insert([
      {
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      },
    ]);

    toast.success("Group created!");
    setShowCreateModal(false);
    setNewGroupName("");
    setNewGroupDesc("");
    fetchGroups();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Create Group
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Link
            key={group.id}
            to={`/group/${group.id}`}
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-bold mb-2">{group.name}</h3>
            <p className="text-gray-600 mb-4">{group.description}</p>
            <p className="text-sm text-gray-500">
              Created by {group.profiles?.full_name || group.profiles?.username}
            </p>
          </Link>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
            <form onSubmit={createGroup}>
              <input
                type="text"
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4"
                required
              />
              <textarea
                placeholder="Description"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4"
                rows="3"
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Phase 5: Routing & Layout (Day 7-8)

#### 5.1 Main App Setup

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import CreatePost from "./pages/CreatePost";
import ViewPost from "./pages/ViewPost";
import Groups from "./pages/Groups";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="post/:id" element={<ViewPost />} />
              <Route
                path="create"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="groups"
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

#### 5.2 Layout Component

```javascript
// src/components/Layout.jsx
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PenSquare, Users, User, LogOut, Home } from "lucide-react";

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                BlogSpace
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 hover:text-indigo-600"
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/create"
                    className="flex items-center gap-2 hover:text-indigo-600"
                  >
                    <PenSquare size={20} />
                    <span>Write</span>
                  </Link>
                  <Link
                    to="/groups"
                    className="flex items-center gap-2 hover:text-indigo-600"
                  >
                    <Users size={20} />
                    <span>Groups</span>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 hover:text-indigo-600"
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 hover:text-red-600"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-indigo-600 hover:text-indigo-800"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2026 BlogSpace - A collaborative blogging platform</p>
        </div>
      </footer>
    </div>
  );
}
```

---

### Phase 6: Additional Features (Day 8-10)

#### 6.1 Add View Counter Function

```sql
-- In Supabase SQL Editor
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET views = views + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 6.2 Search Functionality

```javascript
// src/components/SearchBar.jsx
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const { data } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id (username, full_name)
      `,
      )
      .eq("is_published", true)
      .or(`title.ilike.%${query}%,content->>text.ilike.%${query}%`);

    onResults(data || []);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts..."
        className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
      >
        <Search size={20} />
      </button>
    </form>
  );
}
```

---

### Phase 7: Deployment (Day 10)

#### 7.1 Prepare for Deployment

```bash
# Build the project
npm run build

# Test the build locally
npm run preview
```

#### 7.2 Deploy to Vercel

1. **Push to GitHub**:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy on Vercel**:

- Go to https://vercel.com
- Sign in with GitHub
- Click "New Project"
- Import your repository
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Click "Deploy"

#### 7.3 Configure Supabase for Production

In Supabase Dashboard → Authentication → URL Configuration:

- Add your Vercel URL to "Site URL"
- Add redirect URLs

---

## 🎯 Feature Checklist

### Core Features

- ✅ User authentication (signup/login)
- ✅ Create and edit blog posts
- ✅ Rich text editor (Notion-like)
- ✅ View all published posts
- ✅ Comment system
- ✅ User profiles
- ✅ Groups for collaboration
- ✅ Student-Teacher functionality
- ✅ Like posts
- ✅ View counter

### Optional Enhancements

- [ ] Image upload to Supabase Storage
- [ ] Tags and categories
- [ ] Follow users
- [ ] Bookmarks
- [ ] Email notifications
- [ ] Draft auto-save
- [ ] Dark mode
- [ ] Search with filters
- [ ] Markdown export
- [ ] Social sharing

---

## 💰 Free Tier Limits

### Supabase Free Tier

- 500MB database space
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth/month
- API requests: Unlimited

### Vercel Free Tier

- 100GB bandwidth/month
- Unlimited deployments
- Custom domains
- Automatic HTTPS

**These limits are MORE than enough for a student project!**

---

## 📚 Learning Resources

### React

- https://react.dev/learn
- https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started

### Supabase

- https://supabase.com/docs
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database

### Tiptap (Editor)

- https://tiptap.dev/docs/editor/introduction

### Tailwind CSS

- https://tailwindcss.com/docs

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid API credentials"

- Double-check your Supabase URL and anon key in `.env`
- Make sure you're using `VITE_` prefix for Vite

### Issue: RLS policies blocking queries

- Check Supabase Dashboard → Authentication → Policies
- Make sure policies allow the operations you need

### Issue: Comments not showing

- Verify RLS policies on comments table
- Check if user is authenticated

### Issue: Editor not loading

- Clear browser cache
- Check console for errors
- Make sure Tiptap packages are installed

---

## 🚀 Next Steps After MVP

1. **Add image support**: Use Supabase Storage for images
2. **Implement tags**: Add tags table and many-to-many relationship
3. **Add notifications**: Use Supabase real-time for live notifications
4. **Email integration**: Send email notifications for comments
5. **Analytics**: Track popular posts and user engagement
6. **Mobile responsive**: Test and improve mobile experience
7. **SEO optimization**: Add meta tags for better search visibility

---

## 📞 Getting Help

- Supabase Discord: https://discord.supabase.com
- React Discord: https://discord.gg/react
- Stack Overflow: Tag questions with `reactjs` and `supabase`

---

## 🎓 Project Timeline

- **Week 1**: Setup, authentication, basic UI (Phases 1-3)
- **Week 2**: Core features - posts, editor, comments (Phase 4)
- **Week 3**: Groups, search, polish (Phases 5-6)
- **Week 4**: Testing, bug fixes, deployment (Phase 7)

**Total estimated time: 3-4 weeks** (working a few hours per day)

---

Good luck with your project! 🚀

Remember: Start small, test often, and add features incrementally. You can always add more features later!
