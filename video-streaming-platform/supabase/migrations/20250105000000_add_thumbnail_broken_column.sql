-- Add thumbnail_broken column to videos table
-- This tracks whether the thumbnail URL returns a 404 or fails to load

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS thumbnail_broken BOOLEAN DEFAULT FALSE;

-- Add index for filtering broken thumbnails
CREATE INDEX IF NOT EXISTS idx_videos_thumbnail_broken ON videos(thumbnail_broken);

-- Add comment
COMMENT ON COLUMN videos.thumbnail_broken IS 'Tracks whether the thumbnail URL returns 404 or fails to load';
