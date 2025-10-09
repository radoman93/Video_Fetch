'use client';

import Link from 'next/link';
import { Video } from '@/lib/api';
import { formatViewCount, formatRelativeTime } from '@/lib/utils';
import { LikeButton } from './LikeButton';
import { FavoriteButton } from './FavoriteButton';

interface VideoInfoProps {
  video: Video;
}

export function VideoInfo({ video }: VideoInfoProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-3xl font-bold">{video.title}</h1>

      {/* Stats and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 text-gray-400">
          <span>{formatViewCount(video.view_count)} views</span>
          {video.uploaded_at && (
            <>
              <span>•</span>
              <span>{formatRelativeTime(video.uploaded_at)}</span>
            </>
          )}
          {video.quality && (
            <>
              <span>•</span>
              <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded">
                {video.quality}
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <LikeButton videoId={video.id} initialLikeCount={video.like_count} />
          <FavoriteButton videoId={video.id} />
        </div>
      </div>

      {/* Author */}
      {video.author && (
        <Link
          href={`/authors/${video.author.slug}`}
          className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors w-fit"
        >
          {video.author.avatar_url && (
            <img
              src={video.author.avatar_url}
              alt={video.author.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <div className="font-semibold">{video.author.name}</div>
            <div className="text-sm text-gray-400">
              {video.author.video_count} videos
            </div>
          </div>
        </Link>
      )}

      {/* Description */}
      {video.description && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
        </div>
      )}

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Categories */}
      {video.categories && video.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-400 text-sm">Categories:</span>
          {video.categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="text-sm text-pink-500 hover:text-pink-400 transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {/* Actors */}
      {video.actors && video.actors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-400 text-sm">Featuring:</span>
          {video.actors.map((actor) => (
            <span key={actor.id} className="text-sm text-gray-300">
              {actor.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
