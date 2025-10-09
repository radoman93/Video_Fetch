# Setup Guide

This guide will walk you through setting up the video streaming platform from scratch.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier works fine)
- Git (optional)

## Step 1: Clone or Download the Project

```bash
cd video-streaming-platform
```

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Go to the SQL Editor in your Supabase dashboard
4. Copy the entire contents of `supabase/migrations/20250101000000_initial_schema.sql`
5. Paste and run it in the SQL Editor
6. Verify tables were created (check Table Editor)

## Step 3: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://rkucioamrdatpnsnhduq.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 4: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (already exists with your credentials)
# Verify the values in .env match your Supabase project

# Start the development server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📚 API documentation: http://localhost:3001/api
🏥 Health check: http://localhost:3001/api/health
```

## Step 5: Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify .env.local has your Supabase credentials

# Start the development server
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 6: Verify Everything Works

1. Open http://localhost:3000 in your browser
2. You should see the home page
3. The page will be empty initially (no videos yet)
4. Open http://localhost:3001/api/health to verify backend is running

## Step 7: Add Sample Data (Optional)

You can add sample data directly in Supabase:

### Add a Sample Author

Go to Supabase Table Editor → `authors` table → Insert row:

```json
{
  "name": "Test Creator",
  "slug": "test-creator",
  "bio": "A sample creator",
  "video_count": 0
}
```

### Add a Sample Video

Go to `videos` table → Insert row:

```json
{
  "video_id": "test123",
  "title": "Sample Video",
  "description": "This is a test video",
  "video_url": "https://example.com/video.mp4",
  "thumbnail_url": "https://via.placeholder.com/640x360",
  "duration": 120,
  "quality": "HD",
  "status": "active",
  "author_id": "[paste the id from the author you just created]"
}
```

### Add Sample Tags

Go to `tags` table → Insert rows:

```json
{
  "name": "Tutorial",
  "slug": "tutorial",
  "video_count": 0
}
```

Refresh http://localhost:3000 and you should see your sample video!

## Step 8: Development Workflow

### Backend Development

```bash
cd backend

# Run in development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

### Frontend Development

```bash
cd frontend

# Run in development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Backend won't start

1. Check `.env` file exists and has correct Supabase credentials
2. Verify Node.js version: `node --version` (should be 18+)
3. Delete `node_modules` and `package-lock.json`, run `npm install` again
4. Check if port 3001 is already in use

### Frontend won't start

1. Check `.env.local` file exists and has correct values
2. Verify Node.js version: `node --version` (should be 18+)
3. Delete `.next`, `node_modules`, and `package-lock.json`, run `npm install` again
4. Check if port 3000 is already in use

### Database connection errors

1. Verify Supabase URL is correct
2. Verify anon key is correct
3. Check if your Supabase project is paused (free tier pauses after inactivity)
4. Check Supabase dashboard for any error messages

### Videos not showing

1. Check browser console for errors
2. Verify backend is running: http://localhost:3001/api/health
3. Check if videos exist in database (Supabase Table Editor)
4. Verify video `status` is set to `'active'`

### CORS errors

1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
2. If using different ports, update the CORS_ORIGIN value
3. Clear browser cache and reload

## Next Steps

1. Read the [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) for architecture details
2. Check the [README.md](../README.md) for API documentation
3. Start building additional features!
4. Create a migration script to import your existing video library

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Getting Help

- Check existing documentation
- Review code comments
- Open an issue on GitHub
- Check Supabase documentation: https://supabase.com/docs

## Useful Commands

### Check if ports are in use
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3000
lsof -i :3001
```

### Reset database (WARNING: Deletes all data)
1. Go to Supabase SQL Editor
2. Run the migration SQL again (it will drop and recreate tables)

### Update dependencies
```bash
# Backend
cd backend && npm update

# Frontend
cd frontend && npm update
```

## Development Tips

1. **Use TypeScript** - The entire codebase is typed
2. **Follow the pattern** - Look at existing code for examples
3. **Test your changes** - Verify in browser and check network tab
4. **Read the logs** - Backend logs show all requests and errors
5. **Use React Query DevTools** - Add them to debug data fetching

Happy coding! 🚀
