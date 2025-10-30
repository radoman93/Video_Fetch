'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoGridWithAds } from '@/components/VideoGridWithAds';
import { Pagination } from '@/components/Pagination';
import {
  ExoClickPopunder,
  ResponsiveBanner,
  RectangleBanner,
  AdSpacer,
} from '@/components/ads';

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'home', page],
    queryFn: () => api.videos.getAll({ page, page_size: 20, sort_by: 'created_at' }),
  });


  // Calculate current 12-hour period for cache key
  const getPeriodId = () => {
    const hoursInMs = 12 * 60 * 60 * 1000;
    return Math.floor(Date.now() / hoursInMs);
  };

  // Only fetch trending videos on the first page
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['videos', 'trending-now', getPeriodId()],
    queryFn: () => api.videos.getTrendingNow(14),
    enabled: page === 1, // Only fetch when on first page
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Popunder Ad - Triggers on page entry */}
      <ExoClickPopunder trigger="immediate" />

      {/* Top Banner Ad (728x90 Leaderboard) */}
      <ResponsiveBanner className="mb-8" />
      <AdSpacer size="md" />

      {/* Hero Section */}
      <div className="mb-12 relative">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="gradient-text">Welcome to FootVault</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl">
          Your exclusive collection of <span className="text-neon-pink font-semibold">premium</span> foot fetish content
        </p>
        <div className="neon-divider"></div>
      </div>

      {/* Trending Videos - Only show on first page */}
      {page === 1 && (
        <section className="mb-12 relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">
              <span className="text-neon-cyan">Trending</span> Now
            </h2>
            <p className="text-sm text-gray-400">
              Updates every 12 hours at 00:00 & 12:00 UTC
            </p>
          </div>
          <VideoGridWithAds videos={trendingData || []} loading={trendingLoading} adFrequency={4} />
        </section>
      )}

      {/* Mid-page Banner Ad (300x250 Rectangle) - Desktop only */}
      <div className="hidden lg:flex justify-center mb-12">
        <RectangleBanner />
      </div>

      {/* Latest Videos */}
      <section>
        <h2 className="text-3xl font-bold mb-6">
          <span className="text-neon-purple">Latest</span> Videos
        </h2>
        <VideoGridWithAds videos={data?.items || []} loading={isLoading} adFrequency={6} />

        {/* Pagination */}
        {data && (
          <>
            <div className="mt-6 text-center text-gray-400">
              Showing {data.items.length} of {data.total} videos
            </div>
            <Pagination
              currentPage={page}
              totalPages={data.total_pages}
              hasNext={data.has_next}
              hasPrev={data.has_prev}
              onPageChange={goToPage}
            />
          </>
        )}
      </section>

      {/* Bottom Banner Ad (728x90 Leaderboard) */}
      <AdSpacer size="lg" />
      <ResponsiveBanner className="mt-8" />
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Welcome to FootVault</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl">
              Your exclusive collection of <span className="text-neon-pink font-semibold">premium</span> foot fetish content
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="loading-spinner"></div>
          </div>
        </main>
      }>
        <HomePageContent />
      </Suspense>
    </>
  );
}
