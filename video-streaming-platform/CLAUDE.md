# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Setup

```bash
# Backend setup
cd backend
npm install
cp .env.example .env  # Configure with Supabase credentials

# Frontend setup
cd frontend
npm install
cp .env.local.example .env.local  # Configure with API URL and Supabase credentials
```

### Running Development Servers

```bash
# Backend (runs on http://localhost:3001)
cd backend
npm run dev

# Frontend (runs on http://localhost:3000)
cd frontend
npm run dev
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Code Quality

```bash
# Backend linting
cd backend
npm run lint
npm run format

# Frontend linting
cd frontend
npm run lint
```

### Database Migrations

Run migrations in Supabase SQL Editor in order:
1. `supabase/migrations/20250101000000_initial_schema.sql` - Core schema
2. `supabase/migrations/20250102000000_phase2_features.sql` - User features
3. `supabase/migrations/20250103000000_admin_cms_features.sql` - Admin features
4. `supabase/migrations/20250103000001_fix_admin_rls.sql` - RLS fixes

## High-Level Architecture

### Overview
A full-stack video streaming platform built with Next.js 14 (frontend) and Express.js (backend), using Supabase (PostgreSQL) for database and authentication.

### Architecture Pattern

**Frontend → Backend API → Supabase Database**

- Frontend makes API calls to Express backend
- Backend uses Supabase service role key for database operations
- Authentication uses Supabase Auth with JWT tokens
- Frontend passes JWT in Authorization header, backend verifies via Supabase

### Backend Structure (`backend/src/`)

**Layered Architecture:**
- **Routes** (`routes/`) → Define API endpoints and validate input
- **Controllers** (`controllers/`) → Handle HTTP requests/responses
- **Services** (`services/`) → Business logic and database operations
- **Middleware** (`middleware/`) → Auth verification, error handling
- **Types** (`types/`) → TypeScript type definitions

**Key Services:**
- `video.service.ts` - Video CRUD, trending calculation, related videos
- `search.service.ts` - Full-text search, suggestions, global search
- `like.service.ts` - Like/unlike videos, bulk status checks
- `favorite.service.ts` - Add/remove favorites, user's favorites list
- `admin.*.service.ts` - Admin CMS operations (video management, analytics, imports)

**Authentication Flow:**
1. Frontend gets JWT from Supabase Auth
2. Frontend includes JWT in `Authorization: Bearer <token>` header
3. Backend middleware (`auth.ts`) verifies JWT with Supabase
4. Decoded user ID available in `req.user.id`

### Frontend Structure (`frontend/`)

**Next.js 14 App Router:**
- `app/` - Pages using App Router file-based routing
- `components/` - Reusable React components
- `lib/` - Utilities (API client, Supabase client, auth context)

**State Management:**
- React Query (TanStack Query) for server state caching
- React Context for authentication state
- Local component state for UI

**Key Components:**
- `Header.tsx` - Navigation with search, user menu
- `VideoCard.tsx` - Video thumbnail card with metadata
- `VideoPlayer.tsx` - HTML5 video player with HLS support
- `LikeButton.tsx` / `FavoriteButton.tsx` - Interactive engagement buttons
- `FilterSidebar.tsx` - Advanced filtering (quality, duration, date)
- `AuthModal.tsx` - Sign in/sign up modal
- `admin/` - Admin CMS components (video management, analytics, bulk import)

**API Client Pattern (`lib/api.ts`):**
- All backend API calls go through centralized `api.ts`
- Automatically injects Supabase JWT token in headers
- TypeScript interfaces for request/response types
- Pagination helper with consistent response format

### Database Schema (`supabase/migrations/`)

**Core Tables:**
- `videos` - Video metadata, URLs, view/like counts, search vector
- `authors` - Content creators, auto-updated video counts
- `categories` - Hierarchical categories (self-referencing parent_id)
- `tags` - Flexible tagging system
- `actors` - Performers in videos

**Junction Tables:**
- `video_tags`, `video_categories`, `video_actors` - Many-to-many relationships

**User Engagement:**
- `video_likes` - User likes (triggers update `videos.like_count`)
- `favorites` - User watchlist/favorites
- `video_views` - View tracking with duration watched
- `comments` - User comments with nested replies

**Admin Features:**
- `library_imports` - Track bulk import operations
- Custom roles and RLS policies for admin access

**Database Features:**
- Full-text search using PostgreSQL `tsvector` on video titles/descriptions
- Triggers automatically update counts (video_count, like_count)
- Row Level Security (RLS) policies protect user data
- Helper functions: `get_trending_videos()`, `get_related_videos()`, `generate_slug()`
- Indexes on foreign keys, search vectors, and common query fields

### Important Patterns

**Pagination:**
All list endpoints return:
```typescript
{
  items: T[],
  total: number,
  page: number,
  page_size: number,
  total_pages: number,
  has_next: boolean,
  has_prev: boolean
}
```

**Error Handling:**
- Backend returns consistent error format: `{ error: string, message: string, status: number }`
- Frontend displays errors in UI with user-friendly messages

**Authentication Guards:**
- Backend: `authMiddleware` protects routes requiring authentication
- Frontend: Check `user` from `useAuth()` context, redirect if needed

**Video Storage:**
- Videos stored in Cloudflare R2 (S3-compatible)
- URLs stored in database (`videos.video_url`, `videos.thumbnail_url`)
- Backend handles video transcoding with FFmpeg (in `admin.video.service.ts`)

### Configuration

**Backend Environment Variables (.env):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (keep secret!)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - development | production
- `CORS_ORIGIN` - Allowed frontend origin

**Frontend Environment Variables (.env.local):**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)

## Important Implementation Details

### Trending Video Calculation
Trending score formula (in database function):
```sql
score = (view_count_24h * 1.0) + (like_count * 0.5) + (comment_count * 0.3)
```
Videos ranked by score, calculated in `get_trending_videos()` function.

### Related Videos Algorithm
Based on shared tags, ordered by number of common tags, then by view count.
Implemented in `get_related_videos(video_id)` database function.

### Search Implementation
- Full-text search uses PostgreSQL `to_tsvector()` and `to_tsquery()`
- Search vector auto-updated on video title/description changes via trigger
- Global search queries across videos, authors, categories, tags simultaneously
- Search suggestions use prefix matching with ILIKE

### Admin CMS System
- Role-based access control via `user_roles` table
- Admin users identified by `is_admin` flag
- RLS policies restrict admin operations to admin users
- Bulk video import from JSON format
- Analytics dashboard with aggregated statistics

### Video Player
- Uses HTML5 `<video>` element
- HLS streaming support via `hls.js` library
- View tracking via POST to `/api/videos/:id/view` on play
- Related videos sidebar for engagement

## Testing & Debugging

### Manual Testing Checklist
1. Backend health check: `curl http://localhost:3001/api/health`
2. Test video list: `curl http://localhost:3001/api/videos`
3. Test search: `curl "http://localhost:3001/api/search?q=test"`
4. Frontend auth: Sign up → Sign in → Sign out
5. Video engagement: Like → Unlike → Add to favorites → Remove
6. Admin access: Navigate to `/admin` (requires admin role)

