'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsAPI } from '@/lib/admin-api';

interface Activity {
  type: string;
  title: string;
  author?: string;
  timestamp: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await adminAnalyticsAPI.getRecentActivity(20);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_upload':
        return '🎬';
      case 'user_joined':
        return '👤';
      case 'comment':
        return '💬';
      case 'like':
        return '❤️';
      case 'favorite':
        return '⭐';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'video_upload':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'user_joined':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'comment':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'like':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'favorite':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <button
          onClick={loadActivity}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.type === 'video_upload' && (
                      <>
                        <span className="font-medium">{activity.author || 'Unknown'}</span>
                        {' uploaded '}
                        <span className="font-medium">{activity.title}</span>
                      </>
                    )}
                    {activity.type === 'user_joined' && (
                      <>
                        <span className="font-medium">{activity.title}</span>
                        {' joined the platform'}
                      </>
                    )}
                    {activity.type !== 'video_upload' && activity.type !== 'user_joined' && (
                      <span className="font-medium">{activity.title}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button className="w-full text-sm text-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
            View All Activity →
          </button>
        </div>
      )}
    </div>
  );
}
