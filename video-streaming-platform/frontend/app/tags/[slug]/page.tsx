'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
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

function TagPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');

  const { data: tag, isLoading: tagLoading } = useQuery({
    queryKey: ['tag', slug],
    queryFn: () => api.tags.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'tag', slug, page],
    queryFn: () => api.videos.getAll({ tag_slug: slug, page, page_size: 24 }),
    enabled: !!tag,
  });

  // Get related tags (tags that appear in same videos)
  const { data: relatedTags } = useQuery({
    queryKey: ['tags', 'related', slug],
    queryFn: async () => {
      // This would require a new backend endpoint
      // For now, just fetch all tags as a placeholder
      const result = await api.tags.getAll({ page_size: 10 });
      return result.items.filter((t) => t.slug !== slug);
    },
    enabled: !!tag,
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/tags/${slug}?${params.toString()}`);
  };

  if (tagLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-800 rounded-lg" />
          <div className="h-8 bg-gray-800 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (!tag) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Tag not found</h1>
          <p className="text-gray-400">
            The tag you're looking for doesn't exist.
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

        {/* Tag Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">#{tag.name}</h1>
          <p className="text-gray-400 mb-4">
            {tag.video_count} video{tag.video_count !== 1 ? 's' : ''}
          </p>

          {/* Related Tags */}
          {relatedTags && relatedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Related tags:</span>
              {relatedTags.slice(0, 10).map((relatedTag) => (
                <Link
                  key={relatedTag.id}
                  href={`/tags/${relatedTag.slug}`}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
                >
                  #{relatedTag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Videos tagged with #{tag.name}
          </h2>
          <VideoGridWithAds videos={videos?.items || []} loading={videosLoading} adFrequency={5} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos with this tag yet.
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

export default function TagPage() {
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
        <TagPageContent />
      </Suspense>
    </>
  );
}
