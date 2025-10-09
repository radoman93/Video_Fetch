import Link from 'next/link';
import Image from 'next/image';
import { Video } from '@/lib/api';
import { formatDuration, formatViewCount, formatRelativeTime } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  compact?: boolean;
}

export function VideoCard({ video, compact = false }: VideoCardProps) {
  if (compact) {
    return (
      <Link href={`/videos/${video.id}`} className="group flex gap-3">
        {/* Compact Thumbnail */}
        <div className="relative w-40 aspect-video bg-dark-100 rounded-lg overflow-hidden flex-shrink-0">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {video.duration && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 px-1.5 py-0.5 rounded text-xs font-semibold">
              {formatDuration(video.duration)}
            </div>
          )}
          {video.quality && (
            <div className="absolute top-1 left-1 bg-pink-600 px-1.5 py-0.5 rounded text-xs font-semibold">
              {video.quality.toUpperCase()}
            </div>
          )}
        </div>

        {/* Compact Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {video.title}
          </h3>
          {video.author && (
            <div className="text-xs text-gray-400 mb-1">{video.author.name}</div>
          )}
          <div className="text-xs text-gray-500">
            {formatViewCount(video.view_count)} views
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/videos/${video.id}`} className="group">
      <div className="card">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-dark-100">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded text-xs font-semibold">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Quality Badge */}
          {video.quality && (
            <div className="absolute top-2 left-2 badge badge-hd">
              {video.quality.toUpperCase()}
            </div>
          )}

          {/* Featured Badge */}
          {video.is_featured && (
            <div className="absolute top-2 right-2 badge badge-featured">
              FEATURED
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          {video.author && (
            <Link
              href={`/authors/${video.author.slug}`}
              className="text-sm text-gray-400 hover:text-primary transition-colors block mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {video.author.name}
            </Link>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{formatViewCount(video.view_count)} views</span>
            <span>•</span>
            <span>{formatRelativeTime(video.uploaded_at || video.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
