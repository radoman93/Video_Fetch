'use client';

import { useEffect, useRef, useState } from 'react';
import { generateAdId } from './useExoClick';

interface ExoClickVideoAdProps {
  zoneId?: string;
  accountId?: string;
  type?: 'preroll' | 'midroll';
  onAdComplete?: () => void;
  onAdSkipped?: () => void;
  onAdError?: () => void;
  autoPlay?: boolean;
}

/**
 * ExoClick Video Ad Component (Pre-roll/Mid-roll)
 *
 * Displays video ads before or during content playback
 * Highest revenue format - $5-15 CPM for adult content
 *
 * @param type - 'preroll' (before video) or 'midroll' (during video)
 * @param onAdComplete - Callback when ad finishes playing
 * @param onAdSkipped - Callback when user skips ad
 * @param onAdError - Callback when ad fails to load
 * @param autoPlay - Auto-play ad when loaded (default: true)
 */
export function ExoClickVideoAd({
  zoneId,
  accountId = process.env.NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID,
  type = 'preroll',
  onAdComplete,
  onAdSkipped,
  onAdError,
  autoPlay = true,
}: ExoClickVideoAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  const adId = useRef(generateAdId('exo-video')).current;

  // Get zone ID based on type
  const effectiveZoneId =
    zoneId ||
    (type === 'preroll'
      ? process.env.NEXT_PUBLIC_EXOCLICK_VIDEO_PREROLL
      : process.env.NEXT_PUBLIC_EXOCLICK_VIDEO_MIDROLL);

  useEffect(() => {
    if (!effectiveZoneId) {
      console.warn('ExoClick Video Ad: Missing zone ID');
      onAdError?.();
      return;
    }

    const loadVideoAd = () => {
      try {
        // Create container for video ad
        const container = document.getElementById(adId);
        if (!container) return;

        // Inject ExoClick video ad script
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.type = 'text/javascript';

        // ExoClick Instream Video Ad initialization
        const instreamCode = `
          (function() {
            var exoInstream = {
              zoneId: ${effectiveZoneId},
              accountId: '${accountId || ''}',
              containerId: '${adId}',
              playerOptions: {
                width: '100%',
                height: '100%',
                autoplay: ${autoPlay},
                muted: false,
                skipDelay: 5,
                showSkipButton: true
              }
            };

            // Load ExoClick instream player
            var s = document.createElement('script');
            s.src = '//a.magsrv.com/videojs/instream.js';
            s.async = true;
            s.onload = function() {
              if (window.ExoInstreamPlayer) {
                window.ExoInstreamPlayer.init(exoInstream);
              }
            };
            s.onerror = function() {
              console.error('ExoClick Video Ad failed to load');
            };
            document.head.appendChild(s);
          })();
        `;

        script.innerHTML = instreamCode;
        container.appendChild(script);

        setIsLoading(false);
        setIsPlaying(autoPlay);

        // Simulate skip countdown
        if (autoPlay) {
          const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                setCanSkip(true);
                clearInterval(countdownInterval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(countdownInterval);
        }
      } catch (error) {
        console.error('Error loading ExoClick video ad:', error);
        setIsLoading(false);
        onAdError?.();
      }
    };

    const timeout = setTimeout(loadVideoAd, 100);
    return () => clearTimeout(timeout);
  }, [effectiveZoneId, accountId, adId, autoPlay, onAdError]);

  // Handle skip button click
  const handleSkip = () => {
    if (canSkip) {
      setIsPlaying(false);
      onAdSkipped?.();
    }
  };

  // Listen for ad completion events
  useEffect(() => {
    const handleAdEnd = () => {
      setIsPlaying(false);
      onAdComplete?.();
    };

    window.addEventListener('exo-ad-complete', handleAdEnd);
    return () => window.removeEventListener('exo-ad-complete', handleAdEnd);
  }, [onAdComplete]);

  if (!effectiveZoneId) {
    return null;
  }

  return (
    <div
      ref={adContainerRef}
      className="exoclick-video-ad relative w-full aspect-video bg-black rounded-lg overflow-hidden"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-sm">Loading video ad...</div>
        </div>
      )}

      {/* Video Ad Container */}
      <div
        id={adId}
        className="w-full h-full"
        style={{ position: 'relative' }}
      />

      {/* Skip Button Overlay */}
      {isPlaying && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleSkip}
            disabled={!canSkip}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              canSkip
                ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canSkip ? 'Skip Ad' : `Skip in ${countdown}s`}
          </button>
        </div>
      )}

      {/* Ad Label */}
      <div className="absolute bottom-4 left-4 text-xs bg-black/70 text-gray-300 px-3 py-1 rounded z-40">
        {type === 'preroll' ? 'Video Ad' : 'Advertisement'}
      </div>
    </div>
  );
}

/**
 * Hook to track video ad completion
 * Useful for preventing main video playback until ad completes
 */
export function useVideoAdCompleted(): [boolean, () => void] {
  const [completed, setCompleted] = useState(false);

  const markCompleted = () => {
    setCompleted(true);
  };

  return [completed, markCompleted];
}
