'use client';

import { useState } from 'react';

interface FilterSidebarProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  quality?: string;
  duration_min?: number;
  duration_max?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

export function FilterSidebar({ onFilterChange, initialFilters = {} }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterValues = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden mb-4 px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block bg-gray-800 rounded-lg p-4 space-y-6`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-pink-500 hover:text-pink-400 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Quality Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Quality</label>
          <select
            value={filters.quality || ''}
            onChange={(e) => handleFilterChange('quality', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
          >
            <option value="">All Qualities</option>
            <option value="4K">4K</option>
            <option value="1080p">1080p</option>
            <option value="HD">HD</option>
            <option value="720p">720p</option>
            <option value="SD">SD</option>
          </select>
        </div>

        {/* Duration Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Min</label>
              <input
                type="number"
                min="0"
                value={filters.duration_min ? Math.floor(filters.duration_min / 60) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'duration_min',
                    e.target.value ? parseInt(e.target.value) * 60 : undefined
                  )
                }
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Max</label>
              <input
                type="number"
                min="0"
                value={filters.duration_max ? Math.floor(filters.duration_max / 60) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'duration_max',
                    e.target.value ? parseInt(e.target.value) * 60 : undefined
                  )
                }
                placeholder="∞"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload Date</label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">From</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">To</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium mb-2">Sort By</label>
          <select
            value={filters.sort_by || 'created_at'}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-pink-500 focus:outline-none"
          >
            <option value="created_at">Newest</option>
            <option value="uploaded_at">Upload Date</option>
            <option value="view_count">Most Viewed</option>
            <option value="like_count">Most Liked</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium mb-2">Order</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('sort_order', 'desc')}
              className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                (filters.sort_order || 'desc') === 'desc'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-700'
              }`}
            >
              Desc
            </button>
            <button
              onClick={() => handleFilterChange('sort_order', 'asc')}
              className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                filters.sort_order === 'asc'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-700'
              }`}
            >
              Asc
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
