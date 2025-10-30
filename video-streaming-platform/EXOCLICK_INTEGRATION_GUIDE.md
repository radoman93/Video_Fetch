# ExoClick Integration Guide - Page-by-Page Instructions

This guide provides step-by-step instructions to integrate ExoClick ads into each page of your video streaming platform.

## Prerequisites

Before starting, ensure:
1. Development server is **stopped** (`Ctrl+C` in terminal)
2. All ExoClick zone IDs are configured in `.env.local` (see `.env.local.example`)
3. All ad components have been created in `frontend/components/ads/`

## Integration Steps

### 1. Homepage (`frontend/app/page.tsx`)

Replace the entire file content with:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoGridWithAds } from '@/components/VideoGridWithAds';
import { Pagination } from '@/components/Pagination';
import {
  ExoClickPopunder,
  ResponsiveBanner,
  RectangleBanner,
  AdSpacer,
} from '@/components/ads';

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['videos', 'home', page],
    queryFn: () => api.videos.getAll({ page, page_size: 20, sort_by: 'created_at' }),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['videos', 'trending'],
    queryFn: () => api.videos.getTrending(7, 12),
  });

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Popunder Ad - Triggers on page entry */}
      <ExoClickPopunder trigger="immediate" />

      {/* Top Banner Ad (728x90 Leaderboard) */}
      <ResponsiveBanner className="mb-8" />
      <AdSpacer size="md" />

      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Welcome to VideoHub</h1>
        <p className="text-gray-400 text-lg">
          Discover amazing videos from talented creators
        </p>
      </div>

      {/* Trending Videos with Native Ads (every 4th position) */}
      {trendingData && trendingData.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
          <VideoGridWithAds videos={trendingData} adFrequency={4} />
        </section>
      )}

      {/* Mid-page Banner Ad (300x250 Rectangle) - Desktop only */}
      <div className="hidden lg:flex justify-center mb-12">
        <RectangleBanner />
      </div>

      {/* Latest Videos with Native Ads (every 6th position) */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Latest Videos</h2>
        <VideoGridWithAds
          videos={data?.items || []}
          loading={isLoading}
          adFrequency={6}
        />

        {/* Pagination */}
        {data && (
          <>
            <div className="mt-6 text-center text-gray-400">
              Showing {data.items.length} of {data.total} videos
            </div>
            <Pagination
              currentPage={page}
              totalPages={data.total_pages}
              hasNext={data.has_next}
              hasPrev={data.has_prev}
              onPageChange={goToPage}
            />
          </>
        )}
      </section>

      {/* Bottom Banner Ad (728x90 Leaderboard) */}
      <AdSpacer size="lg" />
      <ResponsiveBanner className="mt-8" />
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Welcome to VideoHub</h1>
            <p className="text-gray-400 text-lg">
              Discover amazing videos from talented creators
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-gray-400">Loading...</div>
          </div>
        </main>
      }>
        <HomePageContent />
      </Suspense>
    </>
  );
}
```

**Ad Placements on Homepage:**
- ✅ Popunder on page entry
- ✅ Top banner (728x90 leaderboard)
- ✅ Native ads in trending grid (every 4th video)
- ✅ Mid-page rectangle banner (300x250, desktop only)
- ✅ Native ads in latest videos (every 6th video)
- ✅ Bottom banner (728x90 leaderboard)

---

### 2. Video Player Page (`frontend/app/videos/[id]/page.tsx`)

Replace the entire file content with:

```typescript
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { VideoPlayerWithAds } from '@/components/VideoPlayerWithAds';
import { VideoInfo } from '@/components/VideoInfo';
import { RelatedVideos } from '@/components/RelatedVideos';
import { useEffect, useState } from 'react';
import {
  ExoClickPopunder,
  ResponsiveBanner,
  RectangleBanner,
  AdSpacer,
  ExoClickNative,
} from '@/components/ads';

