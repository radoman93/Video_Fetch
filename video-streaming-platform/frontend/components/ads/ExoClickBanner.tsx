'use client';

import { useEffect, useRef, useState } from 'react';
import { AdContainer } from './AdContainer';
import { generateAdId, useIsMobile } from './useExoClick';

type BannerSize = '728x90' | '300x250' | '320x100' | '160x600' | 'responsive';

interface ExoClickBannerProps {
  size?: BannerSize;
  zoneId?: string;
  accountId?: string;
  className?: string;
  lazyLoad?: boolean; // Use Intersection Observer for lazy loading
}

/**
 * ExoClick Banner Ad Component
 *
 * Displays traditional banner ads in various sizes
 * Supports lazy loading for better performance
 *
 * Common sizes:
 * - 728x90: Leaderboard (desktop top/bottom)
 * - 300x250: Medium Rectangle (sidebar)
 * - 320x100: Mobile Banner
 * - 160x600: Wide Skyscraper (sidebar)
 */
export function ExoClickBanner({
  size = 'responsive',
  zoneId,
  accountId = process.env.NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID,
  className = '',
  lazyLoad = true,
}: ExoClickBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const adId = useRef(generateAdId('exo-banner')).current;
  const isMobile = useIsMobile();

  // Determine zone ID based on size if not provided
  const effectiveZoneId =
    zoneId ||
    (size === '728x90'
      ? process.env.NEXT_PUBLIC_EXOCLICK_BANNER_728x90
      : size === '300x250'
      ? process.env.NEXT_PUBLIC_EXOCLICK_BANNER_300x250
      : size === '320x100'
      ? process.env.NEXT_PUBLIC_EXOCLICK_BANNER_320x100
      : isMobile
      ? process.env.NEXT_PUBLIC_EXOCLICK_BANNER_320x100
      : process.env.NEXT_PUBLIC_EXOCLICK_BANNER_728x90);

  // Get dimensions based on size
  const getDimensions = () => {
    const dimensions = {
      '728x90': { width: '728px', height: '90px' },
      '300x250': { width: '300px', height: '250px' },
      '320x100': { width: '320px', height: '100px' },
      '160x600': { width: '160px', height: '600px' },
      responsive: { width: '100%', height: 'auto' },
    };
    return dimensions[size];
  };

  const dims = getDimensions();

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
      { rootMargin: '200px' } // Load when ad is 200px from viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  // Load ad when visible
  useEffect(() => {
    if (!isVisible || !effectiveZoneId) return;

    const loadBanner = () => {
      try {
        // Create script element for ExoClick banner
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.type = 'text/javascript';
        script.src = `//a.magsrv.com/${effectiveZoneId}/invoke.js`;

        // Add to ad container
        const adContainer = document.getElementById(adId);
        if (adContainer) {
          adContainer.appendChild(script);

          // Set timeout for loading
          const timeout = setTimeout(() => {
            if (!isLoaded) {
              setIsError(true);
              console.warn('ExoClick Banner load timeout');
            }
          }, 5000);

          script.onload = () => {
            setIsLoaded(true);
            clearTimeout(timeout);
          };

          script.onerror = () => {
            setIsError(true);
            clearTimeout(timeout);
            console.error('ExoClick Banner failed to load');
          };

          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error loading ExoClick banner:', error);
        setIsError(true);
      }
    };

    const timeout = setTimeout(loadBanner, 100);
    return () => clearTimeout(timeout);
  }, [isVisible, effectiveZoneId, adId, isLoaded]);

  if (!effectiveZoneId) {
    console.warn('ExoClick Banner: Missing zone ID for size:', size);
    return null;
  }

  return (
    <AdContainer
      className={`exoclick-banner ${className}`}
      isLoading={isVisible && !isLoaded && !isError}
      isError={isError}
      minHeight={size === 'responsive' ? '90px' : dims.height}
    >
      <div
        ref={containerRef}
        id={adId}
        className="flex items-center justify-center"
        style={{
          width: dims.width,
          maxWidth: '100%',
          minHeight: size === 'responsive' ? '90px' : dims.height,
        }}
      />
    </AdContainer>
  );
}

/**
 * Pre-configured banner components for common placements
 */
export function LeaderboardBanner(props: Omit<ExoClickBannerProps, 'size'>) {
  return <ExoClickBanner {...props} size="728x90" />;
}

export function RectangleBanner(props: Omit<ExoClickBannerProps, 'size'>) {
  return <ExoClickBanner {...props} size="300x250" />;
}

export function MobileBanner(props: Omit<ExoClickBannerProps, 'size'>) {
  return <ExoClickBanner {...props} size="320x100" />;
}

export function SkyscraperBanner(props: Omit<ExoClickBannerProps, 'size'>) {
  return <ExoClickBanner {...props} size="160x600" />;
}

export function ResponsiveBanner(props: Omit<ExoClickBannerProps, 'size'>) {
  const isMobile = useIsMobile();
  return (
    <ExoClickBanner
      {...props}
      size={isMobile ? '320x100' : '728x90'}
    />
  );
}
