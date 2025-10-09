'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface FavoriteButtonProps {
  videoId: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function FavoriteButton({ videoId, compact = false, showLabel = true }: FavoriteButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Fetch favorite status
  const { data: favoriteStatus } = useQuery({
    queryKey: ['favorite-status', videoId],
    queryFn: () => api.favorites.getFavoriteStatus(videoId),
    enabled: !!user,
  });

  const isFavorited = favoriteStatus?.is_favorited || false;

  // Add to favorites mutation
  const addMutation = useMutation({
    mutationFn: () => api.favorites.addFavorite(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-status', videoId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      console.error('Failed to add favorite:', error);
    },
  });

  // Remove from favorites mutation
  const removeMutation = useMutation({
    mutationFn: () => api.favorites.removeFavorite(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-status', videoId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      console.error('Failed to remove favorite:', error);
    },
  });

  const handleClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      setTimeout(() => setShowAuthPrompt(false), 3000);
      return;
    }

    if (isFavorited) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const loading = addMutation.isPending || removeMutation.isPending;

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-lg transition-all ${
          isFavorited
            ? 'bg-pink-600 text-white scale-110'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className="w-5 h-5"
          fill={isFavorited ? 'currentColor' : 'none'}
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
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          isFavorited
            ? 'bg-pink-600 hover:bg-pink-700 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg
          className={`w-6 h-6 transition-transform ${isFavorited ? 'scale-110' : ''}`}
          fill={isFavorited ? 'currentColor' : 'none'}
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
        {showLabel && <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>}
      </button>

      {/* Auth prompt */}
      {showAuthPrompt && (
        <div className="absolute top-full mt-2 left-0 bg-gray-900 border border-pink-500 rounded-lg p-3 shadow-lg z-10 whitespace-nowrap">
          <p className="text-sm">Sign in to save favorites</p>
        </div>
      )}
    </div>
  );
}
