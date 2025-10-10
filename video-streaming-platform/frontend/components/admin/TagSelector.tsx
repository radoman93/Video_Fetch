'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  loading?: boolean;
}

export function TagSelector({ selectedTags, availableTags, onChange, loading }: TagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredTags = Array.isArray(availableTags)
    ? availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !selectedTags.find((selected) => selected.id === tag.id)
      )
    : [];

  const handleAddTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags
      </label>

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add Tag Dropdown */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder="Search and add tags..."
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />

        {/* Dropdown */}
        {isDropdownOpen && searchTerm && filteredTags.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredTags.slice(0, 10).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                {tag.name}
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
