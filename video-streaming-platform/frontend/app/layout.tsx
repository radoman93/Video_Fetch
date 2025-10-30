import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'FootVault - Premium Foot Fetish Content',
  description: 'Discover the finest collection of premium foot fetish videos. Your exclusive vault for high-quality feet content.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FootVault',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0e27',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0e27" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* ExoClick Global Script */}
        <Script
          strategy="afterInteractive"
          src="//a.magsrv.com/ad-provider.js"
          id="exoclick-global"
        />
      </head>
      <body>
        {/* Subtle scan line effect */}
        <div className="scan-line"></div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
