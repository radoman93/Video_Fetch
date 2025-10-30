'use client';

import { useEffect, useRef } from 'react';
import { useIsMobile } from './useExoClick';

interface ExoClickPopunderProps {
  desktopZoneId?: string;
  mobileZoneId?: string;
  accountId?: string;
  trigger?: 'immediate' | 'click';
  frequency?: number; // hours between popunders (default: 24)
}

/**
 * ExoClick Popunder Ad Component (Highest Revenue)
 *
 * Displays popunder ads that open in new tab/window
 * Respects frequency caps to avoid user annoyance
 *
 * @param desktopZoneId - Zone ID for desktop popunders
 * @param mobileZoneId - Zone ID for mobile popunders
 * @param accountId - ExoClick account ID
 * @param trigger - When to show popunder: 'immediate' (on mount) or 'click' (on any click)
 * @param frequency - Hours between popunders (default: 24)
 */
export function ExoClickPopunder({
  desktopZoneId = process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_DESKTOP,
  mobileZoneId = process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER_MOBILE,
  accountId = process.env.NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID,
  trigger = 'immediate',
  frequency = 24,
}: ExoClickPopunderProps) {
  const isMobile = useIsMobile();
  const hasTriggered = useRef(false);

  useEffect(() => {
    const zoneId = isMobile ? mobileZoneId : desktopZoneId;

    if (!zoneId) {
      console.warn('ExoClick Popunder: Missing zone ID');
      return;
    }

    // Check frequency cap using localStorage
    const lastPopunder = localStorage.getItem('exoclick_last_popunder');
    const now = Date.now();
    const frequencyMs = frequency * 60 * 60 * 1000; // hours to milliseconds

    if (lastPopunder) {
      const timeSince = now - parseInt(lastPopunder, 10);
      if (timeSince < frequencyMs) {
        console.log('ExoClick Popunder: Frequency cap active');
        return;
      }
    }

    const triggerPopunder = () => {
      if (hasTriggered.current) return;
      hasTriggered.current = true;

      // Set last popunder timestamp
      localStorage.setItem('exoclick_last_popunder', now.toString());

      // Inject ExoClick popunder script
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = `//a.magsrv.com/popunder/1000.js`;
      script.setAttribute('data-zone', zoneId);

      if (accountId) {
        script.setAttribute('data-account', accountId);
      }

      document.body.appendChild(script);

      // Cleanup after script loads
      script.onload = () => {
        console.log('ExoClick Popunder triggered');
      };

      script.onerror = () => {
        console.error('ExoClick Popunder failed to load');
        hasTriggered.current = false; // Allow retry
      };
    };

    if (trigger === 'immediate') {
      // Trigger immediately on mount (with small delay for better UX)
      const timeout = setTimeout(triggerPopunder, 1000);
      return () => clearTimeout(timeout);
    } else if (trigger === 'click') {
      // Trigger on first click anywhere on the page
      const handleClick = () => {
        triggerPopunder();
        document.removeEventListener('click', handleClick);
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [desktopZoneId, mobileZoneId, accountId, trigger, frequency, isMobile]);

  // Popunders are invisible - no UI rendering needed
  return null;
}

/**
 * Hook to check if popunder can be shown (respecting frequency cap)
 */
export function useCanShowPopunder(frequencyHours: number = 24): boolean {
  const lastPopunder = typeof window !== 'undefined'
    ? localStorage.getItem('exoclick_last_popunder')
    : null;

  if (!lastPopunder) return true;

  const now = Date.now();
  const timeSince = now - parseInt(lastPopunder, 10);
  const frequencyMs = frequencyHours * 60 * 60 * 1000;

  return timeSince >= frequencyMs;
}
