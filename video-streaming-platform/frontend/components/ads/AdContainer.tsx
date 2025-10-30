'use client';

import { ReactNode } from 'react';

interface AdContainerProps {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
  minHeight?: string;
  showLabel?: boolean;
}

/**
 * Wrapper component for ad placements with loading and error states
 * Provides consistent styling and user feedback
 */
export function AdContainer({
  children,
  className = '',
  isLoading = false,
  isError = false,
  minHeight = '90px',
  showLabel = true,
}: AdContainerProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center ${className}`}
      style={{ minHeight }}
    >
      {/* Advertisement Label */}
      {showLabel && !isError && (
        <div className="absolute top-0 left-0 text-xs text-gray-500 px-2 py-1 bg-gray-900/50 rounded-br">
          Advertisement
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-pulse text-gray-600 text-sm">
            Loading ad...
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-center w-full h-full bg-gray-900/30 border border-gray-800 rounded">
          <div className="text-gray-600 text-xs text-center px-4">
            Ad failed to load
          </div>
        </div>
      )}

      {/* Ad Content */}
      {!isLoading && !isError && (
        <div className="w-full h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Spacer component to add visual separation around ads
 */
export function AdSpacer({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const spacing = {
    sm: 'my-4',
    md: 'my-6',
    lg: 'my-8',
  };

  return <div className={spacing[size]} />;
}
