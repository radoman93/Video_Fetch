'use client';

import { useEffect, useRef, useState } from 'react';
import { generateAdId } from './useExoClick';

interface ExoClickNativeProps {
  zoneId?: string;
  accountId?: string;
  className?: string;
  lazyLoad?: boolean;
}

/**
 * ExoClick Native Ad Component
 *
 * Displays native ads that blend with your content (video thumbnails)
 * Styled to match the surrounding video cards for better CTR
 */
export function ExoClickNative({
  zoneId = process.env.NEXT_PUBLIC_EXOCLICK_NATIVE,
  accountId = process.env.NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID,
  className = '',
  lazyLoad = true,
}: ExoClickNativeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const adId = useRef(generateAdId('exo-native')).current;

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  // Load native ad when visible
  useEffect(() => {
    if (!isVisible || !zoneId) return;

    const loadNative = () => {
      try {
        // Create script for native ad
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.type = 'text/javascript';
        script.src = `//a.magsrv.com/${zoneId}/invoke.js`;

        const adContainer = document.getElementById(adId);
        if (adContainer) {
          adContainer.appendChild(script);

          const timeout = setTimeout(() => {
            if (!isLoaded) {
              setIsError(true);
            }
          }, 5000);

          script.onload = () => {
            setIsLoaded(true);
            clearTimeout(timeout);
          };

          script.onerror = () => {
            setIsError(true);
            clearTimeout(timeout);
            console.error('ExoClick Native ad failed to load');
          };

          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error loading ExoClick native ad:', error);
        setIsError(true);
      }
    };

    const timeout = setTimeout(loadNative, 100);
    return () => clearTimeout(timeout);
  }, [isVisible, zoneId, adId, isLoaded]);

  if (!zoneId) {
    console.warn('ExoClick Native: Missing zone ID');
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`exoclick-native-wrapper ${className}`}
    >
      {/* Native ad container styled to match video cards */}
      <div className="relative group">
        {/* Loading skeleton matching VideoCard style */}
        {isVisible && !isLoaded && !isError && (
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-800 rounded-lg mb-2" />
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="aspect-video bg-gray-900/30 border border-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-600">Sponsored content unavailable</span>
          </div>
        )}

        {/* Native ad content */}
        {!isError && (
          <>
            <div
              id={adId}
              className="exoclick-native-ad"
              style={{
                minHeight: '200px',
              }}
            />
            {/* Subtle sponsored label */}
            <div className="absolute top-2 right-2 text-xs bg-black/70 text-gray-400 px-2 py-1 rounded z-10">
              Sponsored
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Helper component to inject native ads into a video grid
 * Usage: Use this in place of video cards at specific intervals
 */
interface NativeAdPlaceholderProps {
  position: number; // Position in the grid
  frequency?: number; // Show ad every N items (default: 6)
  zoneId?: string;
}

export function NativeAdPlaceholder({
  position,
  frequency = 6,
  zoneId,
}: NativeAdPlaceholderProps) {
  // Only render if position matches frequency (e.g., every 6th item)
  if (position % frequency !== 0) {
    return null;
  }

  return <ExoClickNative zoneId={zoneId} className="w-full" />;
}
