'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getAll({ page_size: 100 }),
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Categories</h1>
          <p className="text-gray-400">
            Browse videos by category
          </p>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 animate-pulse rounded-lg h-24"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.items.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group card hover:scale-105 transition-transform p-6"
              >
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {category.video_count} video{category.video_count !== 1 ? 's' : ''}
                </p>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {!isLoading && data && data.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No categories available yet.</p>
          </div>
        )}
      </main>
    </>
  );
}
