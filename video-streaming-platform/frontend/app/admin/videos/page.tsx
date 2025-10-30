'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminVideosAPI, AdminVideo } from '@/lib/admin-api';

export default function ManageVideos() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const initialAuthCheckRef = useRef(false);

  // State
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | ''>('');
  const [publishedFilter, setPublishedFilter] = useState<boolean | ''>('');
  const [brokenThumbnailFilter, setBrokenThumbnailFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'view_count' | 'like_count' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [checkingThumbnails, setCheckingThumbnails] = useState(false);

  // Wait for auth to be ready ONCE, then load data
  useEffect(() => {
    // Only check auth once at mount
    if (initialAuthCheckRef.current) return;

    if (authLoading) return; // Wait for auth to finish loading

    initialAuthCheckRef.current = true;

    if (!user) {
      setError('Please sign in to access the admin panel');
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        page_size: 50,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchTerm) filters.search = searchTerm;
      if (qualityFilter) filters.quality = qualityFilter;
      if (featuredFilter !== '') filters.is_featured = featuredFilter;
      if (publishedFilter !== '') filters.is_published = publishedFilter;
      if (brokenThumbnailFilter) filters.broken_thumbnail = true;

      const data = await adminVideosAPI.getVideos(filters);
      setVideos(data.videos);
      setTotalPages(data.total_pages);
      setTotalVideos(data.total);
    } catch (err: any) {
      console.error('Failed to load videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleToggleFeatured = async (videoId: string, currentValue: boolean) => {
    try {
      await adminVideosAPI.toggleFeatured(videoId, !currentValue);
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle featured: ${err.message}`);
    }
  };

  const handleTogglePublished = async (videoId: string, currentValue: boolean) => {
    try {
      await adminVideosAPI.togglePublished(videoId, !currentValue);
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle published: ${err.message}`);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await adminVideosAPI.deleteVideo(videoId);
      alert('Video deleted successfully');
      loadData();
    } catch (err: any) {
      alert(`Failed to delete video: ${err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) {
      alert('Please select videos to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedVideos.length} selected videos? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminVideosAPI.bulkDelete(selectedVideos);
      alert(`${selectedVideos.length} videos deleted successfully`);
      setSelectedVideos([]);
      loadData();
    } catch (err: any) {
      alert(`Failed to delete videos: ${err.message}`);
    }
  };

  const handleBulkToggleFeatured = async (isFeatured: boolean) => {
    if (selectedVideos.length === 0) {
      alert('Please select videos to update');
      return;
    }

    try {
      await adminVideosAPI.bulkUpdate(selectedVideos, { is_featured: isFeatured });
      alert(`${selectedVideos.length} videos updated successfully`);
      setSelectedVideos([]);
      loadData();
    } catch (err: any) {
      alert(`Failed to update videos: ${err.message}`);
    }
  };

  const handleBulkTogglePublished = async (isPublished: boolean) => {
    if (selectedVideos.length === 0) {
      alert('Please select videos to update');
      return;
    }

    try {
      await adminVideosAPI.bulkUpdate(selectedVideos, { is_published: isPublished });
      alert(`${selectedVideos.length} videos updated successfully`);
      setSelectedVideos([]);
      loadData();
    } catch (err: any) {
      alert(`Failed to update videos: ${err.message}`);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map(v => v.id));
    }
  };

  const handleCheckBrokenThumbnails = async () => {
    if (!confirm('This will check all thumbnail URLs for 404 errors. This may take a while. Continue?')) {
      return;
    }

    try {
      setCheckingThumbnails(true);
      const result = await adminVideosAPI.checkBrokenThumbnails();
      alert(`Checked ${result.checked} videos.\n${result.broken} newly marked as broken.\n${result.fixed} newly marked as fixed.`);
      loadData(); // Reload to show updated status
    } catch (err: any) {
      alert(`Failed to check thumbnails: ${err.message}`);
    } finally {
      setCheckingThumbnails(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && error.includes('sign in')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Home & Sign In
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Management</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage videos, visibility, and featured content • Change filters and click Refresh to apply
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleCheckBrokenThumbnails}
                disabled={checkingThumbnails}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingThumbnails ? '⏳ Checking...' : '🔍 Check Broken Thumbnails'}
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Actions */}
        {selectedVideos.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-purple-700 dark:text-purple-300 font-medium">
                {selectedVideos.length} video(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkToggleFeatured(true)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Feature
                </button>
                <button
                  onClick={() => handleBulkToggleFeatured(false)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Unfeature
                </button>
                <button
                  onClick={() => handleBulkTogglePublished(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkTogglePublished(false)}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                >
                  Unpublish
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality
              </label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Qualities</option>
                <option value="4K">4K</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Featured
              </label>
              <select
                value={featuredFilter === '' ? '' : featuredFilter ? 'true' : 'false'}
                onChange={(e) => setFeaturedFilter(e.target.value === '' ? '' : e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Published
              </label>
              <select
                value={publishedFilter === '' ? '' : publishedFilter ? 'true' : 'false'}
                onChange={(e) => setPublishedFilter(e.target.value === '' ? '' : e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Not Published</option>
              </select>
            </div>
          </div>
          <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={brokenThumbnailFilter}
                onChange={(e) => setBrokenThumbnailFilter(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show only videos with broken thumbnails (404 errors)
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-6">
              Click <strong>"🔍 Check Broken Thumbnails"</strong> button above to scan all videos and detect 404 errors.
              Then use this filter to show only videos with broken thumbnails.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="created_at">Created Date</option>
                <option value="view_count">View Count</option>
                <option value="like_count">Like Count</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVideos.length === videos.length && videos.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {videos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No videos found
                    </td>
                  </tr>
                ) : (
                  videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedVideos.includes(video.id)}
                          onChange={() => toggleVideoSelection(video.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {video.thumbnail_url ? (
                            <div className="relative w-20 h-12 flex-shrink-0">
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-20 h-12 object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.broken-thumb-indicator')) {
                                    const indicator = document.createElement('div');
                                    indicator.className = 'broken-thumb-indicator w-20 h-12 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded flex items-center justify-center';
                                    indicator.innerHTML = '<span class="text-red-600 dark:text-red-300 text-xs font-bold">❌ BROKEN</span>';
                                    parent.appendChild(indicator);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">NO IMAGE</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {video.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {video.authors?.name || 'Unknown'} · {video.quality}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>👁️ {video.view_count.toLocaleString()} views</div>
                        <div>❤️ {video.like_count.toLocaleString()} likes</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            video.is_published
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {video.is_published ? 'Published' : 'Draft'}
                          </span>
                          {video.is_featured && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-y-1">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTogglePublished(video.id, video.is_published)}
                            className={`text-xs px-2 py-1 rounded ${
                              video.is_published
                                ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400'
                                : 'text-green-600 hover:text-green-800 dark:text-green-400'
                            }`}
                          >
                            {video.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(video.id, video.is_featured)}
                            className={`text-xs px-2 py-1 rounded ${
                              video.is_featured
                                ? 'text-gray-600 hover:text-gray-800 dark:text-gray-400'
                                : 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400'
                            }`}
                          >
                            {video.is_featured ? 'Unfeature' : 'Feature'}
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/videos/${video.id}/edit`}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xs"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/videos/${video.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages} ({totalVideos} total videos)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    if (newPage !== currentPage) {
                      setCurrentPage(newPage);
                      setTimeout(() => loadData(), 0);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    if (newPage !== currentPage) {
                      setCurrentPage(newPage);
                      setTimeout(() => loadData(), 0);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
