interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        Previous
      </button>

      <div className="flex gap-2">
        {/* Show first page */}
        {currentPage > 3 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              1
            </button>
            {currentPage > 4 && <span className="px-2 py-2">...</span>}
          </>
        )}

        {/* Show nearby pages */}
        {Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
          .filter((p) => p > 0 && p <= totalPages)
          .map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                p === currentPage
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}

        {/* Show last page */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && <span className="px-2 py-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
