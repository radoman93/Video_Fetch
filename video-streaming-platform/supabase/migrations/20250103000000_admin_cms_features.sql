-- =====================================================
-- Video Streaming Platform - Phase 3: Admin CMS
-- Migration: 20250103000000_admin_cms_features.sql
-- Description: Adds admin roles, analytics, and CMS features
-- =====================================================

-- =====================================================
-- 1. USER ROLES & PERMISSIONS
-- =====================================================

-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Create index for role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- =====================================================
-- 2. ADMIN ACTIVITY LOGS
-- =====================================================

-- Track all admin actions for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'bulk_update', etc.
  entity_type TEXT NOT NULL, -- 'video', 'user', 'tag', 'category', etc.
  entity_id UUID,
  details JSONB, -- Stores before/after values and additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for admin logs
CREATE INDEX idx_admin_logs_admin_user ON admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_logs_entity ON admin_activity_logs(entity_type, entity_id);
CREATE INDEX idx_admin_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_logs_action ON admin_activity_logs(action);

-- =====================================================
-- 3. PLATFORM ANALYTICS
-- =====================================================

-- Daily analytics summary (calculated once per day)
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0, -- Users who performed any action
  videos_uploaded INTEGER DEFAULT 0,
  avg_video_duration INTEGER DEFAULT 0, -- In seconds
  total_watch_time INTEGER DEFAULT 0, -- In seconds
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for date lookups
CREATE INDEX idx_daily_analytics_date ON daily_analytics(date DESC);

