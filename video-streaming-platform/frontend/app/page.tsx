'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { Pagination } from '@/components/Pagination';

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'home', page],
    queryFn: () => api.videos.getAll({ page, page_size: 20, sort_by: 'created_at' }),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['videos', 'trending'],
    queryFn: () => api.videos.getTrending(7, 12),
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
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
            <h1 className="text-4xl font-bold mb-2">Welcome to VideoHub</h1>
            <p className="text-gray-400 text-lg">
              Discover amazing videos from talented creators
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-gray-400">Loading...</div>
          </div>
        </main>
      }>
        <HomePageContent />
      </Suspense>
    </>
  );
}
