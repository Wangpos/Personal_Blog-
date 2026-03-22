-- Personal Blog Platform - Admin Setup Migration
-- Safe migration to add admin role support with RLS policies
-- Keeps all existing data and roles intact ('writer' and 'admin' only)
-- Run this SQL in your Supabase SQL Editor

-- =============================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- =============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: DROP OLD POLICIES
-- =============================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop all existing policies on posts
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Drop all existing policies on comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Drop all existing policies on likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

-- =============================================
-- STEP 3: DROP OLD TABLES (if they exist)
-- =============================================

DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- =============================================
-- STEP 4: UPDATE PROFILES TABLE
-- =============================================

-- Drop old role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Convert all existing roles to 'writer' (except those already 'admin')
UPDATE profiles SET role = 'writer' WHERE role NOT IN ('writer', 'admin');

-- Add DEFAULT role for new signups
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'writer';

-- Add new constraint with only writer and admin roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('writer', 'admin'));

-- =============================================
-- STEP 5: CLEAN UP POSTS TABLE
-- =============================================

-- Remove group_id if it exists
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_group_id_fkey;
ALTER TABLE posts DROP COLUMN IF EXISTS group_id;

-- =============================================
-- STEP 6: RE-ENABLE RLS AND CREATE NEW POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON profiles;

CREATE POLICY "profiles_public_select"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_user_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_user_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- POSTS POLICIES
-- =============================================

DROP POLICY IF EXISTS "posts_public_select" ON posts;
DROP POLICY IF EXISTS "posts_user_insert" ON posts;
DROP POLICY IF EXISTS "posts_user_update" ON posts;
DROP POLICY IF EXISTS "posts_user_delete" ON posts;

CREATE POLICY "posts_public_select"
  ON posts FOR SELECT
  USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "posts_user_insert"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_user_update"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "posts_user_delete"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- =============================================
-- COMMENTS POLICIES
-- =============================================

DROP POLICY IF EXISTS "comments_public_select" ON comments;
DROP POLICY IF EXISTS "comments_user_insert" ON comments;
DROP POLICY IF EXISTS "comments_user_update" ON comments;
DROP POLICY IF EXISTS "comments_user_delete" ON comments;

CREATE POLICY "comments_public_select"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "comments_user_insert"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_user_update"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "comments_user_delete"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- LIKES POLICIES
-- =============================================

DROP POLICY IF EXISTS "likes_public_select" ON likes;
DROP POLICY IF EXISTS "likes_user_insert" ON likes;
DROP POLICY IF EXISTS "likes_user_delete" ON likes;

CREATE POLICY "likes_public_select"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "likes_user_insert"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_user_delete"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: SET ADMIN USER
-- =============================================

-- Promote the specified user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tsheringwangpodorji@gmail.com'
);

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================
-- Roles supported: 'writer' and 'admin' only
-- All RLS policies enabled and configured
-- Admin user has been set
-- 
-- To make another user admin, run:
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';