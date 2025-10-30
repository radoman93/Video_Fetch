'use client';

import { useRef, useState } from 'react';
import { ExoClickVideoAd, useVideoAdCompleted } from './ads';

interface VideoPlayerWithAdsProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onPlay?: () => void;
  enablePreroll?: boolean;
}

/**
 * Enhanced VideoPlayer with pre-roll ad support
 * Shows video ad before main content playback
 */
export function VideoPlayerWithAds({
  videoUrl,
  thumbnailUrl,
  onPlay,
  enablePreroll = true,
}: VideoPlayerWithAdsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [adCompleted, markAdCompleted] = useVideoAdCompleted();
  const [showAd, setShowAd] = useState(
    enablePreroll &&
    process.env.NEXT_PUBLIC_ADS_ENABLED !== 'false' &&
    process.env.NEXT_PUBLIC_VIDEO_ADS_ENABLED !== 'false'
  );

  const handleAdComplete = () => {
    markAdCompleted();
    setShowAd(false);
    // Auto-play main video after ad
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleAdSkipped = () => {
    markAdCompleted();
    setShowAd(false);
  };

  const handleAdError = () => {
    console.warn('Pre-roll ad failed, showing main video');
    markAdCompleted();
    setShowAd(false);
  };

  const handlePlay = () => {
    onPlay?.();
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Show pre-roll ad if enabled and not completed */}
      {showAd && !adCompleted ? (
        <ExoClickVideoAd
          type="preroll"
          onAdComplete={handleAdComplete}
          onAdSkipped={handleAdSkipped}
          onAdError={handleAdError}
          autoPlay={true}
        />
      ) : (
        /* Main video player */
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          controlsList="nodownload"
          poster={thumbnailUrl}
          onPlay={handlePlay}
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
