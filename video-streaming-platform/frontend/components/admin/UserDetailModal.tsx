'use client';

import { useEffect, useState } from 'react';
import { adminUsersAPI } from '@/lib/admin-api';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
}

interface UserDetails {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role: string;
  role_assigned_at?: string;
  like_count: number;
  favorite_count: number;
  recent_likes: Array<{
    video_id: string;
    created_at: string;
    videos: { title: string };
  }>;
  recent_favorites: Array<{
    video_id: string;
    created_at: string;
    videos: { title: string };
  }>;
  metadata?: any;
}

interface UserActivity {
  period_days: number;
  activity: Array<{
    date: string;
    likes: number;
    favorites: number;
    views: number;
  }>;
  totals: {
    likes: number;
    favorites: number;
    views: number;
  };
}

export default function UserDetailModal({ userId, onClose, onRefresh }: UserDetailModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityDays, setActivityDays] = useState(30);

  useEffect(() => {
    loadUserDetails();
  }, [userId, activityDays]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailsData, activityData] = await Promise.all([
        adminUsersAPI.getUserById(userId),
        adminUsersAPI.getUserActivity(userId, activityDays),
      ]);

      setDetails(detailsData);
      setActivity(activityData);
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'admin' | 'moderator' | 'user') => {
    try {
      await adminUsersAPI.updateUserRole(userId, newRole);
      alert('Role updated successfully');
      loadUserDetails();
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const handleBan = async () => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    try {
      await adminUsersAPI.banUser(userId, reason);
      alert('User banned successfully');
      onClose();
      onRefresh();
    } catch (err: any) {
      alert(`Failed to ban user: ${err.message}`);
    }
  };

  const handleUnban = async () => {
    try {
      await adminUsersAPI.unbanUser(userId);
      alert('User unbanned successfully');
      loadUserDetails();
      onRefresh();
    } catch (err: any) {
      alert(`Failed to unban user: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminUsersAPI.deleteUser(userId);
      alert('User deleted successfully');
      onClose();
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">{details.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="text-gray-900 dark:text-white font-mono text-xs">{details.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                    <p className="text-gray-900 dark:text-white">{new Date(details.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Sign In</p>
                    <p className="text-gray-900 dark:text-white">{new Date(details.last_sign_in_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Role</p>
                    <select
                      value={details.role}
                      onChange={(e) => handleRoleChange(e.target.value as any)}
                      className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                        details.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : details.role === 'moderator'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {details.role_assigned_at && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Role Assigned</p>
                      <p className="text-gray-900 dark:text-white">{new Date(details.role_assigned_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
                    <p className="text-2xl font-bold text-purple-600">{details.like_count}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Favorites</p>
                    <p className="text-2xl font-bold text-blue-600">{details.favorite_count}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Combined</p>
                    <p className="text-2xl font-bold text-green-600">{details.like_count + details.favorite_count}</p>
                  </div>
                </div>
              </div>

              {/* Activity Over Time */}
              {activity && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
                    <select
                      value={activityDays}
                      onChange={(e) => setActivityDays(parseInt(e.target.value))}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Likes ({activityDays}d)</p>
                      <p className="text-xl font-bold text-purple-600">{activity.totals.likes}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Favorites ({activityDays}d)</p>
                      <p className="text-xl font-bold text-blue-600">{activity.totals.favorites}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Views ({activityDays}d)</p>
                      <p className="text-xl font-bold text-green-600">{activity.totals.views}</p>
                    </div>
                  </div>
                  {activity.activity.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">Date</th>
                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Likes</th>
                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Favorites</th>
                            <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">Views</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {activity.activity.map((day) => (
                            <tr key={day.date}>
                              <td className="px-3 py-2 text-gray-900 dark:text-white">{day.date}</td>
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{day.likes}</td>
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{day.favorites}</td>
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{day.views}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No activity in this period</p>
                  )}
                </div>
              )}

              {/* Recent Likes */}
              {details.recent_likes && details.recent_likes.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Likes</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.recent_likes.map((like) => (
                      <div key={like.video_id} className="bg-white dark:bg-gray-800 rounded p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{like.videos.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(like.created_at).toLocaleString()}</p>
                        </div>
                        <span className="text-red-500">❤️</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Favorites */}
              {details.recent_favorites && details.recent_favorites.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Favorites</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.recent_favorites.map((fav) => (
                      <div key={fav.video_id} className="bg-white dark:bg-gray-800 rounded p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{fav.videos.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(fav.created_at).toLocaleString()}</p>
                        </div>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleBan}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Ban User
                </button>
                <button
                  onClick={handleUnban}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Unban User
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
