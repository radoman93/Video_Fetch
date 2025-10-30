'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, page],
    queryFn: () => api.search.videos(query, page, 24),
    enabled: query.length > 0,
  });

  const { data: globalResults } = useQuery({
    queryKey: ['search', 'global', query],
    queryFn: () => api.search.global(query),
    enabled: query.length > 0,
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  if (!query) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Search for videos</h1>
            <p className="text-gray-400">
              Use the search bar above to find videos, authors, categories, and tags
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
        {/* Popunder Ad - Triggers on page entry */}
        <ExoClickPopunder trigger="immediate" />

        {/* Top Banner Ad (728x90 Leaderboard) */}
        <ResponsiveBanner className="mb-6" />
        <AdSpacer size="md" />

        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Search results for "{query}"
          </h1>
          {data && (
            <p className="text-gray-400">
              Found {data.total} video{data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Quick Links (Authors, Categories, Tags) */}
        {globalResults && (
          <div className="mb-8 space-y-4">
            {/* Authors */}
            {globalResults.authors && globalResults.authors.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Authors</h2>
                <div className="flex flex-wrap gap-2">
                  {globalResults.authors.slice(0, 5).map((author) => (
                    <Link
                      key={author.id}
                      href={`/authors/${author.slug}`}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {author.avatar_url && (
                        <img
                          src={author.avatar_url}
                          alt={author.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>{author.name}</span>
                      <span className="text-xs text-gray-400">
                        ({author.video_count})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {globalResults.categories && globalResults.categories.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {globalResults.categories.slice(0, 5).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {category.name}
                      <span className="text-xs text-gray-400 ml-2">
                        ({category.video_count})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {globalResults.tags && globalResults.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {globalResults.tags.slice(0, 10).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
                    >
                      #{tag.name}
                      <span className="text-xs text-gray-400 ml-1">
                        ({tag.video_count})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Results */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Videos</h2>
          <VideoGridWithAds videos={data?.videos || []} loading={isLoading} adFrequency={5} />

          {/* No Results */}
          {!isLoading && data && data.videos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos found for "{query}". Try a different search term.
              </p>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > 0 && (
            <>
              <div className="mt-6 text-center text-gray-400">
                Showing {data.videos.length} of {data.total} videos
              </div>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / data.page_size)}
                hasNext={page < Math.ceil(data.total / data.page_size)}
                hasPrev={page > 1}
                onPageChange={goToPage}
              />
            </>
          )}
        </div>

        {/* Bottom Banner Ad (728x90 Leaderboard) */}
        <AdSpacer size="lg" />
        <ResponsiveBanner className="mt-8" />
      </main>
    </>
  );
}
