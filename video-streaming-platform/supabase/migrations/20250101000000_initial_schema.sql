-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- =====================================================
-- PROFILES TABLE (Extends Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUTHORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE (Hierarchical)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS actors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VIDEOS TABLE (Main table - stores R2 URLs only)
-- =====================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT UNIQUE NOT NULL, -- Hash from library.json
    title TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES authors(id) ON DELETE SET NULL,

    -- Video file URLs (Cloudflare R2)
    video_url TEXT NOT NULL, -- Main R2 URL
    thumbnail_url TEXT,
    preview_url TEXT, -- For hover previews

    -- Video metadata
    duration INTEGER, -- in seconds
    width INTEGER,
    height INTEGER,
    quality TEXT, -- HD, SD, 4K, etc.
    file_size BIGINT, -- in bytes
    format TEXT, -- mp4, webm, etc.

    -- Stats
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active', -- active, deleted, pending
    is_featured BOOLEAN DEFAULT FALSE,

    -- Dates
    uploaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Full-text search vector
    search_vector tsvector
);

-- =====================================================
-- JUNCTION TABLES
-- =====================================================

-- Video-Tag relationship
CREATE TABLE IF NOT EXISTS video_tags (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (video_id, tag_id)
);

-- Video-Category relationship
CREATE TABLE IF NOT EXISTS video_categories (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (video_id, category_id)
);

-- Video-Actor relationship
CREATE TABLE IF NOT EXISTS video_actors (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (video_id, actor_id)
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Video views tracking
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash TEXT, -- Privacy-friendly hashed IP
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Videos table indexes
CREATE INDEX idx_videos_author_id ON videos(author_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX idx_videos_uploaded_at ON videos(uploaded_at DESC);
CREATE INDEX idx_videos_video_id ON videos(video_id);

-- Full-text search index
CREATE INDEX idx_videos_search_vector ON videos USING GIN(search_vector);

-- Junction table indexes
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);
CREATE INDEX idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX idx_video_actors_actor_id ON video_actors(actor_id);
CREATE INDEX idx_video_actors_video_id ON video_actors(video_id);

-- Analytics indexes
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_viewed_at ON video_views(viewed_at DESC);

-- Categories hierarchical index
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Slug indexes for fast lookups
CREATE INDEX idx_authors_slug ON authors(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_actors_slug ON actors(slug);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actors_updated_at BEFORE UPDATE ON actors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector on video changes
CREATE OR REPLACE FUNCTION update_video_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_search_vector BEFORE INSERT OR UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_video_search_vector();

-- Auto-update video_count for authors
CREATE OR REPLACE FUNCTION update_author_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.author_id IS NOT NULL) THEN
        UPDATE authors SET video_count = video_count + 1 WHERE id = NEW.author_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.author_id IS NOT NULL) THEN
        UPDATE authors SET video_count = video_count - 1 WHERE id = OLD.author_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.author_id != OLD.author_id) THEN
        IF OLD.author_id IS NOT NULL THEN
            UPDATE authors SET video_count = video_count - 1 WHERE id = OLD.author_id;
        END IF;
        IF NEW.author_id IS NOT NULL THEN
            UPDATE authors SET video_count = video_count + 1 WHERE id = NEW.author_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_author_video_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_author_video_count();

-- Auto-update video_count for tags
CREATE OR REPLACE FUNCTION update_tag_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE tags SET video_count = video_count + 1 WHERE id = NEW.tag_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE tags SET video_count = video_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_video_count_trigger
    AFTER INSERT OR DELETE ON video_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_video_count();

-- Auto-update video_count for categories
CREATE OR REPLACE FUNCTION update_category_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE categories SET video_count = video_count + 1 WHERE id = NEW.category_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE categories SET video_count = video_count - 1 WHERE id = OLD.category_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_video_count_trigger
    AFTER INSERT OR DELETE ON video_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_video_count();

-- Auto-update video_count for actors
CREATE OR REPLACE FUNCTION update_actor_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE actors SET video_count = video_count + 1 WHERE id = NEW.actor_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE actors SET video_count = video_count - 1 WHERE id = OLD.actor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_actor_video_count_trigger
    AFTER INSERT OR DELETE ON video_actors
    FOR EACH ROW EXECUTE FUNCTION update_actor_video_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Public read access for all content (read-only for anonymous users)
CREATE POLICY "Public read access for authors" ON authors FOR SELECT USING (true);
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read access for actors" ON actors FOR SELECT USING (true);
CREATE POLICY "Public read access for videos" ON videos FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access for video_tags" ON video_tags FOR SELECT USING (true);
CREATE POLICY "Public read access for video_categories" ON video_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for video_actors" ON video_actors FOR SELECT USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Anyone can track views (for analytics)
CREATE POLICY "Anyone can insert views" ON video_views FOR INSERT WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get trending videos (based on recent views)
CREATE OR REPLACE FUNCTION get_trending_videos(days INTEGER DEFAULT 7, limit_count INTEGER DEFAULT 24)
RETURNS TABLE (
    video_id UUID,
    title TEXT,
    view_count_recent BIGINT,
    total_views INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id AS video_id,
        v.title,
        COUNT(vv.id) AS view_count_recent,
        v.view_count AS total_views
    FROM videos v
    LEFT JOIN video_views vv ON v.id = vv.video_id
        AND vv.viewed_at > NOW() - (days || ' days')::INTERVAL
    WHERE v.status = 'active'
    GROUP BY v.id, v.title, v.view_count
    ORDER BY view_count_recent DESC, v.view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get related videos (by tags)
CREATE OR REPLACE FUNCTION get_related_videos(input_video_id UUID, limit_count INTEGER DEFAULT 12)
RETURNS TABLE (
    video_id UUID,
    title TEXT,
    shared_tags BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id AS video_id,
        v.title,
        COUNT(vt2.tag_id) AS shared_tags
    FROM videos v
    JOIN video_tags vt2 ON v.id = vt2.video_id
    WHERE vt2.tag_id IN (
        SELECT tag_id FROM video_tags WHERE video_id = input_video_id
    )
    AND v.id != input_video_id
    AND v.status = 'active'
    GROUP BY v.id, v.title
    ORDER BY shared_tags DESC, v.view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE videos IS 'Video metadata - video files stored in Cloudflare R2';
COMMENT ON COLUMN videos.video_url IS 'Cloudflare R2 URL for video file';
COMMENT ON COLUMN videos.video_id IS 'Original hash ID from library.json';
COMMENT ON TABLE video_views IS 'Analytics tracking for video views';
