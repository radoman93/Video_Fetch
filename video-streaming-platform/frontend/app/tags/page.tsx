'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

export default function TagsPage() {
  const searchParams = useSearchParams();
  const trending = searchParams.get('trending') === 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['tags', trending],
    queryFn: () => api.tags.getAll({ page_size: 100, trending }),
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tags</h1>
          <p className="text-gray-400">
            Discover videos by tags
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/tags"
            className={`px-4 py-2 rounded-lg transition-colors ${
              !trending
                ? 'bg-pink-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            All Tags
          </Link>
          <Link
            href="/tags?trending=true"
            className={`px-4 py-2 rounded-lg transition-colors ${
              trending
                ? 'bg-pink-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Trending
          </Link>
        </div>

        {/* Tags Cloud */}
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 animate-pulse rounded-full h-8 w-20"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data?.items.map((tag) => {
              const fontSize = Math.min(
                Math.max(0.875, tag.video_count / 10),
                1.5
              );
              return (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                  style={{ fontSize: `${fontSize}rem` }}
                >
                  #{tag.name}
                  <span className="text-xs text-gray-400 ml-2">
                    ({tag.video_count})
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && data && data.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No tags available yet.</p>
          </div>
        )}
      </main>
    </>
  );
}
