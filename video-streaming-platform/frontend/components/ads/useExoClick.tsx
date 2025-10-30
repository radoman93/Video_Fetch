'use client';

import { useEffect, useState } from 'react';

interface ExoClickConfig {
  zoneId: string;
  accountId?: string;
}

interface UseExoClickReturn {
  isLoaded: boolean;
  isError: boolean;
  loadAd: (containerId: string, config: ExoClickConfig) => void;
}

/**
 * Custom hook to manage ExoClick ad script loading and initialization
 * Handles script injection, error states, and provides utility functions
 */
export function useExoClick(): UseExoClickReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Check if ExoClick script is already loaded
    if (typeof window !== 'undefined' && (window as any).ExoLoader) {
      setIsLoaded(true);
      return;
    }

    // Load ExoClick main script
    const script = document.createElement('script');
    script.src = '//a.magsrv.com/ad-provider.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsError(false);
    };
    script.onerror = () => {
      setIsError(true);
      console.error('Failed to load ExoClick ad script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  /**
   * Load an ad into a specific container
   */
  const loadAd = (containerId: string, config: ExoClickConfig) => {
    if (!isLoaded || !config.zoneId) {
      console.warn('ExoClick not loaded or missing zone ID');
      return;
    }

    try {
      if (typeof window !== 'undefined' && (window as any).ExoLoader) {
        (window as any).ExoLoader.serve({
          sub: config.accountId || '',
          zone: config.zoneId,
        });
      }
    } catch (error) {
      console.error('Error loading ExoClick ad:', error);
      setIsError(true);
    }
  };

  return {
    isLoaded,
    isError,
    loadAd,
  };
}

/**
 * Hook to detect if user is on mobile device
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Utility function to generate unique ad container IDs
 */
export function generateAdId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}
