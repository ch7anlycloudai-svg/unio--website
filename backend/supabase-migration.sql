-- ============================================
-- Supabase Migration SQL
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates all required tables for the Union Website
-- ============================================

-- ============================================
-- STORAGE BUCKET (auto-created by server)
-- ============================================
-- The server automatically creates a public "uploads" bucket on startup.
-- If you need to create it manually in the Supabase dashboard:
-- 1. Go to Storage in your Supabase project
-- 2. Create a new bucket named "uploads"
-- 3. Set it as Public
-- 4. Set file size limit to 5MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- ============================================

-- ============================================
-- Auto-bootstrap function
-- Called by the Node.js server on every startup.
-- Creates all tables, RLS policies, and indexes if missing.
-- Safe to run repeatedly (fully idempotent).
-- ============================================

CREATE OR REPLACE FUNCTION initialize_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Admin users table
    CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- News table
    CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'news',
        image_url TEXT,
        location VARCHAR(500),
        published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Contact messages table
    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Page content table
    CREATE TABLE IF NOT EXISTS page_content (
        id SERIAL PRIMARY KEY,
        page_name VARCHAR(100) NOT NULL,
        section_id VARCHAR(100) NOT NULL,
        section_title VARCHAR(500),
        content TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',
        display_order INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (page_name, section_id)
    );

    -- Membership applications table
    CREATE TABLE IF NOT EXISTS memberships (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        university VARCHAR(500) NOT NULL,
        major VARCHAR(255) NOT NULL,
        academic_level VARCHAR(100) NOT NULL,
        wilaya VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Hero slides table (for homepage carousel)
    CREATE TABLE IF NOT EXISTS hero_slides (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        subtitle VARCHAR(500),
        image_url TEXT NOT NULL,
        link_url TEXT,
        link_text VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Specialties table (for programs page)
    CREATE TABLE IF NOT EXISTS specialties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255) NOT NULL,
        icon VARCHAR(50) DEFAULT '📚',
        description TEXT,
        image_url TEXT,
        video_url TEXT,
        video_type VARCHAR(50) DEFAULT 'youtube',
        items TEXT,
        duration VARCHAR(100),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
    ALTER TABLE news ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
    ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

    -- RLS Policies (drop + create to stay idempotent)
    DROP POLICY IF EXISTS "Service role full access on admins" ON admins;
    DROP POLICY IF EXISTS "Service role full access on news" ON news;
    DROP POLICY IF EXISTS "Service role full access on messages" ON messages;
    DROP POLICY IF EXISTS "Service role full access on page_content" ON page_content;
    DROP POLICY IF EXISTS "Service role full access on memberships" ON memberships;
    DROP POLICY IF EXISTS "Service role full access on hero_slides" ON hero_slides;
    DROP POLICY IF EXISTS "Service role full access on specialties" ON specialties;

    CREATE POLICY "Service role full access on admins" ON admins FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on news" ON news FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on page_content" ON page_content FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on memberships" ON memberships FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on hero_slides" ON hero_slides FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access on specialties" ON specialties FOR ALL USING (true) WITH CHECK (true);

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_news_published ON news (published);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news (category);
    CREATE INDEX IF NOT EXISTS idx_news_created_at ON news (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_page_content_page ON page_content (page_name);
    CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides (is_active);
    CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties (is_active);
END;
$$;

-- Run it immediately when this migration file is executed
SELECT initialize_schema();