-- Video performance metrics (updated in real-time)
CREATE TABLE IF NOT EXISTS video_performance (
  video_id UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  views_today INTEGER DEFAULT 0,
  views_this_week INTEGER DEFAULT 0,
  views_this_month INTEGER DEFAULT 0,
  likes_today INTEGER DEFAULT 0,
  favorites_today INTEGER DEFAULT 0,
  avg_watch_duration INTEGER DEFAULT 0, -- Percentage of video watched
  engagement_score DECIMAL(5,2) DEFAULT 0, -- Calculated score
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance tracking
CREATE INDEX idx_video_performance_engagement ON video_performance(engagement_score DESC);
CREATE INDEX idx_video_performance_views_week ON video_performance(views_this_week DESC);

-- =====================================================
-- 4. CONTENT MODERATION
-- =====================================================

-- Flagged content table
CREATE TABLE IF NOT EXISTS flagged_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  flagged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL, -- 'inappropriate', 'copyright', 'spam', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'removed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for moderation
CREATE INDEX idx_flagged_content_status ON flagged_content(status);
CREATE INDEX idx_flagged_content_video ON flagged_content(video_id);
CREATE INDEX idx_flagged_content_created ON flagged_content(created_at DESC);

-- =====================================================
-- 5. ENHANCED VIDEO METADATA
-- =====================================================

-- Add admin-only fields to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Create indexes for admin filters
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_last_edited ON videos(last_edited_at DESC);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_videos', (SELECT COUNT(*) FROM videos),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_views', (SELECT SUM(view_count) FROM videos),
    'total_likes', (SELECT SUM(like_count) FROM videos),
    'total_favorites', (SELECT COUNT(*) FROM favorites),
    'total_authors', (SELECT COUNT(*) FROM authors),
    'total_categories', (SELECT COUNT(*) FROM categories),
    'total_tags', (SELECT COUNT(*) FROM tags),
    'total_actors', (SELECT COUNT(*) FROM actors),
    'videos_today', (
      SELECT COUNT(*) FROM videos
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'users_today', (
      SELECT COUNT(*) FROM auth.users
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'views_today', (
      SELECT COUNT(*) FROM video_views
      WHERE DATE(timestamp) = CURRENT_DATE
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate video engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(vid_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  video_rec RECORD;
  engagement_score DECIMAL;
BEGIN
  SELECT
    v.view_count,
    v.like_count,
    v.created_at,
    COUNT(DISTINCT f.user_id) as favorite_count
  INTO video_rec
  FROM videos v
  LEFT JOIN favorites f ON f.video_id = v.id
  WHERE v.id = vid_id
  GROUP BY v.id, v.view_count, v.like_count, v.created_at;

  -- Calculate score based on engagement metrics
  -- Formula: (likes * 10 + favorites * 20 + views) / days_old
  engagement_score := (
    (COALESCE(video_rec.like_count, 0) * 10) +
    (COALESCE(video_rec.favorite_count, 0) * 20) +
    (COALESCE(video_rec.view_count, 0))
  ) / GREATEST(EXTRACT(DAY FROM NOW() - video_rec.created_at), 1);

  RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing videos
CREATE OR REPLACE FUNCTION get_top_performing_videos(
  time_period TEXT DEFAULT 'week', -- 'today', 'week', 'month', 'all'
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  video_id UUID,
  title TEXT,
  views BIGINT,
  likes INTEGER,
  engagement_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.title,
    CASE
      WHEN time_period = 'today' THEN COALESCE(vp.views_today, 0)::BIGINT
      WHEN time_period = 'week' THEN COALESCE(vp.views_this_week, 0)::BIGINT
      WHEN time_period = 'month' THEN COALESCE(vp.views_this_month, 0)::BIGINT
      ELSE v.view_count::BIGINT
    END as view_count,
    v.like_count,
    COALESCE(vp.engagement_score, 0) as score
  FROM videos v
  LEFT JOIN video_performance vp ON vp.video_id = v.id
  ORDER BY score DESC, view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update video performance metrics
CREATE OR REPLACE FUNCTION update_video_performance()
RETURNS VOID AS $$
BEGIN
  -- Update today's views
  UPDATE video_performance vp
  SET views_today = COALESCE(
    (SELECT COUNT(*) FROM video_views vv
     WHERE vv.video_id = vp.video_id
     AND DATE(vv.timestamp) = CURRENT_DATE), 0
  );

  -- Update this week's views
  UPDATE video_performance vp
  SET views_this_week = COALESCE(
    (SELECT COUNT(*) FROM video_views vv
     WHERE vv.video_id = vp.video_id
     AND vv.timestamp >= CURRENT_DATE - INTERVAL '7 days'), 0
  );

  -- Update this month's views
  UPDATE video_performance vp
  SET views_this_month = COALESCE(
    (SELECT COUNT(*) FROM video_views vv
     WHERE vv.video_id = vp.video_id
     AND vv.timestamp >= CURRENT_DATE - INTERVAL '30 days'), 0
  );

  -- Update engagement scores
  UPDATE video_performance vp
  SET engagement_score = calculate_engagement_score(vp.video_id),
      last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to create video_performance entry when video is created
CREATE OR REPLACE FUNCTION create_video_performance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO video_performance (video_id)
  VALUES (NEW.id)
  ON CONFLICT (video_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_video_performance
AFTER INSERT ON videos
FOR EACH ROW
EXECUTE FUNCTION create_video_performance();

-- Trigger to update last_edited timestamp when video is updated
CREATE OR REPLACE FUNCTION update_video_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_edited
BEFORE UPDATE ON videos
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION update_video_edited_timestamp();

-- Trigger to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called from application code with proper context
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

-- User roles: Only admins can view/modify
CREATE POLICY "Admin can view all user roles"
  ON user_roles FOR SELECT
  USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can insert user roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY "Admin can update user roles"
  ON user_roles FOR UPDATE
  USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can delete user roles"
  ON user_roles FOR DELETE
  USING (is_user_admin(auth.uid()));

-- Admin logs: Only admins can view
CREATE POLICY "Admin can view activity logs"
  ON admin_activity_logs FOR SELECT
  USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (is_user_admin(auth.uid()));

-- Analytics: Only admins can view
CREATE POLICY "Admin can view analytics"
  ON daily_analytics FOR SELECT
  USING (is_user_admin(auth.uid()));

CREATE POLICY "Admin can manage analytics"
  ON daily_analytics FOR ALL
  USING (is_user_admin(auth.uid()));

-- Video performance: Public read, admin write
CREATE POLICY "Anyone can view video performance"
  ON video_performance FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin can manage video performance"
  ON video_performance FOR ALL
  USING (is_user_admin(auth.uid()));

-- Flagged content: Users can flag, admins can manage
CREATE POLICY "Users can view own flags"
  ON flagged_content FOR SELECT
  USING (flagged_by_user_id = auth.uid() OR is_user_admin(auth.uid()));

CREATE POLICY "Users can flag content"
  ON flagged_content FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage flagged content"
  ON flagged_content FOR ALL
  USING (is_user_admin(auth.uid()));

-- =====================================================
-- 9. SEED DATA
-- =====================================================

-- Create initial admin role (replace with actual user UUID after first user signs up)
-- NOTE: Run this manually with actual user UUID from auth.users table
-- INSERT INTO user_roles (user_id, role, created_by)
-- VALUES ('YOUR_USER_UUID_HERE', 'admin', 'YOUR_USER_UUID_HERE');

-- Create initial video performance entries for existing videos
INSERT INTO video_performance (video_id)
SELECT id FROM videos
ON CONFLICT (video_id) DO NOTHING;

-- =====================================================
-- 10. GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON TABLE user_roles IS 'Phase 3: User role management for admin CMS';
COMMENT ON TABLE admin_activity_logs IS 'Phase 3: Audit trail for admin actions';
COMMENT ON TABLE daily_analytics IS 'Phase 3: Daily platform analytics';
COMMENT ON TABLE video_performance IS 'Phase 3: Real-time video performance metrics';
COMMENT ON TABLE flagged_content IS 'Phase 3: Content moderation system';
