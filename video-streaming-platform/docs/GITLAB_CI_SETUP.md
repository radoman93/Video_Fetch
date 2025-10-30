# GitLab CI/CD Setup Guide

Complete guide for setting up GitLab CI/CD pipelines for automated deployment to Cloudflare Pages and Windows VPS.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitLab Runner Setup](#gitlab-runner-setup)
4. [CI/CD Variables Configuration](#cicd-variables-configuration)
5. [Pipeline Configuration](#pipeline-configuration)
6. [Testing the Pipeline](#testing-the-pipeline)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Pipeline Architecture

```
GitLab Repository
       │
       ├─> Push to main (frontend changes)
       │   └─> GitLab CI/CD → Build → Deploy to Cloudflare Pages
       │
       └─> Push to main (backend changes)
           └─> GitLab CI/CD → Build → Deploy to Windows VPS (GitLab Runner)
```

### Pipeline Stages

| Stage | Jobs | Description |
|-------|------|-------------|
| **test** | lint:frontend, lint:backend | Run ESLint and TypeScript checks |
| **build** | build:frontend, build:backend | Build production artifacts |
| **deploy** | deploy:frontend, deploy:backend | Deploy to production |

---

## Prerequisites

Before setting up GitLab CI/CD:

- [ ] GitLab account and repository
- [ ] Windows VPS with RDP access
- [ ] Cloudflare account
- [ ] Supabase project
- [ ] Domain name configured

---

## GitLab Runner Setup

### Option 1: Automated Setup (Recommended)

**On your Windows VPS (via RDP):**

```powershell
# Clone repository
cd C:\Apps
git clone https://gitlab.com/YOUR_USERNAME/YOUR_REPO.git footvault-backend
cd footvault-backend\backend

# Run GitLab Runner setup
.\scripts\setup-gitlab-runner.ps1
```

**You'll need:**
1. GitLab registration token (from your project)
2. Runner name (e.g., `windows-production`)
3. Runner tags (e.g., `windows,production`)

### Option 2: Manual Setup

**1. Download GitLab Runner:**
```powershell
# Create installation directory
New-Item -Path "C:\GitLab-Runner" -ItemType Directory -Force
cd C:\GitLab-Runner

# Download GitLab Runner
$url = "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe"
Invoke-WebRequest -Uri $url -OutFile "gitlab-runner.exe"
```

**2. Install as Windows Service:**
```powershell
.\gitlab-runner.exe install
```

**3. Register the Runner:**

Get registration token:
- Go to your GitLab project
- **Settings** → **CI/CD** → **Runners**
- Click **"New project runner"**
- Copy the registration token

Register:
```powershell
.\gitlab-runner.exe register `
    --non-interactive `
    --url "https://gitlab.com" `
    --registration-token "YOUR_REGISTRATION_TOKEN" `
    --name "windows-production" `
    --tag-list "windows,production" `
    --executor "shell" `
    --shell "powershell"
```

**4. Start the Runner:**
```powershell
Start-Service gitlab-runner
```

**5. Verify:**
```powershell
.\gitlab-runner.exe verify
Get-Service gitlab-runner
```

Go to **Settings** → **CI/CD** → **Runners** in GitLab to see your runner listed.

---

## CI/CD Variables Configuration

### Add Variables in GitLab

1. Go to your GitLab project
2. **Settings** → **CI/CD** → **Variables**
3. Click **"Add variable"** for each:

### Required Variables

| Variable | Value | Protected | Masked | Example |
|----------|-------|-----------|---------|---------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | ✅ | ✅ | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | ✅ | ❌ | `def456...` |
| `CLOUDFLARE_PROJECT_NAME` | Cloudflare Pages project name | ❌ | ❌ | `footvault-frontend` |
| `DOMAIN` | Your domain name | ❌ | ❌ | `yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Production API URL | ❌ | ❌ | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ❌ | ❌ | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ | ✅ | `eyJhbGc...` |
| `SUPABASE_URL` | Supabase project URL | ✅ | ❌ | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | ✅ | ✅ | `eyJhbGc...` |
| `PORT` | Backend port | ❌ | ❌ | `3001` |
| `CORS_ORIGIN` | Allowed CORS origins | ❌ | ❌ | `https://yourdomain.com,...` |

### How to Get Cloudflare Credentials

**Cloudflare API Token:**
1. Cloudflare Dashboard → **My Profile** → **API Tokens**
2. Click **"Create Token"**
3. Use **"Edit Cloudflare Workers"** template
4. Permissions: Account - Cloudflare Pages - Edit
5. Create and copy token

**Cloudflare Account ID:**
1. Cloudflare Dashboard → **Workers & Pages**
2. Right sidebar shows **Account ID**
3. Copy the ID

---

## Pipeline Configuration

### Pipeline File: `.gitlab-ci.yml`

The pipeline is already configured in `.gitlab-ci.yml` in the repository root.

**Key features:**
- ✅ Automatic linting on merge requests
- ✅ Frontend deployment to Cloudflare Pages
- ✅ Backend deployment to Windows VPS
- ✅ Health checks after deployment
- ✅ Manual rollback jobs
- ✅ Caching for faster builds

### Pipeline Triggers

| Event | Triggered Jobs |
|-------|----------------|
| Merge Request | `lint:frontend`, `lint:backend` |
| Push to `main` (frontend changed) | `build:frontend`, `deploy:frontend` |
| Push to `main` (backend changed) | `build:backend`, `deploy:backend` |
| Manual trigger | All jobs |

### Customizing the Pipeline

Edit `.gitlab-ci.yml` to customize:

```yaml
# Change when jobs run
rules:
  - if: '$CI_COMMIT_BRANCH == "main"'
    changes:
      - frontend/**/*

# Add new jobs
my-custom-job:
  stage: test
  script:
    - echo "Custom script"
```

---

## Testing the Pipeline

### 1. Test Linting (Merge Request)

```bash
# Create a feature branch
git checkout -b feature/test-pipeline

# Make a change
echo "// Test" >> frontend/app/page.tsx

# Push and create merge request
git add .
git commit -m "Test pipeline"
git push origin feature/test-pipeline
```

Go to GitLab → **Merge requests** → Create MR
- Linting jobs will run automatically
- Check pipeline status in MR

### 2. Test Frontend Deployment

```bash
# Switch to main branch
git checkout main
git pull

# Make a frontend change
echo "/* Test */" >> frontend/app/globals.css

# Commit and push
git add .
git commit -m "Test frontend deployment"
git push origin main
```

**What happens:**
1. GitLab CI detects frontend changes
2. Runs `lint:frontend` (in parallel with any other tests)
3. Runs `build:frontend` (builds Next.js app)
4. Runs `deploy:frontend` (deploys to Cloudflare Pages)
5. Site live at `https://yourdomain.com`

**Timeline:** 3-5 minutes

### 3. Test Backend Deployment

```bash
# Make a backend change
echo "// Test" >> backend/src/server.ts

# Commit and push
git add .
git commit -m "Test backend deployment"
git push origin main
```

**What happens:**
1. GitLab CI detects backend changes
2. Runs `lint:backend`
3. Runs `build:backend` (builds TypeScript)
4. Runs `deploy:backend` on Windows GitLab Runner
   - Creates `.env` file from CI/CD variables
   - Restarts PM2 process
   - Runs health check
5. Backend live at `https://api.yourdomain.com`

**Timeline:** 2-3 minutes

### 4. View Pipeline Status

**In GitLab:**
1. Go to **CI/CD** → **Pipelines**
2. Click on a pipeline to see job details
3. Click on a job to see logs

**Pipeline visualization:**
```
test     →  build      →  deploy
├─ lint:frontend  ├─ build:frontend  └─ deploy:frontend
└─ lint:backend   └─ build:backend   └─ deploy:backend
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Runner Not Picking Up Jobs

**Symptom:** Jobs stuck in "pending" state

**Solutions:**
1. Check runner status on Windows VPS:
   ```powershell
   Get-Service gitlab-runner
   .\gitlab-runner.exe verify
   ```

2. Check runner tags match job tags:
   - Job in `.gitlab-ci.yml`: `tags: [windows, production]`
   - Runner tags: `windows,production`

3. Restart runner:
   ```powershell
   Restart-Service gitlab-runner
   ```

#### Issue 2: Frontend Deployment Fails

**Symptom:** `deploy:frontend` job fails

**Solutions:**
1. Verify Cloudflare variables are set correctly:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PROJECT_NAME`

2. Check Cloudflare API token permissions:
   - Must have "Cloudflare Pages - Edit" permission

3. View job logs in GitLab for specific error

#### Issue 3: Backend Deployment Fails

**Symptom:** `deploy:backend` job fails

**Solutions:**
1. RDP into Windows VPS and check:
   ```powershell
   pm2 status
   pm2 logs footvault-backend --lines 50
   ```

2. Verify all backend CI/CD variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PORT`
   - `CORS_ORIGIN`

3. Check health endpoint manually:
   ```powershell
   curl http://localhost:3001/api/health
   ```

#### Issue 4: Health Check Fails

**Symptom:** Deployment succeeds but health check fails

**Solutions:**
1. Check if backend is actually running:
   ```powershell
   pm2 status
   ```

2. Test health endpoint:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/api/health"
   ```

3. Check port conflicts:
   ```powershell
   netstat -ano | findstr :3001
   ```

#### Issue 5: CORS Errors After Deployment

**Symptom:** Frontend shows CORS errors

**Solution:**
Update `CORS_ORIGIN` variable in GitLab:
- Settings → CI/CD → Variables
- Edit `CORS_ORIGIN`
- Value: `https://yourdomain.com,https://www.yourdomain.com`
- Redeploy backend

### Diagnostic Commands

**On Windows VPS:**
```powershell
# Check GitLab Runner status
Get-Service gitlab-runner
C:\GitLab-Runner\gitlab-runner.exe status

# View runner logs (last 50 events)
Get-EventLog -LogName Application -Source gitlab-runner -Newest 50

# Check PM2 status
pm2 status
pm2 logs footvault-backend --lines 50

# Test backend health
curl http://localhost:3001/api/health
```

**In GitLab:**
- **CI/CD** → **Pipelines** → View pipeline status
- **CI/CD** → **Jobs** → View individual job logs
- **Settings** → **CI/CD** → **Runners** → Verify runner is active

---

## Advanced Configuration

### Scheduled Pipelines

Run pipelines on a schedule (e.g., health checks, backups):

1. Go to **CI/CD** → **Schedules**
2. Click **"New schedule"**
3. Configure:
   - Description: "Daily health check"
   - Interval pattern: `0 0 * * *` (daily at midnight)
   - Target branch: `main`
4. Uncomment `health-check` job in `.gitlab-ci.yml`

### Manual Deployment

Trigger deployment manually without code changes:

1. Go to **CI/CD** → **Pipelines**
2. Click **"Run pipeline"**
3. Select branch: `main`
4. Click **"Run pipeline"**

### Rollback

If deployment breaks production:

**Option 1: Manual Rollback via GitLab**
1. Go to **CI/CD** → **Pipelines**
2. Find pipeline with rollback jobs
3. Click play button on `rollback:frontend` or `rollback:backend`

**Option 2: Git Revert**
```bash
# Revert the bad commit
git revert <bad-commit-hash>
git push origin main

# Pipeline will auto-deploy the reverted code
```

**Option 3: Redeploy Previous Commit**
1. Go to **Repository** → **Commits**
2. Find last good commit
3. Click **"...** → **"Run pipeline"**

---

## Best Practices

### 1. Use Protected Variables
- Mark sensitive variables as **Protected** and **Masked**
- Protected variables only available on protected branches

### 2. Test in Merge Requests
- Always create MRs for changes
- Let CI/CD run tests before merging
- Review pipeline results before merge

### 3. Monitor Pipeline Performance
- Check pipeline duration regularly
- Optimize slow jobs with caching
- Use artifacts for build outputs

### 4. Keep Runners Updated
```powershell
# On Windows VPS
cd C:\GitLab-Runner
.\gitlab-runner.exe stop
# Download latest version
.\gitlab-runner.exe start
```

### 5. Document Custom Jobs
- Add comments to `.gitlab-ci.yml`
- Document any custom scripts
- Keep README updated

---

## Quick Reference

### GitLab Runner Commands

```powershell
# Service management
Get-Service gitlab-runner
Start-Service gitlab-runner
Stop-Service gitlab-runner
Restart-Service gitlab-runner

# Runner management
cd C:\GitLab-Runner
.\gitlab-runner.exe list
.\gitlab-runner.exe verify
.\gitlab-runner.exe status

# View configuration
notepad C:\GitLab-Runner\config.toml

# View logs
Get-EventLog -LogName Application -Source gitlab-runner -Newest 50
```

### Pipeline Management

| Task | Command/Location |
|------|------------------|
| View pipelines | **CI/CD** → **Pipelines** |
| View jobs | **CI/CD** → **Jobs** |
| View runners | **Settings** → **CI/CD** → **Runners** |
| Edit variables | **Settings** → **CI/CD** → **Variables** |
| Create schedule | **CI/CD** → **Schedules** |
| Run manual pipeline | **CI/CD** → **Pipelines** → **Run pipeline** |

---

## Support

**GitLab CI/CD Documentation:**
- https://docs.gitlab.com/ee/ci/

**GitLab Runner Documentation:**
- https://docs.gitlab.com/runner/

**Troubleshooting:**
- Check pipeline logs in GitLab
- Check runner logs on Windows VPS
- Verify all CI/CD variables are set correctly

**For additional help, see:**
- [Cloudflare Setup Guide](./CLOUDFLARE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Windows Setup Guide](./IIS_SETUP.md)
