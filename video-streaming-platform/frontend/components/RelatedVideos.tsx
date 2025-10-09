'use client';

import { Video } from '@/lib/api';
import { VideoCard } from './VideoCard';

interface RelatedVideosProps {
  videos: Video[];
  loading?: boolean;
}

export function RelatedVideos({ videos, loading }: RelatedVideosProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Related Videos</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Related Videos</h2>
      <div className="space-y-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} compact />
        ))}
      </div>
    </div>
  );
}
