-- =====================================================
-- Add increment_view_count function
-- =====================================================
-- Migration to add missing RPC function for atomic view count updates
-- Date: 2025-01-04
-- =====================================================

-- Function to atomically increment view count
-- Note: Parameter renamed to p_video_id to avoid ambiguous column reference
CREATE OR REPLACE FUNCTION increment_view_count(p_video_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE videos
    SET view_count = view_count + 1
    WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated, anon;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION increment_view_count IS 'Atomically increments view count for a video';
