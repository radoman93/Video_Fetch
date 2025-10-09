'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { FilterSidebar, FilterValues } from '@/components/FilterSidebar';
import { useEffect, useState } from 'react';

export default function VideosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') || '1');
  const quality = searchParams.get('quality') || undefined;
  const sortBy = searchParams.get('sort_by') || 'created_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';
  const durationMin = searchParams.get('duration_min')
    ? parseInt(searchParams.get('duration_min')!)
    : undefined;
  const durationMax = searchParams.get('duration_max')
    ? parseInt(searchParams.get('duration_max')!)
    : undefined;
  const dateFrom = searchParams.get('date_from') || undefined;
  const dateTo = searchParams.get('date_to') || undefined;

  const [initialFilters, setInitialFilters] = useState<FilterValues>({
    quality,
    duration_min: durationMin,
    duration_max: durationMax,
    date_from: dateFrom,
    date_to: dateTo,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'videos',
      page,
      quality,
      sortBy,
      sortOrder,
      durationMin,
      durationMax,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      api.videos.getAll({
        page,
        page_size: 24,
        quality,
        sort_by: sortBy,
        sort_order: sortOrder,
        duration_min: durationMin,
        duration_max: durationMax,
        date_from: dateFrom,
        date_to: dateTo,
      }),
  });

  const handleFilterChange = (filters: FilterValues) => {
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to page 1 when filtering

    if (filters.quality) params.set('quality', filters.quality);
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params.set('sort_order', filters.sort_order);
    if (filters.duration_min) params.set('duration_min', filters.duration_min.toString());
    if (filters.duration_max) params.set('duration_max', filters.duration_max.toString());
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);

    router.push(`/videos?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/videos?${params.toString()}`);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">All Videos</h1>
          <p className="text-gray-400">Browse our complete collection</p>
        </div>

        {/* Content with sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              initialFilters={initialFilters}
            />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            {data && (
              <div className="mb-4 text-gray-400">
                Showing {data.items.length} of {data.total} videos
              </div>
            )}

            {/* Video Grid */}
            <VideoGrid videos={data?.items || []} loading={isLoading} />

            {/* Pagination */}
            {data && data.total_pages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!data.has_prev}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {/* Show first page */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    1
                  </button>
                  {page > 4 && <span className="px-2 py-2">...</span>}
                </>
              )}

              {/* Show nearby pages */}
              {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                .filter((p) => p > 0 && p <= data.total_pages)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      p === page
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {/* Show last page */}
              {page < data.total_pages - 2 && (
                <>
                  {page < data.total_pages - 3 && <span className="px-2 py-2">...</span>}
                  <button
                    onClick={() => goToPage(data.total_pages)}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {data.total_pages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!data.has_next}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
            </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
