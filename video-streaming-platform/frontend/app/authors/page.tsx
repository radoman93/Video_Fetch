'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

export default function AuthorsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort_by') || 'video_count';
  const sortOrder = searchParams.get('sort_order') || 'desc';

  const { data, isLoading } = useQuery({
    queryKey: ['authors', page, sortBy, sortOrder],
    queryFn: () =>
      api.authors.getAll({
        page,
        page_size: 24,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/authors?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/authors?${params.toString()}`);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Content Creators</h1>
          <p className="text-gray-400">
            Browse all authors and content creators
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={sortBy}
            onChange={(e) => updateParams('sort_by', e.target.value)}
            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="video_count">Most Videos</option>
            <option value="name">Name</option>
            <option value="created_at">Newest</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => updateParams('sort_order', e.target.value)}
            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Results Count */}
        {data && (
          <div className="mb-4 text-gray-400">
            Showing {data.items.length} of {data.total} authors
          </div>
        )}

        {/* Authors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 animate-pulse rounded-lg h-48"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {data?.items.map((author) => (
              <Link
                key={author.id}
                href={`/authors/${author.slug}`}
                className="group card hover:scale-105 transition-transform"
              >
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
                  {author.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-1">
                  {author.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {author.video_count} video{author.video_count !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!data.has_prev}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>

            <span className="px-4 py-2">
              Page {page} of {data.total_pages}
            </span>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!data.has_next}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </>
  );
}
