'use client';

import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onPlay?: () => void;
}

export function VideoPlayer({ videoUrl, thumbnailUrl, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      onPlay?.();
    };

    video.addEventListener('play', handlePlay);
    return () => video.removeEventListener('play', handlePlay);
  }, [onPlay]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={thumbnailUrl}
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
