# Deployment Workflow Guide

This guide explains how to deploy updates to your video streaming platform using the automated CI/CD pipeline.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Deployment Environments](#deployment-environments)
3. [Automated Deployment Process](#automated-deployment-process)
4. [Manual Deployment](#manual-deployment)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                                                               │
│  ┌─────────────┐                    ┌─────────────┐         │
│  │   Frontend  │                    │   Backend   │         │
│  │  (Next.js)  │                    │  (Express)  │         │
│  └─────────────┘                    └─────────────┘         │
│         │                                   │                │
│         │                                   │                │
└─────────┼───────────────────────────────────┼────────────────┘
          │                                   │
          │ Push to main                      │ Push to main
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌────────────────────────┐
│  GitHub Actions      │          │  GitHub Actions        │
│  deploy-frontend.yml │          │  deploy-backend.yml    │
└──────────────────────┘          └────────────────────────┘
          │                                   │
          │ Auto Build & Deploy               │ Auto Deploy
          │                                   │
          ▼                                   ▼
┌──────────────────────┐          ┌────────────────────────┐
│  Cloudflare Pages    │          │  Windows VPS (PM2)     │
│  Global CDN          │          │  api.yourdomain.com    │
│  yourdomain.com      │          │  Port 3001             │
└──────────────────────┘          └────────────────────────┘
          │                                   │
          └───────────────┬───────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Supabase   │
                  │  PostgreSQL  │
                  │     Auth     │
                  └──────────────┘
```

---

## Deployment Environments

### Local Development
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:3001`
- **Database:** Supabase Development Project
- **Purpose:** Local testing and feature development

### Production
- **Frontend:** `https://yourdomain.com` (Cloudflare Pages)
- **Backend:** `https://api.yourdomain.com` (Windows VPS)
- **Database:** Supabase Production Project
- **Purpose:** Live production environment for end users

---

## Automated Deployment Process

### Prerequisites

Before automated deployments work, ensure:

1. ✅ GitHub Actions enabled in your repository
2. ✅ All GitHub Secrets configured (see [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md#github-secrets-configuration))
3. ✅ Windows VPS set up with self-hosted GitHub runner (or SSH access configured)
4. ✅ PM2 installed and configured on Windows VPS

### Frontend Deployment (Automatic)

**Triggered by:** Push to `main` branch with changes in `frontend/` directory

**Workflow:** `.github/workflows/deploy-frontend.yml`

**Process:**
1. ✅ Code pushed to `main` branch
2. ✅ GitHub Actions triggered automatically
3. ✅ Install Node.js dependencies (`npm ci`)
4. ✅ Build Next.js application (`npm run build`)
5. ✅ Deploy to Cloudflare Pages
6. ✅ Deployment live on `https://yourdomain.com`

**Timeline:** 3-5 minutes

**Manual Trigger:**
```bash
# Go to GitHub Actions tab → deploy-frontend → Run workflow
```

### Backend Deployment (Automatic)

**Triggered by:** Push to `main` branch with changes in `backend/` directory

**Workflow:** `.github/workflows/deploy-backend.yml`

**Process:**
1. ✅ Code pushed to `main` branch
2. ✅ Self-hosted runner on Windows VPS picks up job
3. ✅ Install dependencies (`npm ci`)
4. ✅ Build TypeScript (`npm run build`)
5. ✅ Create `.env` file from GitHub Secrets
6. ✅ Restart PM2 process with zero downtime (`pm2 restart`)
7. ✅ Health check verification
8. ✅ Deployment complete

**Timeline:** 2-3 minutes

**Manual Trigger:**
```bash
# Go to GitHub Actions tab → deploy-backend → Run workflow
```

### CI Checks (Automatic on PRs)

**Triggered by:** Pull requests to `main` or `develop` branches

**Workflow:** `.github/workflows/ci-checks.yml`

**Process:**
1. ✅ Pull request created
2. ✅ Run ESLint on frontend and backend
3. ✅ Run TypeScript type checking
4. ✅ Build verification
5. ✅ Pass/Fail status reported on PR

**Timeline:** 2-4 minutes

---

## Manual Deployment

Sometimes you need to deploy manually (debugging, emergency fixes, etc.).

### Frontend Manual Deployment

#### Option 1: Via Cloudflare Pages Dashboard
1. Log in to Cloudflare Dashboard
2. Go to **Workers & Pages** → **footvault-frontend**
3. Click **"Retry deployment"** or **"Create deployment"**
4. Select branch and deploy

#### Option 2: Via Wrangler CLI
```bash
cd frontend

# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build
npm run build

# Deploy
wrangler pages deploy out --project-name=footvault-frontend
```

### Backend Manual Deployment

#### Via PowerShell on Windows VPS

```powershell
# RDP or SSH into your Windows VPS

# Navigate to backend directory
cd C:\Apps\footvault-backend\backend

# Run deployment script
.\scripts\deploy.ps1

# Or do it step by step:
git pull origin main
npm ci
npm run build
pm2 restart ecosystem.config.js --env production
pm2 save
```

#### Via SSH (if configured)

```bash
ssh admin@YOUR_VPS_IP

cd /path/to/backend
.\scripts\deploy.ps1
```

---

## Rollback Procedures

### Frontend Rollback

#### Option 1: Redeploy Previous Version (Fastest)
1. Go to Cloudflare Pages dashboard
2. Navigate to **Deployments**
3. Find the last working deployment
4. Click **"..."** → **"Rollback to this deployment"**

#### Option 2: Git Revert
```bash
# Find the commit hash of the last working version
git log --oneline

# Revert to that commit
git revert <bad-commit-hash>

# Push to trigger new deployment
git push origin main
```

### Backend Rollback

#### Option 1: PM2 Previous Version (if available)
```powershell
# Check PM2 logs for previous version info
pm2 logs footvault-backend --lines 100

# If you have a backup, restore it manually
```

#### Option 2: Git Rollback
```powershell
# RDP into Windows VPS
cd C:\Apps\footvault-backend\backend

# Revert to previous commit
git revert <bad-commit-hash>

# Or reset to specific commit (CAUTION: destructive)
git reset --hard <good-commit-hash>

# Redeploy
.\scripts\deploy.ps1
```

#### Option 3: Database Rollback (if schema changed)

If a migration caused issues:

```sql
-- Connect to Supabase SQL Editor

-- Check current migration version
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;

-- Manually revert migration if needed
-- (You'll need to write reverse SQL)
```

---

## Monitoring & Health Checks

### Frontend Monitoring

**Cloudflare Analytics:**
1. Go to Cloudflare Pages dashboard
2. View **Analytics** tab for:
   - Request count
   - Bandwidth usage
   - Error rate
   - Geographic distribution

**Browser Testing:**
```bash
# Check if site is up
curl -I https://yourdomain.com

# Should return: HTTP/2 200
```

### Backend Monitoring

**PM2 Process Monitoring:**

```powershell
# Check process status
pm2 status

# View logs
pm2 logs footvault-backend

# Monitor resources
pm2 monit

# View detailed info
pm2 describe footvault-backend
```

**Health Check Endpoint:**

```bash
# Manual health check
curl https://api.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

**Automated Monitoring (Recommended):**

Set up external monitoring with services like:
- **UptimeRobot** (free): https://uptimerobot.com/
- **Pingdom**
- **StatusCake**

Monitor these endpoints:
- `https://yourdomain.com` (Frontend)
- `https://api.yourdomain.com/api/health` (Backend)

### Database Monitoring

**Supabase Dashboard:**
1. Log in to Supabase
2. Go to **Database** → **Logs**
3. Monitor:
   - Query performance
   - Error logs
   - Connection pool usage

---

## Deployment Checklist

Before deploying to production:

### Frontend Checklist
- [ ] All environment variables set in Cloudflare Pages dashboard
- [ ] ExoClick ad zones configured (if using ads)
- [ ] Build succeeds locally (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Test on local preview (`npm run build && npm run start`)

### Backend Checklist
- [ ] All environment variables set in GitHub Secrets and VPS `.env`
- [ ] Database migrations applied to production Supabase
- [ ] CORS_ORIGIN includes production frontend URL
- [ ] Build succeeds (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Health endpoint responds correctly

### Post-Deployment Verification
- [ ] Frontend loads without errors
- [ ] API calls succeed (check browser Network tab)
- [ ] User authentication works (login/signup)
- [ ] Video playback works
- [ ] Admin features accessible (if admin user)
- [ ] No CORS errors in browser console
- [ ] SSL certificate valid (green padlock)

---

## Common Deployment Issues

### Issue: Frontend build fails
**Solution:**
- Check Cloudflare Pages build logs
- Verify environment variables are set
- Test build locally: `npm run build`
- Check for missing dependencies in `package.json`

### Issue: Backend deployment fails
**Solution:**
- Check GitHub Actions logs
- Verify self-hosted runner is online
- RDP into VPS and check PM2 status
- Review backend logs: `pm2 logs footvault-backend`

### Issue: CORS errors after deployment
**Solution:**
```powershell
# RDP into Windows VPS
cd C:\Apps\footvault-backend\backend

# Edit .env file
notepad .env

# Update CORS_ORIGIN:
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Restart backend
pm2 restart footvault-backend
```

### Issue: API returns 502 Bad Gateway
**Solution:**
- Check if backend is running: `pm2 status`
- Restart backend: `pm2 restart footvault-backend`
- Check Windows firewall allows port 3001
- Verify Cloudflare DNS record points to correct IP

### Issue: Database connection errors
**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is active (not paused)
- Test connection from VPS:
  ```powershell
  curl https://your-project.supabase.co/rest/v1/
  ```

---

## Best Practices

### Version Control
- ✅ Always create feature branches for new work
- ✅ Use pull requests for code review
- ✅ Only merge to `main` after testing
- ✅ Tag releases: `git tag v1.0.0 && git push --tags`

### Environment Management
- ✅ Never commit `.env` files to Git
- ✅ Use separate Supabase projects for dev and production
- ✅ Rotate API keys regularly
- ✅ Document all environment variables

### Database Changes
- ✅ Test migrations locally first
- ✅ Backup database before major migrations
- ✅ Use Supabase migration system
- ✅ Never run destructive migrations without backup

### Monitoring
- ✅ Set up uptime monitoring
- ✅ Monitor PM2 logs regularly
- ✅ Check Cloudflare Analytics weekly
- ✅ Set up alerts for downtime

---

## Quick Reference Commands

### Frontend
```bash
# Local development
npm run dev

# Build production
npm run build

# Lint code
npm run lint
```

### Backend
```powershell
# Local development
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint

# Deploy to production
.\scripts\deploy.ps1
```

### PM2 Management
```powershell
pm2 status              # Check all processes
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 save                # Save process list
pm2 resurrect           # Restore saved processes
pm2 monit               # Real-time monitoring
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# After PR approval, merge to main
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main

# Automated deployment will trigger!
```

---

## Support

For issues or questions:
1. Check logs (Cloudflare Pages, PM2, GitHub Actions)
2. Review this documentation
3. Check [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for infrastructure setup
4. Check [LOCAL_SETUP.md](./LOCAL_SETUP.md) for development environment

## Next Steps

✅ Your deployment workflow is ready!

- [Set up local development environment](./LOCAL_SETUP.md)
- [Configure Cloudflare](./CLOUDFLARE_SETUP.md)
