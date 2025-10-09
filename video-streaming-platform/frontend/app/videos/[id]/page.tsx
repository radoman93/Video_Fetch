'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoInfo } from '@/components/VideoInfo';
import { RelatedVideos } from '@/components/RelatedVideos';
import { useEffect, useState } from 'react';

export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Fetch video data
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => api.videos.getById(videoId),
  });

  // Fetch related videos
  const { data: relatedVideos, isLoading: relatedLoading } = useQuery({
    queryKey: ['related', videoId],
    queryFn: () => api.videos.getRelated(videoId, 12),
    enabled: !!video,
  });

  // Track view mutation
  const trackViewMutation = useMutation({
    mutationFn: () => api.videos.trackView(videoId),
  });

  // Track view on video play
  const handlePlay = () => {
    if (!hasTrackedView) {
      trackViewMutation.mutate();
      setHasTrackedView(true);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Video not found</h1>
            <p className="text-gray-400">
              The video you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer
              videoUrl={video.video_url}
              thumbnailUrl={video.thumbnail_url}
              onPlay={handlePlay}
            />

            {/* Video Info */}
            <VideoInfo video={video} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <RelatedVideos
              videos={relatedVideos || []}
              loading={relatedLoading}
            />
          </div>
        </div>
      </main>
    </>
  );
}
