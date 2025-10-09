'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { adminAnalyticsAPI, PlatformStats } from '@/lib/admin-api';
import StatsCards from '@/components/admin/StatsCards';
import GrowthCharts from '@/components/admin/GrowthCharts';
import TopContent from '@/components/admin/TopContent';
import RecentActivity from '@/components/admin/RecentActivity';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to home
      setError('Please sign in to access the admin dashboard');
      return;
    }

    // TODO: Check if user has admin role in the database
    // For now, we'll just load the data and let the API handle authorization
  }, [user, loading, router]);

  useEffect(() => {
    // Only load stats if user is logged in
    if (!loading && user) {
      loadStats();
    }
  }, [loading, user]);

  const loadStats = async () => {
    if (!user) {
      setError('Please sign in to access the admin dashboard');
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      setError(null);
      const data = await adminAnalyticsAPI.getPlatformStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotLoggedIn = error.includes('sign in') || error.includes('authorization token');

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isNotLoggedIn ? 'Authentication Required' : 'Access Denied'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col space-y-3">
              {isNotLoggedIn ? (
                <>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Go to Home & Sign In
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You need to sign in with an admin account
                  </p>
                </>
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Return to Home
                </button>
              )}
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your platform and view analytics
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadStats}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => router.push('/admin/import')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Import Videos
              </button>
              <button
                onClick={() => router.push('/admin/videos')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📹 Manage Videos
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                👥 Manage Users
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Platform Overview</h2>
          {stats && <StatsCards stats={stats} />}
        </div>

        {/* Growth Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Growth Metrics</h2>
          <GrowthCharts />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Content */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Performing Content</h2>
            <TopContent />
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
