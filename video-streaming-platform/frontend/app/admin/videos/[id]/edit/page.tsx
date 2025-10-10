'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminVideosAPI, AdminVideo } from '@/lib/admin-api';
import { TagSelector } from '@/components/admin/TagSelector';
import { AuthorSelector } from '@/components/admin/AuthorSelector';
import { VideoFramePicker } from '@/components/admin/VideoFramePicker';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditVideoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  // Video data
  const [video, setVideo] = useState<AdminVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Available options
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Load video data and options
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin');
      return;
    }

    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, videoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load video data
      const videoData = await adminVideosAPI.getVideoById(videoId);
      setVideo(videoData);

      // Set form fields
      setTitle(videoData.title);
      setDescription(videoData.description || '');

      // Load all available options
      const [tags, authors, categories] = await Promise.all([
        adminVideosAPI.getAllTags(),
        adminVideosAPI.getAllAuthors(),
        adminVideosAPI.getAllCategories(),
      ]);

      setAvailableTags(tags);
      setAvailableAuthors(authors);
      setAvailableCategories(categories);

      // Set selected author
      if (videoData.authors) {
        setSelectedAuthor({
          id: videoData.authors.id,
          name: videoData.authors.name,
          slug: videoData.authors.slug,
        });
      }

      // Set selected tags (from video data if available)
      // Note: This assumes video data includes tags from the getVideoById endpoint
      // You may need to adjust based on your actual API response structure
      if ((videoData as any).video_tags) {
        const videoTags = (videoData as any).video_tags.map((vt: any) => vt.tags);
        setSelectedTags(videoTags);
      }

      // Set selected categories
      if ((videoData as any).video_categories) {
        const videoCategories = (videoData as any).video_categories.map((vc: any) => vc.categories);
        setSelectedCategories(videoCategories);
      }
    } catch (err: any) {
      console.error('Failed to load video data:', err);
      setError(err.message || 'Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!selectedAuthor) {
      setError('Author is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update video metadata
      await adminVideosAPI.updateVideo(videoId, {
        title,
        description,
        author_id: selectedAuthor.id,
      });

      // Update tags
      const tagIds = selectedTags.map((tag) => tag.id);
      await adminVideosAPI.updateVideoTags(videoId, tagIds);

      // Update categories
      const categoryIds = selectedCategories.map((cat) => cat.id);
      await adminVideosAPI.updateVideoCategories(videoId, categoryIds);

      setSuccess('Video updated successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/videos');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to save video:', err);
      setError(err.message || 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/videos');
  };

  const handleThumbnailUpdate = (thumbnailUrl: string) => {
    if (video) {
      setVideo({ ...video, thumbnail_url: thumbnailUrl });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The video could not be loaded'}</p>
            <button
              onClick={() => router.push('/admin/videos')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Back to Videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Video</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update video metadata, tags, author, and thumbnail
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Video Info Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Video Information</h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter video title..."
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter video description..."
                />
              </div>

              {/* Author Selector */}
              <div className="mb-4">
                <AuthorSelector
                  selectedAuthor={selectedAuthor}
                  availableAuthors={availableAuthors}
                  onChange={setSelectedAuthor}
                />
              </div>

              {/* Tag Selector */}
              <div className="mb-4">
                <TagSelector
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onChange={setSelectedTags}
                />
              </div>

              {/* Category Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </label>
                <TagSelector
                  selectedTags={selectedCategories as any}
                  availableTags={availableCategories as any}
                  onChange={setSelectedCategories as any}
                />
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Thumbnail/Frame Picker */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Video Thumbnail</h2>
              <VideoFramePicker
                videoId={videoId}
                videoUrl={video.video_url}
                currentThumbnail={video.thumbnail_url}
                onThumbnailUpdate={handleThumbnailUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
