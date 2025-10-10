'use client';

import { useState, useRef, useEffect } from 'react';
import { adminVideosAPI } from '@/lib/admin-api';

interface VideoFramePickerProps {
  videoId: string;
  videoUrl: string;
  currentThumbnail?: string;
  onThumbnailUpdate: (thumbnailUrl: string) => void;
}

interface CapturedFrame {
  timestamp: number;
  dataUrl: string;
}

export function VideoFramePicker({
  videoId,
  videoUrl,
  currentThumbnail,
  onThumbnailUpdate,
}: VideoFramePickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<CapturedFrame | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVideoLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      setVideoError(true);
      setVideoLoading(false);
      setError('Failed to load video. The video URL may be invalid or inaccessible.');
    };

    const handleCanPlay = () => {
      setVideoLoading(false);
      setVideoError(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl]);

  const captureFrameAtCurrentTime = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturing(true);
    setError(null);

    try {
      const timestamp = video.currentTime;

      // Use server-side extraction for the current timestamp
      const result = await adminVideosAPI.extractFrames(videoId, [timestamp]);

      if (result.frames.length > 0) {
        const newFrame: CapturedFrame = {
          timestamp: result.frames[0].timestamp,
          dataUrl: result.frames[0].frame,
        };

        setCapturedFrames((prev) => [...prev, newFrame]);
        setSelectedFrame(newFrame);
      }
    } catch (err: any) {
      console.error('Error capturing frame:', err);
      setError('Failed to capture frame. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const extractFramesAtIntervals = async () => {
    if (!duration) return;

    setIsCapturing(true);
    setError(null);

    try {
      // Extract frames at 10%, 25%, 50%, 75%, and 90% of video duration
      const timestamps = [
        duration * 0.1,
        duration * 0.25,
        duration * 0.5,
        duration * 0.75,
        duration * 0.9,
      ];

      const result = await adminVideosAPI.extractFrames(videoId, timestamps);

      const newFrames: CapturedFrame[] = result.frames.map((f) => ({
        timestamp: f.timestamp,
        dataUrl: f.frame,
      }));

      setCapturedFrames(newFrames);
      if (newFrames.length > 0) {
        setSelectedFrame(newFrames[0]);
      }
    } catch (err: any) {
      console.error('Error extracting frames:', err);
      setError('Failed to extract frames from video');
    } finally {
      setIsCapturing(false);
    }
  };

  const saveThumbnail = async () => {
    if (!selectedFrame) {
      setError('Please select a frame first');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await adminVideosAPI.updateThumbnail(videoId, {
        base64: selectedFrame.dataUrl,
      });

      onThumbnailUpdate(result.thumbnail_url);
      setSuccess('Thumbnail updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving thumbnail:', err);
      setError('Failed to save thumbnail');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Video Thumbnail
      </label>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Current Thumbnail */}
      {currentThumbnail && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Thumbnail:</p>
          <img
            src={currentThumbnail}
            alt="Current thumbnail"
            className="w-48 h-auto rounded-lg border border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {/* Video Player */}
      <div className="bg-black rounded-lg overflow-hidden relative">
        {videoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-center p-4 max-w-md">
              <p className="text-red-400 text-sm mb-2">❌ Video failed to load</p>
              <p className="text-gray-400 text-xs mb-3">
                This may be due to CORS restrictions. You can still extract frames using the server-side extraction below.
              </p>
              <p className="text-gray-500 text-xs mb-3 break-all">URL: {videoUrl}</p>
              <button
                onClick={() => {
                  setVideoError(false);
                  setVideoLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full max-h-96"
          preload="metadata"
        />
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Info Note */}
      {videoError && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
          💡 <strong>Note:</strong> Even though the video preview failed to load, you can still extract frames using the buttons below. The extraction happens on the server.
        </div>
      )}

      {/* Video Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={captureFrameAtCurrentTime}
          disabled={isCapturing || videoError}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={videoError ? "Cannot capture from current time when video preview is unavailable" : "Capture frame at current playback position"}
        >
          {isCapturing ? 'Capturing...' : '📸 Capture Current Frame'}
        </button>

        <button
          type="button"
          onClick={extractFramesAtIntervals}
          disabled={isCapturing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Extract frames at 10%, 25%, 50%, 75%, and 90% of video duration"
        >
          {isCapturing ? 'Extracting...' : '🎬 Extract Multiple Frames'}
        </button>

        {selectedFrame && (
          <button
            type="button"
            onClick={saveThumbnail}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {isSaving ? 'Saving...' : '💾 Save as Thumbnail'}
          </button>
        )}
      </div>

      {/* Current Time Display */}
      {duration > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Current Position: {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}

      {/* Captured Frames Grid */}
      {capturedFrames.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Captured Frames (Select one):
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {capturedFrames.map((frame, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedFrame(frame);
                  seekTo(frame.timestamp);
                }}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  selectedFrame === frame
                    ? 'border-purple-500 ring-2 ring-purple-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }`}
              >
                <img
                  src={frame.dataUrl}
                  alt={`Frame at ${formatTime(frame.timestamp)}`}
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-2 py-1">
                  {formatTime(frame.timestamp)}
                </div>
                {selectedFrame === frame && (
                  <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
