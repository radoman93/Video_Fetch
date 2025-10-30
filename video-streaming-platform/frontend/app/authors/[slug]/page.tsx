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

function AuthorPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');

  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ['author', slug],
    queryFn: () => api.authors.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'author', slug, page],
    queryFn: () => api.videos.getAll({ author_slug: slug, page, page_size: 24 }),
    enabled: !!author,
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/authors/${slug}?${params.toString()}`);
  };

  if (authorLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="h-8 bg-gray-800 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (!author) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Author not found</h1>
          <p className="text-gray-400">
            The author you're looking for doesn't exist.
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

        {/* Author Header */}
        <div className="mb-8 flex items-start gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-600">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{author.name}</h1>
            <p className="text-gray-400 mb-4">
              {author.video_count} video{author.video_count !== 1 ? 's' : ''}
            </p>
            {author.bio && (
              <p className="text-gray-300 whitespace-pre-wrap">{author.bio}</p>
            )}
          </div>
        </div>

        {/* Videos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Videos by {author.name}</h2>
          <VideoGridWithAds videos={videos?.items || []} loading={videosLoading} adFrequency={5} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos available from this author yet.
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

export default function AuthorPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      }>
        <AuthorPageContent />
      </Suspense>
    </>
  );
}
