# Local Development Setup Guide

This guide will help you set up your local development environment for the video streaming platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

- **Node.js 20+** - [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v20.x.x or higher
  ```

- **Git** - [Download](https://git-scm.com/)
  ```bash
  git --version
  ```

- **Code Editor** - Recommended: [VS Code](https://code.visualstudio.com/)

### Accounts Needed

- **GitHub Account** - For repository access
- **Supabase Account** - For database (free tier is fine)
  - Create a **development** project (separate from production)

---

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git

# Navigate to project
cd your-repo/video-streaming-platform
```

### 2. Project Structure

```
video-streaming-platform/
├── backend/              # Express.js API server
│   ├── src/             # TypeScript source code
│   ├── dist/            # Compiled JavaScript (generated)
│   ├── .env             # Environment variables (create this)
│   └── package.json
│
├── frontend/            # Next.js application
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities and API client
│   ├── .env.local      # Environment variables (create this)
│   └── package.json
│
├── supabase/           # Database migrations
│   └── migrations/     # SQL migration files
│
├── docs/               # Documentation
└── .github/            # GitHub Actions workflows
```

---

## Backend Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

```bash
# Copy example file
cp .env.example .env

# Or on Windows PowerShell:
copy .env.example .env
```

### 3. Configure Backend Environment Variables

Edit `backend/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration (Development Project)
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_KEY=your_dev_service_role_key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cache Configuration
CACHE_TTL=300
```

**How to get Supabase credentials:**

1. Log in to [Supabase](https://supabase.com/)
2. Create a **new project** for development (e.g., "footvault-dev")
3. Go to **Settings** → **API**
4. Copy:
   - **URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

### 4. Test Backend

```bash
# Build TypeScript
npm run build

# Start development server (with hot reload)
npm run dev

# Backend should start on http://localhost:3001
```

**Expected output:**
```
Server running on http://localhost:3001
Supabase connected
```

**Test the health endpoint:**
```bash
curl http://localhost:3001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd ../frontend  # From backend directory
npm install
```

### 2. Create Environment File

```bash
# Copy example file
cp .env.local.example .env.local

# Or on Windows PowerShell:
copy .env.local.example .env.local
```

### 3. Configure Frontend Environment Variables

Edit `frontend/.env.local`:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase Configuration (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key

# ExoClick Ad Configuration (optional for development)
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID=
NEXT_PUBLIC_POPUNDERS_ENABLED=false
NEXT_PUBLIC_VIDEO_ADS_ENABLED=false
NEXT_PUBLIC_BANNER_ADS_ENABLED=false
NEXT_PUBLIC_NATIVE_ADS_ENABLED=false
```

**Note:** For local development, you can disable ads by setting `NEXT_PUBLIC_ADS_ENABLED=false`.

### 4. Test Frontend

```bash
# Start development server (with hot reload)
npm run dev

# Frontend should start on http://localhost:3000
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

Open http://localhost:3000 in your browser. You should see the homepage.

---

## Database Setup

### 1. Create Supabase Development Project

1. Log in to [Supabase](https://app.supabase.com/)
2. Click **"New project"**
3. Fill in:
   - **Name:** footvault-dev (or your preferred name)
   - **Database Password:** Save this securely
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free
4. Wait 2-3 minutes for project initialization

### 2. Run Database Migrations

Open Supabase SQL Editor:

1. Go to your Supabase project
2. Click **SQL Editor** in left sidebar
3. Click **"New query"**

Run migrations **in order**:

#### Migration 1: Initial Schema
```sql
-- Copy and paste contents of:
-- supabase/migrations/20250101000000_initial_schema.sql
```

#### Migration 2: Phase 2 Features
```sql
-- Copy and paste contents of:
-- supabase/migrations/20250102000000_phase2_features.sql
```

#### Migration 3: Admin CMS Features
```sql
-- Copy and paste contents of:
-- supabase/migrations/20250103000000_admin_cms_features.sql
```

#### Migration 4: RLS Fixes
```sql
-- Copy and paste contents of:
-- supabase/migrations/20250103000001_fix_admin_rls.sql
```

Click **Run** for each migration.

### 3. Verify Database Setup

In Supabase SQL Editor, run:

```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see tables like:
- `videos`
- `authors`
- `categories`
- `tags`
- `video_tags`
- `video_categories`
- `video_likes`
- `favorites`
- `comments`

### 4. Create Admin User (Optional)

To access admin features:

```sql
-- Create admin user
-- First, sign up through your frontend at http://localhost:3000
-- Then run this SQL with your user's email:

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com';

-- Or set is_admin flag directly:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'your-email@example.com';
```

---

## Running the Application

### Start Everything

You'll need **two terminal windows/tabs**.

#### Terminal 1: Backend
```bash
cd video-streaming-platform/backend
npm run dev
```

#### Terminal 2: Frontend
```bash
cd video-streaming-platform/frontend
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Supabase Dashboard:** https://app.supabase.com/

### Test Authentication

1. Go to http://localhost:3000
2. Click **"Sign Up"** or **"Sign In"**
3. Create an account with your email
4. Check your email for verification link (if email verification enabled)
5. Log in and test features

---

## Development Workflow

### Making Changes

#### Frontend Changes (React/Next.js)

1. Edit files in `frontend/app/` or `frontend/components/`
2. Save - changes auto-reload in browser (Fast Refresh)
3. Check browser console for errors

#### Backend Changes (Express/TypeScript)

1. Edit files in `backend/src/`
2. Save - server auto-restarts (tsx watch)
3. Check terminal for errors
4. Test API endpoints with:
   ```bash
   curl http://localhost:3001/api/your-endpoint
   ```

#### Database Changes

1. Create new migration file in `supabase/migrations/`
   ```bash
   # Format: YYYYMMDDHHMMSS_description.sql
   # Example: 20250115120000_add_user_preferences.sql
   ```

2. Write SQL for schema changes
   ```sql
   -- Example migration
   CREATE TABLE user_preferences (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     theme TEXT DEFAULT 'dark',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Run migration in Supabase SQL Editor
4. Test with local application

### Code Quality

#### Linting

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

#### Type Checking

```bash
# Frontend
cd frontend
npx tsc --noEmit

# Backend
cd backend
npx tsc --noEmit
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# After review and approval, merge to main
```

---

## Troubleshooting

### Backend Issues

#### Error: "Cannot connect to Supabase"
**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is active (not paused due to inactivity)
- Test connection: `curl https://your-project.supabase.co/rest/v1/`

#### Error: "Port 3001 already in use"
**Solution:**
```bash
# Find and kill process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3001 | xargs kill -9

# Or use different port in .env:
PORT=3002
```

#### Error: "Module not found"
**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

#### Error: "API call failed" / "Network error"
**Solution:**
- Ensure backend is running on `http://localhost:3001`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors
- Verify backend `CORS_ORIGIN` includes `http://localhost:3000`

#### Error: "Supabase client error"
**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project status
- Clear browser cache and cookies

#### Build Error
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Database Issues

#### Error: "Table does not exist"
**Solution:**
- Verify all migrations ran successfully
- Check Supabase SQL Editor for error messages
- Re-run migrations in order

#### Error: "Permission denied" / "RLS policy violation"
**Solution:**
- Check Row Level Security (RLS) policies in Supabase
- Verify user is authenticated
- For testing, temporarily disable RLS:
  ```sql
  ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
  -- Remember to re-enable after testing!
  ```

---

## Development Tools

### Recommended VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript and JavaScript** - IntelliSense
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **GitLens** - Git visualization
- **Thunder Client** - API testing (alternative to Postman)

### API Testing

Use Thunder Client (VS Code) or Postman to test backend endpoints:

**Example requests:**

```http
### Get all videos
GET http://localhost:3001/api/videos

### Get single video
GET http://localhost:3001/api/videos/123

### Search videos
GET http://localhost:3001/api/search?q=test

### Like video (requires authentication)
POST http://localhost:3001/api/videos/123/like
Authorization: Bearer YOUR_JWT_TOKEN
```

### Browser DevTools

- **Console:** Check for JavaScript errors
- **Network:** Inspect API calls and responses
- **Application:** View localStorage, cookies, and session data

---

## Quick Reference

### Start Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Test Everything
```bash
# Backend lint
cd backend && npm run lint

# Frontend lint
cd frontend && npm run lint

# Type check
npx tsc --noEmit
```

### Common Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## Next Steps

✅ Your local development environment is ready!

Now you can:
1. Start building features
2. Test changes locally
3. Create pull requests
4. Deploy to production (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

For production deployment, see:
- [Cloudflare Setup Guide](./CLOUDFLARE_SETUP.md)
- [Deployment Workflow](./DEPLOYMENT.md)
