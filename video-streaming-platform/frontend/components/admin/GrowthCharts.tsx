'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsAPI, UserGrowth, ContentGrowth, EngagementMetrics } from '@/lib/admin-api';

interface SimpleLineChartProps {
  data: Array<{ date: string; value: number }>;
  label: string;
  color: string;
}

function SimpleLineChart({ data, label, color }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const height = 200;
  const width = 100;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} days
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <line
            key={percent}
            x1="0"
            y1={height * (percent / 100)}
            x2={width}
            y2={height * (percent / 100)}
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-gray-300 dark:text-gray-600"
          />
        ))}

        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={color}
          opacity="0.1"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - (d.value / maxValue) * height;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{data[0]?.date.split('T')[0]}</span>
        <span>{data[data.length - 1]?.date.split('T')[0]}</span>
      </div>
    </div>
  );
}

export default function GrowthCharts() {
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [contentGrowth, setContentGrowth] = useState<ContentGrowth[]>([]);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userGrowthData, contentGrowthData, engagementData] = await Promise.all([
        adminAnalyticsAPI.getUserGrowth(days),
        adminAnalyticsAPI.getContentGrowth(days),
        adminAnalyticsAPI.getEngagementMetrics(),
      ]);
      setUserGrowth(userGrowthData);
      setContentGrowth(contentGrowthData);
      setEngagement(engagementData);
    } catch (error) {
      console.error('Failed to load growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex justify-end space-x-2">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              days === d
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {d} Days
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          <SimpleLineChart
            data={userGrowth.map(d => ({ date: d.date, value: d.new_users }))}
            label="New Users per Day"
            color="#8B5CF6"
          />
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total New Users</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {userGrowth.reduce((sum, d) => sum + d.new_users, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Content Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Growth</h3>
          <SimpleLineChart
            data={contentGrowth.map(d => ({ date: d.date, value: d.new_videos }))}
            label="New Videos per Day"
            color="#3B82F6"
          />
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total New Videos</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {contentGrowth.reduce((sum, d) => sum + d.new_videos, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      {engagement && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {engagement.total_views.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {engagement.total_likes.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Favorites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {engagement.total_favorites.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Viewers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {engagement.unique_viewers.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {engagement.engagement_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