### Common Issues

**CORS Errors:**
- Ensure `CORS_ORIGIN` in backend .env matches frontend URL
- Check `credentials: true` in both backend CORS config and frontend fetch calls

**Authentication Failures:**
- Verify JWT token is included in Authorization header
- Check Supabase credentials are correct in both backend and frontend
- Ensure user is authenticated before calling protected endpoints

**Database Connection Issues:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is active and not paused
- Run all migrations in correct order

**Video Playback Issues:**
- Ensure video URLs are accessible (check R2 bucket permissions)
- Verify HLS.js is loaded for HLS streams
- Check browser console for playback errors

## Deployment Considerations

**Backend Deployment (Railway/Render):**
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set all environment variables in platform dashboard
- Ensure PORT is set correctly (usually auto-assigned)

**Frontend Deployment (Vercel):**
- Framework preset: Next.js
- Build command: Auto-detected (`npm run build`)
- Set `NEXT_PUBLIC_*` environment variables
- Update `NEXT_PUBLIC_API_URL` to production backend URL

**Database (Supabase):**
- Run migrations via Supabase dashboard SQL Editor
- Enable Row Level Security on all tables
- Configure Auth providers (Email, Google, etc.)
- Set up Cloudflare R2 for video storage

**Post-Deployment:**
- Update CORS_ORIGIN to include production frontend URL
- Test all API endpoints with production URLs
- Verify authentication flow works end-to-end
- Check video playback from R2 URLs
