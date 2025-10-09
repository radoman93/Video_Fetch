'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'home'],
    queryFn: () => api.videos.getAll({ page: 1, page_size: 24, sort_by: 'created_at' }),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['videos', 'trending'],
    queryFn: () => api.videos.getTrending(7, 12),
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome to VideoHub</h1>
          <p className="text-gray-400 text-lg">
            Discover amazing videos from talented creators
          </p>
        </div>

        {/* Trending Videos */}
        {trendingData && trendingData.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
            <VideoGrid videos={trendingData} />
          </section>
        )}

        {/* Latest Videos */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Videos</h2>
          <VideoGrid videos={data?.items || []} loading={isLoading} />

          {/* Pagination Info */}
          {data && (
            <div className="mt-8 text-center text-gray-400">
              Showing {data.items.length} of {data.total} videos
            </div>
          )}
        </section>
      </main>
    </>
  );
}
