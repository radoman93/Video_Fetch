'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.favorites.getFavorites(1, 24),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-gray-400">
            Videos you've saved to watch later
          </p>
        </div>

        {/* Results Count */}
        {data && (
          <div className="mb-4 text-gray-400">
            {data.total} favorite{data.total !== 1 ? 's' : ''}
          </div>
        )}

        {/* Video Grid */}
        <VideoGrid videos={data?.items || []} loading={isLoading} />

        {/* Empty State */}
        {!isLoading && data && data.items.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-4">
              Start adding videos to your favorites to see them here
            </p>
          </div>
        )}
      </main>
    </>
  );
}
