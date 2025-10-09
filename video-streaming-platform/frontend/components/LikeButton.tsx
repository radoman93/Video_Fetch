'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface LikeButtonProps {
  videoId: string;
  initialLikeCount?: number;
  compact?: boolean;
}

export function LikeButton({ videoId, initialLikeCount = 0, compact = false }: LikeButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Fetch like status
  const { data: likeStatus } = useQuery({
    queryKey: ['like-status', videoId],
    queryFn: () => api.likes.getLikeStatus(videoId),
    enabled: !!user,
  });

  const isLiked = likeStatus?.is_liked || false;

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => api.likes.likeVideo(videoId),
    onSuccess: () => {
      setLikeCount((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['like-status', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    },
    onError: (error) => {
      console.error('Failed to like video:', error);
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: () => api.likes.unlikeVideo(videoId),
    onSuccess: () => {
      setLikeCount((prev) => Math.max(0, prev - 1));
      queryClient.invalidateQueries({ queryKey: ['like-status', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    },
    onError: (error) => {
      console.error('Failed to unlike video:', error);
    },
  });

  const handleClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      setTimeout(() => setShowAuthPrompt(false), 3000);
      return;
    }

    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const loading = likeMutation.isPending || unlikeMutation.isPending;

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
          isLiked
            ? 'bg-pink-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <svg
          className="w-4 h-4"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm">{likeCount}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          isLiked
            ? 'bg-pink-600 hover:bg-pink-700 text-white scale-105'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:scale-105'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg
          className={`w-6 h-6 transition-transform ${isLiked ? 'scale-110' : ''}`}
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{isLiked ? 'Liked' : 'Like'}</span>
        <span className="px-2 py-1 bg-black bg-opacity-30 rounded">
          {likeCount.toLocaleString()}
        </span>
      </button>

      {/* Auth prompt */}
      {showAuthPrompt && (
        <div className="absolute top-full mt-2 left-0 bg-gray-900 border border-pink-500 rounded-lg p-3 shadow-lg z-10 whitespace-nowrap">
          <p className="text-sm">Sign in to like videos</p>
        </div>
      )}
    </div>
  );
}
