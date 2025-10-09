import { PlatformStats } from '@/lib/admin-api';

interface StatsCardsProps {
  stats: PlatformStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number | string;
    label: string;
    isPositive?: boolean;
  };
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'pink';
}

const colorClasses = {
  purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
};

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              <span className={`font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 p-3 rounded-lg border ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Videos */}
      <StatCard
        title="Total Videos"
        value={stats.total_videos}
        subtitle={`${stats.videos_today} added today`}
        icon="🎬"
        trend={{
          value: stats.videos_today,
          label: 'today',
          isPositive: stats.videos_today > 0,
        }}
        color="purple"
      />

      {/* Total Users */}
      <StatCard
        title="Total Users"
        value={stats.total_users}
        subtitle={`${stats.users_today} joined today`}
        icon="👥"
        trend={{
          value: stats.users_today,
          label: 'today',
          isPositive: stats.users_today > 0,
        }}
        color="blue"
      />

      {/* Total Views */}
      <StatCard
        title="Total Views"
        value={stats.total_views}
        subtitle={`${stats.views_today} views today`}
        icon="👁️"
        trend={{
          value: stats.views_today,
          label: 'today',
          isPositive: stats.views_today > 0,
        }}
        color="green"
      />

      {/* Total Likes */}
      <StatCard
        title="Total Likes"
        value={stats.total_likes}
        icon="❤️"
        color="red"
      />

      {/* Total Favorites */}
      <StatCard
        title="Total Favorites"
        value={stats.total_favorites}
        icon="⭐"
        color="orange"
      />

      {/* Total Authors */}
      <StatCard
        title="Authors"
        value={stats.total_authors}
        icon="✍️"
        color="pink"
      />

      {/* Total Categories */}
      <StatCard
        title="Categories"
        value={stats.total_categories}
        icon="📁"
        color="blue"
      />

      {/* Total Tags */}
      <StatCard
        title="Tags"
        value={stats.total_tags}
        icon="🏷️"
        color="purple"
      />
    </div>
  );
}
