'use client';

import { useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onPlay?: () => void;
}

export function VideoPlayer({ videoUrl, thumbnailUrl, onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    onPlay?.();
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
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
    </div>
  );
}
