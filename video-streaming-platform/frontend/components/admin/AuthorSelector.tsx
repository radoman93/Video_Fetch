'use client';

import { useState } from 'react';

interface Author {
  id: string;
  name: string;
  slug: string;
}

interface AuthorSelectorProps {
  selectedAuthor: Author | null;
  availableAuthors: Author[];
  onChange: (author: Author | null) => void;
  loading?: boolean;
}

export function AuthorSelector({ selectedAuthor, availableAuthors, onChange, loading }: AuthorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredAuthors = Array.isArray(availableAuthors)
    ? availableAuthors.filter((author) =>
        author.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelectAuthor = (author: Author) => {
    onChange(author);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Author
      </label>

      {/* Selected Author Display */}
      {selectedAuthor && (
        <div className="flex items-center justify-between px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <span className="text-purple-700 dark:text-purple-300 font-medium">
            {selectedAuthor.name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Search/Select Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={selectedAuthor ? 'Change author...' : 'Search and select author...'}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />

        {/* Dropdown */}
        {isDropdownOpen && filteredAuthors.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredAuthors.slice(0, 20).map((author) => (
              <button
                key={author.id}
                type="button"
                onClick={() => handleSelectAuthor(author)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                {author.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
