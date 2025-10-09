'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.categories.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'category', slug],
    queryFn: () => api.videos.getAll({ category_slug: slug, page_size: 24 }),
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <p className="text-gray-400">
              The category you're looking for doesn't exist.
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
          <VideoGrid videos={videos?.items || []} loading={videosLoading} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos in this category yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
