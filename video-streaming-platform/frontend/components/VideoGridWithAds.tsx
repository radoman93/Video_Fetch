import { Video } from '@/lib/api';
import { VideoCard } from './VideoCard';
import { ExoClickNative } from './ads';

interface VideoGridWithAdsProps {
  videos: Video[];
  loading?: boolean;
  adFrequency?: number; // Show ad every N videos (default: 6)
  enableAds?: boolean;
}

/**
 * Enhanced VideoGrid component that injects native ads between video cards
 * Ads are positioned at intervals (every N videos) for maximum visibility
 */
export function VideoGridWithAds({
  videos,
  loading,
  adFrequency = 6,
  enableAds = true,
}: VideoGridWithAdsProps) {
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

  // Check if ads should be enabled via env var
  const adsEnabled =
    enableAds &&
    process.env.NEXT_PUBLIC_ADS_ENABLED !== 'false' &&
    process.env.NEXT_PUBLIC_NATIVE_ADS_ENABLED !== 'false';

  // Build grid with videos and ads
  const gridItems: JSX.Element[] = [];

  videos.forEach((video, index) => {
    // Add video card
    gridItems.push(<VideoCard key={`video-${video.id}`} video={video} />);

    // Inject native ad after every N videos
    if (adsEnabled && (index + 1) % adFrequency === 0 && index < videos.length - 1) {
      gridItems.push(
        <div key={`ad-${index}`} className="w-full">
          <ExoClickNative />
        </div>
      );
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {gridItems}
    </div>
  );
}
