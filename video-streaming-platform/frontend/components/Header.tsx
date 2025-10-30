'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { AuthModal } from './AuthModal';

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-navy/95 border-b border-neon-purple/30 shadow-glow-purple backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-primary flex-shrink-0 hover:opacity-90 transition-all duration-300 glow-on-hover group">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden group-hover:shadow-glow-pink transition-all duration-300">
              <Image
                src="/images/logo.png"
                alt="FootVault Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="gradient-text">FootVault</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full px-4 py-2 bg-dark-300 border border-neon-purple/30 rounded-lg focus:outline-none focus:border-neon-cyan text-white transition-all duration-300 focus:shadow-glow-cyan"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-cyan transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <Link
              href="/"
              className="text-gray-300 hover:text-neon-pink transition-all duration-300"
            >
              Home
            </Link>
            <Link
              href="/authors"
              className="text-gray-300 hover:text-neon-purple transition-all duration-300"
            >
              Authors
            </Link>
            <Link
              href="/categories"
              className="text-gray-300 hover:text-neon-cyan transition-all duration-300"
            >
              Categories
            </Link>
            <Link
              href="/tags"
              className="text-gray-300 hover:text-neon-blue transition-all duration-300"
            >
              Tags
            </Link>
          </nav>

          {/* Auth Section */}
          {!loading && (
            <div className="hidden lg:block flex-shrink-0">
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neon-pink hover:bg-pink-600 rounded-lg font-semibold transition-all duration-300 shadow-glow-pink hover:shadow-glow-pink-lg"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white hover:text-neon-pink transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Search (always visible on mobile) */}
        <form onSubmit={handleSearch} className="mt-4 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full px-4 py-2 bg-dark-300 border border-neon-purple/30 rounded-lg focus:outline-none focus:border-neon-cyan text-white transition-all duration-300 focus:shadow-glow-cyan"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-cyan transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 flex flex-col gap-3">
            <Link
              href="/"
              className="text-gray-300 hover:text-neon-pink transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/authors"
              className="text-gray-300 hover:text-neon-purple transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Authors
            </Link>
            <Link
              href="/categories"
              className="text-gray-300 hover:text-neon-cyan transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              href="/tags"
              className="text-gray-300 hover:text-neon-blue transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tags
            </Link>

            {/* Mobile Auth Buttons */}
            {!loading && !user && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-neon-purple/30"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-neon-pink hover:bg-pink-600 rounded-lg font-semibold transition-all duration-300 shadow-glow-pink"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile User Menu */}
            {!loading && user && (
              <div className="mt-2">
                <UserMenu />
              </div>
            )}
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
}
