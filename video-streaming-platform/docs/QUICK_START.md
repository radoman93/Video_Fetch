# Quick Start Guide - CI/CD Setup

This is a **quick reference** for setting up the complete CI/CD pipeline. For detailed instructions, see the full documentation.

## 📋 Prerequisites Checklist

- [ ] GitHub account with repository
- [ ] Cloudflare account (free tier)
- [ ] Windows VPS with public IP
- [ ] Supabase account (free tier)
- [ ] Domain name (optional but recommended)

---

## 🚀 Setup Steps (30 Minutes)

### Step 1: Clone & Setup Repository (5 min)

```bash
git clone https://github.com/your-username/your-repo.git
cd video-streaming-platform
```

### Step 2: Configure GitHub Secrets (5 min)

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

```
CLOUDFLARE_API_TOKEN          # From Cloudflare dashboard
CLOUDFLARE_ACCOUNT_ID         # From Cloudflare dashboard
NEXT_PUBLIC_API_URL           # https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL      # From Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY # From Supabase project
SUPABASE_URL                  # From Supabase project
SUPABASE_SERVICE_KEY          # From Supabase project (service_role)
PORT                          # 3001
CORS_ORIGIN                   # https://yourdomain.com,https://www.yourdomain.com
```

### Step 3: Setup Windows VPS (15 min)

**RDP into your Windows VPS:**

```powershell
# Clone repository
git clone https://github.com/your-username/your-repo.git
cd video-streaming-platform/backend

# Option A: Full Setup with IIS (Recommended for Production)
# Installs Node.js, PM2, IIS, URL Rewrite, configures reverse proxy
.\scripts\windows-setup.ps1 -Domain "api.yourdomain.com"

# Then configure IIS reverse proxy
.\scripts\configure-iis-proxy.ps1 -Domain "api.yourdomain.com" -BackendPort 3001

# Option B: Simple Setup (PM2 only, no IIS)
# Just installs Node.js and PM2
.\scripts\windows-setup.ps1 -SetupIIS:$false

# Create .env file
copy .env.example .env
notepad .env  # Edit with production values

# Setup GitHub Actions self-hosted runner
# Go to: https://github.com/your-username/your-repo/settings/actions/runners/new
# Follow Windows installation steps
```

**IIS Benefits:** SSL termination, reverse proxy, professional Windows setup
**See:** [IIS Setup Guide](./IIS_SETUP.md) for detailed configuration

### Step 4: Setup Cloudflare Pages (10 min)

**In Cloudflare Dashboard:**

1. Go to **Workers & Pages** → **Create application** → **Pages**
2. Connect to GitHub repository
3. Configure build settings:
   - **Project name:** `footvault-frontend`
   - **Production branch:** `main`
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** `frontend`
4. Add environment variables (copy from GitHub Secrets)
5. Save and Deploy

**Configure DNS:**

1. Go to **DNS** → **Records**
2. Add records:
   ```
   Type    Name    Content                         Proxy
   CNAME   @       footvault-frontend.pages.dev    Proxied
   CNAME   www     footvault-frontend.pages.dev    Proxied
   A       api     YOUR_WINDOWS_VPS_IP             Proxied
   ```
3. Go to Pages project → **Custom domains** → Add `yourdomain.com`

### Step 5: Test Deployment (5 min)

```bash
# Make a small change
echo "# CI/CD Pipeline Active" >> README.md

# Commit and push
git add .
git commit -m "Test CI/CD deployment"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/your-username/your-repo/actions

# Frontend deploys to Cloudflare Pages
# Backend deploys to Windows VPS via PM2
```

**Verify deployment:**

```bash
# Check frontend
curl -I https://yourdomain.com

# Check backend
curl https://api.yourdomain.com/api/health
```

---

## 🎯 What Happens When You Push to Main?

```
1. You push code to main branch
   ↓
2. GitHub Actions detects changes
   ↓
3a. Frontend changed?              3b. Backend changed?
    ↓                                  ↓
    Build Next.js app                  Self-hosted runner picks up
    ↓                                  ↓
    Deploy to Cloudflare Pages         Build TypeScript
    ↓                                  ↓
    Live at yourdomain.com             PM2 restart (zero downtime)
                                       ↓
                                       Live at api.yourdomain.com
```

**Timeline:**
- Frontend: 3-5 minutes
- Backend: 2-3 minutes

---

## 📁 Quick File Reference

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-frontend.yml` | Frontend deployment workflow |
| `.github/workflows/deploy-backend.yml` | Backend deployment workflow |
| `.github/workflows/ci-checks.yml` | Linting and type checking |
| `backend/ecosystem.config.js` | PM2 configuration |
| `backend/scripts/deploy.ps1` | Manual deployment script |
| `backend/scripts/windows-setup.ps1` | VPS initial setup |
| `frontend/wrangler.toml` | Cloudflare Pages config |

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend build fails | Check Cloudflare Pages logs, verify env vars |
| Backend deploy fails | Check GitHub Actions logs, verify runner is online |
| CORS errors | Update `CORS_ORIGIN` in backend .env, restart PM2 |
| API returns 502 | Check `pm2 status`, restart if needed |
| DNS not resolving | Wait 5-10 minutes for propagation |

---

## 📖 Full Documentation

- **[Local Setup](./LOCAL_SETUP.md)** - Development environment
- **[Cloudflare Setup](./CLOUDFLARE_SETUP.md)** - Detailed Cloudflare configuration
- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment workflow

---

## ✅ Checklist: Is Everything Working?

- [ ] Push to main triggers GitHub Actions
- [ ] Frontend deploys to Cloudflare Pages
- [ ] Backend deploys to Windows VPS
- [ ] `https://yourdomain.com` loads correctly
- [ ] `https://api.yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] No CORS errors in browser console
- [ ] PM2 shows backend running: `pm2 status`

**If all checked - you're done! 🎉**

---

## 🎓 Next Steps

1. **Test your deployment:**
   - Sign up for an account
   - Browse videos
   - Test like/favorite features

2. **Set up monitoring:**
   - UptimeRobot for health checks
   - Cloudflare Analytics for traffic
   - PM2 logs for backend errors

3. **Start developing:**
   - Create feature branches
   - Make pull requests
   - Auto-deploy on merge to main

---

**Built by following the complete DevOps guide. Happy deploying! 🚀**
