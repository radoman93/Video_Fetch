import { Video } from '@/lib/api';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  loading?: boolean;
}

export function VideoGrid({ videos, loading }: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-video bg-dark-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-dark-100 rounded w-3/4" />
              <div className="h-3 bg-dark-100 rounded w-1/2" />
              <div className="h-3 bg-dark-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No videos found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
