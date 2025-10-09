'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Get username from user metadata or email
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-semibold">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block">{username}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
          <Link
            href="/profile"
            className="block px-4 py-2 hover:bg-gray-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/favorites"
            className="block px-4 py-2 hover:bg-gray-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Favorites
          </Link>
          <Link
            href="/playlists"
            className="block px-4 py-2 hover:bg-gray-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Playlists
          </Link>
          <Link
            href="/history"
            className="block px-4 py-2 hover:bg-gray-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Watch History
          </Link>
          <hr className="my-2 border-gray-700" />
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-red-400"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
