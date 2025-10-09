'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsAPI, VideoPerformance, TopAuthor, TopTag } from '@/lib/admin-api';

export default function TopContent() {
  const [topVideos, setTopVideos] = useState<VideoPerformance[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [topTags, setTopTags] = useState<TopTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'authors' | 'tags'>('videos');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videos, authors, tags] = await Promise.all([
        adminAnalyticsAPI.getTopVideos(period, 10),
        adminAnalyticsAPI.getTopAuthors(10),
        adminAnalyticsAPI.getTrendingTags(10),
      ]);
      setTopVideos(videos);
      setTopAuthors(authors);
      setTopTags(tags);
    } catch (error) {
      console.error('Failed to load top content:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'videos' as const, label: 'Videos', icon: '🎬' },
    { id: 'authors' as const, label: 'Authors', icon: '✍️' },
    { id: 'tags' as const, label: 'Tags', icon: '🏷️' },
  ];

  const periods: Array<{ value: 'today' | 'week' | 'month' | 'all'; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tabs and Period Selector */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'videos' && (
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm border-none focus:ring-2 focus:ring-purple-500"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Top Videos */}
            {activeTab === 'videos' && (
              <div className="space-y-2">
                {topVideos.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No videos found</p>
                ) : (
                  topVideos.map((video, index) => (
                    <div
                      key={video.video_id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {video.views.toLocaleString()} views · {video.likes.toLocaleString()} likes
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          Score: {video.engagement_score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Top Authors */}
            {activeTab === 'authors' && (
              <div className="space-y-2">
                {topAuthors.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No authors found</p>
                ) : (
                  topAuthors.map((author, index) => (
                    <div
                      key={author.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {author.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {author.video_count} videos · {author.total_views.toLocaleString()} views
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {author.avg_engagement.toFixed(1)}% engagement
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Top Tags */}
            {activeTab === 'tags' && (
              <div className="flex flex-wrap gap-2">
                {topTags.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 w-full">No tags found</p>
                ) : (
                  topTags.map((tag, index) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.video_count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