export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Fetch video data
  const { data: video, isLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => api.videos.getById(videoId),
  });

  // Fetch related videos
  const { data: relatedVideos, isLoading: relatedLoading } = useQuery({
    queryKey: ['related', videoId],
    queryFn: () => api.videos.getRelated(videoId, 7),
    enabled: !!video,
  });

  // Track view mutation
  const trackViewMutation = useMutation({
    mutationFn: () => api.videos.trackView(videoId),
  });

  // Track view on video play
  const handlePlay = () => {
    if (!hasTrackedView) {
      trackViewMutation.mutate();
      setHasTrackedView(true);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-800 rounded w-1/2" />
          </div>
        </main>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Video not found</h1>
            <p className="text-gray-400">
              The video you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Popunder Ad - Triggers on video click */}
        <ExoClickPopunder trigger="click" />

        {/* Top Banner Ad (728x90 Leaderboard) */}
        <ResponsiveBanner className="mb-6" />
        <AdSpacer size="sm" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player with Pre-roll Ad */}
            <VideoPlayerWithAds
              videoUrl={video.video_url}
              thumbnailUrl={video.thumbnail_url}
              onPlay={handlePlay}
              enablePreroll={true}
            />

            {/* Banner Ad Below Player (300x250) */}
            <div className="flex justify-center">
              <RectangleBanner />
            </div>

            {/* Video Info */}
            <VideoInfo video={video} />

            {/* Mid-content Banner Ad (728x90) - Desktop only */}
            <div className="hidden lg:block">
              <AdSpacer size="md" />
              <ResponsiveBanner />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Banner Ad (300x250) - Desktop only */}
            <div className="hidden lg:block">
              <RectangleBanner />
              <AdSpacer size="md" />
            </div>

            {/* Native Ad in Sidebar */}
            <ExoClickNative />
            <AdSpacer size="sm" />

            {/* Related Videos */}
            <RelatedVideos
              videos={relatedVideos || []}
              loading={relatedLoading}
            />

            {/* Bottom Sidebar Banner */}
            <div className="hidden lg:block">
              <AdSpacer size="md" />
              <RectangleBanner />
            </div>
          </div>
        </div>

        {/* Bottom Page Banner (728x90) */}
        <AdSpacer size="lg" />
        <ResponsiveBanner className="mt-8" />
      </main>
    </>
  );
}
```

**Ad Placements on Video Page:**
- ✅ Popunder on first click
- ✅ Video pre-roll ad (plays before video)
- ✅ Top banner (728x90)
- ✅ Banner below player (300x250)
- ✅ Multiple sidebar banners (300x250, desktop)
- ✅ Native ad in sidebar
- ✅ Mid-content banner (728x90, desktop)
- ✅ Bottom banner (728x90)

---

### 3. Browse/Search/Category Pages

For these pages (`frontend/app/videos/page.tsx`, `frontend/app/search/page.tsx`, `frontend/app/categories/[slug]/page.tsx`, etc.):

**Step 1:** Add imports at the top:
```typescript
import { VideoGridWithAds } from '@/components/VideoGridWithAds';
import {
  ExoClickPopunder,
  ResponsiveBanner,
  RectangleBanner,
  AdSpacer,
} from '@/components/ads';
```

**Step 2:** Add popunder at the top of the component:
```typescript
<ExoClickPopunder trigger="immediate" />
```

**Step 3:** Add top banner after header:
```typescript
<ResponsiveBanner className="mb-6" />
<AdSpacer size="md" />
```

**Step 4:** Replace `<VideoGrid videos={...} />` with:
```typescript
<VideoGridWithAds videos={videos} adFrequency={5} />
```

**Step 5:** Add bottom banner before closing:
```typescript
<AdSpacer size="lg" />
<ResponsiveBanner className="mt-8" />
```

---

### 4. Root Layout (`frontend/app/layout.tsx`)

Add ExoClick global script initialization:

```typescript
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Video Streaming Platform',
  description: 'A modern video streaming platform with advanced features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ExoClick Global Script */}
        <Script
          strategy="afterInteractive"
          src="//a.magsrv.com/ad-provider.js"
          id="exoclick-global"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Testing Checklist

After integration, test the following:

1. **Homepage:**
   - [ ] Popunder fires on page load (check once per 24h)
   - [ ] Top banner loads
   - [ ] Native ads appear in video grids
   - [ ] Bottom banner loads

2. **Video Page:**
   - [ ] Pre-roll ad plays before video
   - [ ] Can skip ad after 5 seconds
   - [ ] Main video auto-plays after ad
   - [ ] Popunder fires on first click
   - [ ] All banner ads load

3. **Browse Pages:**
   - [ ] Native ads injected into grids
   - [ ] Top and bottom banners load

4. **Mobile:**
   - [ ] Mobile-specific ad sizes used (320x100)
   - [ ] Native ads display properly
   - [ ] No layout issues

## Disabling Ads (Optional)

To temporarily disable ads for testing, set in `.env.local`:

```bash
NEXT_PUBLIC_ADS_ENABLED=false
# Or disable specific types:
NEXT_PUBLIC_POPUNDERS_ENABLED=false
NEXT_PUBLIC_VIDEO_ADS_ENABLED=false
NEXT_PUBLIC_BANNER_ADS_ENABLED=false
NEXT_PUBLIC_NATIVE_ADS_ENABLED=false
```

## Revenue Optimization Tips

1. **Test Different Ad Frequencies:** Adjust `adFrequency` prop on `VideoGridWithAds` to find optimal balance
2. **Monitor ExoClick Dashboard:** Check which zones have highest CPM
3. **A/B Test Placements:** Try different banner positions
4. **Optimize for Tier 1 Traffic:** Set higher floor prices for US/UK/CA traffic
5. **Season Frequency Caps:** Reduce popunder frequency during high-traffic periods

## Support

- ExoClick Dashboard: https://admin.exoclick.com/
- See `EXOCLICK_SETUP.md` for account setup
- Check browser console for ad loading errors
