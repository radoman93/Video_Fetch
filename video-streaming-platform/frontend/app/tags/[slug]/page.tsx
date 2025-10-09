'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';

export default function TagPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: tag, isLoading: tagLoading } = useQuery({
    queryKey: ['tag', slug],
    queryFn: () => api.tags.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'tag', slug],
    queryFn: () => api.videos.getAll({ tag_slug: slug, page_size: 24 }),
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

  if (tagLoading) {
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

  if (!tag) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Tag not found</h1>
            <p className="text-gray-400">
              The tag you're looking for doesn't exist.
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
          <VideoGrid videos={videos?.items || []} loading={videosLoading} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos with this tag yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
