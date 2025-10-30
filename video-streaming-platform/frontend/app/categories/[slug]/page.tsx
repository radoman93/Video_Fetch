'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoGridWithAds } from '@/components/VideoGridWithAds';
import { Pagination } from '@/components/Pagination';
import {
  ExoClickPopunder,
  ResponsiveBanner,
  AdSpacer,
} from '@/components/ads';

function CategoryPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.categories.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'category', slug, page],
    queryFn: () => api.videos.getAll({ category_slug: slug, page, page_size: 24 }),
    enabled: !!category,
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/categories/${slug}?${params.toString()}`);
  };

  if (categoryLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-800 rounded-lg" />
          <div className="h-8 bg-gray-800 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <p className="text-gray-400">
            The category you're looking for doesn't exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
        {/* Popunder Ad - Triggers on page entry */}
        <ExoClickPopunder trigger="immediate" />

        {/* Top Banner Ad (728x90 Leaderboard) */}
        <ResponsiveBanner className="mb-6" />
        <AdSpacer size="md" />

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
          <p className="text-gray-400 mb-2">
            {category.video_count} video{category.video_count !== 1 ? 's' : ''}
          </p>
          {category.description && (
            <p className="text-gray-300">{category.description}</p>
          )}
        </div>

        {/* Videos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Videos in {category.name}</h2>
          <VideoGridWithAds videos={videos?.items || []} loading={videosLoading} adFrequency={5} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos in this category yet.
              </p>
            </div>
          )}

          {/* Pagination */}
          {videos && videos.total > 0 && (
            <>
              <div className="mt-6 text-center text-gray-400">
                Showing {videos.items.length} of {videos.total} videos
              </div>
              <Pagination
                currentPage={page}
                totalPages={videos.total_pages}
                hasNext={videos.has_next}
                hasPrev={videos.has_prev}
                onPageChange={goToPage}
              />
            </>
          )}
        </div>

        {/* Bottom Banner Ad (728x90 Leaderboard) */}
        <AdSpacer size="lg" />
        <ResponsiveBanner className="mt-8" />
    </main>
  );
}

export default function CategoryPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      }>
        <CategoryPageContent />
      </Suspense>
    </>
  );
}
