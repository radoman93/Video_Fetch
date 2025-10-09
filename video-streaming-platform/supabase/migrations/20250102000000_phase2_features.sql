-- =====================================================
-- PHASE 2: USER ENGAGEMENT FEATURES
-- =====================================================
-- Migration for: likes, favorites, comments, playlists
-- Date: 2025-01-02
-- =====================================================

-- =====================================================
-- VIDEO LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS video_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX idx_video_likes_created_at ON video_likes(created_at DESC);

-- Trigger to update like_count on videos table
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE videos SET like_count = like_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_like_count_trigger
    AFTER INSERT OR DELETE ON video_likes
    FOR EACH ROW EXECUTE FUNCTION update_video_like_count();

-- RLS Policies
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all likes" ON video_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON video_likes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_video_id ON favorites(video_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENT LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Trigger for comment like_count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_like_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view non-deleted comments" ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- RLS for comment likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PLAYLISTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    video_count INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_is_public ON playlists(is_public);
CREATE INDEX idx_playlists_created_at ON playlists(created_at DESC);

-- Trigger for playlists updated_at
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PLAYLIST VIDEOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS playlist_videos (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, video_id)
);

CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX idx_playlist_videos_position ON playlist_videos(position);

-- Trigger for playlist video_count
CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE playlists SET video_count = video_count + 1 WHERE id = NEW.playlist_id;
        -- Update thumbnail to first video if not set
        UPDATE playlists SET thumbnail_url = (
            SELECT v.thumbnail_url FROM videos v WHERE v.id = NEW.video_id
        ) WHERE id = NEW.playlist_id AND thumbnail_url IS NULL;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE playlists SET video_count = video_count - 1 WHERE id = OLD.playlist_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_playlist_video_count_trigger
    AFTER INSERT OR DELETE ON playlist_videos
    FOR EACH ROW EXECUTE FUNCTION update_playlist_video_count();

-- RLS for playlists
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON playlists
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON playlists
    FOR DELETE USING (auth.uid() = user_id);

-- RLS for playlist_videos
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view playlist videos for public playlists" ON playlist_videos
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM playlists WHERE id = playlist_id AND (is_public = true OR user_id = auth.uid())
    ));
CREATE POLICY "Users can manage own playlist videos" ON playlist_videos
    FOR ALL USING (EXISTS (
        SELECT 1 FROM playlists WHERE id = playlist_id AND user_id = auth.uid()
    ));

-- =====================================================
-- HELPER FUNCTIONS FOR PHASE 2
-- =====================================================

-- Function to get user's liked videos
CREATE OR REPLACE FUNCTION get_user_liked_videos(user_uuid UUID, limit_count INTEGER DEFAULT 24)
RETURNS TABLE (
    video_id UUID,
    liked_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT vl.video_id, vl.created_at AS liked_at
    FROM video_likes vl
    WHERE vl.user_id = user_uuid
    ORDER BY vl.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended videos based on user's liked videos tags
CREATE OR REPLACE FUNCTION get_recommended_videos(user_uuid UUID, limit_count INTEGER DEFAULT 24)
RETURNS TABLE (
    video_id UUID,
    relevance_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id AS video_id, COUNT(vt.tag_id) AS relevance_score
    FROM videos v
    JOIN video_tags vt ON v.id = vt.video_id
    WHERE vt.tag_id IN (
        -- Get tags from user's liked videos
        SELECT DISTINCT vt2.tag_id
        FROM video_likes vl
        JOIN video_tags vt2 ON vl.video_id = vt2.video_id
        WHERE vl.user_id = user_uuid
    )
    AND v.id NOT IN (
        -- Exclude already liked videos
        SELECT video_id FROM video_likes WHERE user_id = user_uuid
    )
    AND v.status = 'active'
    GROUP BY v.id
    ORDER BY relevance_score DESC, v.view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's watch history (from video_views)
CREATE OR REPLACE FUNCTION get_user_watch_history(user_uuid UUID, limit_count INTEGER DEFAULT 24)
RETURNS TABLE (
    video_id UUID,
    last_viewed TIMESTAMPTZ,
    view_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT vv.video_id, MAX(vv.viewed_at) AS last_viewed, COUNT(*) AS view_count
    FROM video_views vv
    WHERE vv.user_id = user_uuid
    GROUP BY vv.video_id
    ORDER BY last_viewed DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE video_likes IS 'Tracks which users liked which videos';
COMMENT ON TABLE favorites IS 'User favorite videos (watchlist)';
COMMENT ON TABLE comments IS 'Video comments with nested reply support';
COMMENT ON TABLE comment_likes IS 'Likes on comments';
COMMENT ON TABLE playlists IS 'User-created playlists';
COMMENT ON TABLE playlist_videos IS 'Videos in playlists with ordering';
