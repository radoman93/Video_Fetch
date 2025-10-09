'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';

export default function AuthorPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ['author', slug],
    queryFn: () => api.authors.getBySlug(slug),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', 'author', slug],
    queryFn: () => api.videos.getAll({ author_slug: slug, page_size: 24 }),
    enabled: !!author,
  });

  if (authorLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Author not found</h1>
            <p className="text-gray-400">
              The author you're looking for doesn't exist.
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
          <VideoGrid videos={videos?.items || []} loading={videosLoading} />

          {!videosLoading && videos && videos.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No videos available from this author yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
