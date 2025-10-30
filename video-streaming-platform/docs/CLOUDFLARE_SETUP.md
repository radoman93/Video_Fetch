# Cloudflare Setup Guide

This guide walks you through setting up Cloudflare for your video streaming platform, including Cloudflare Pages for the frontend and DNS/proxy configuration for the backend API.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Domain Setup](#domain-setup)
3. [Cloudflare Pages Setup](#cloudflare-pages-setup)
4. [DNS Configuration](#dns-configuration)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [GitHub Integration](#github-integration)
7. [Environment Variables](#environment-variables)

---

## Prerequisites

- A Cloudflare account (free tier works fine)
- Your domain registered and nameservers pointed to Cloudflare
- GitHub repository with your frontend code
- Windows VPS with a public IP address

## Domain Setup

### 1. Add Your Domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Add a Site"**
3. Enter your domain name (e.g., `yourdomain.com`)
4. Select the **Free** plan (or higher if needed)
5. Cloudflare will scan your DNS records

### 2. Update Nameservers

1. Cloudflare will provide you with 2 nameservers (e.g., `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Update the nameservers to the ones provided by Cloudflare
4. Wait for propagation (can take up to 24 hours, usually faster)

---

## Cloudflare Pages Setup

### 1. Create a Cloudflare Pages Project

1. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages**
2. Click **"Connect to Git"**
3. Authorize Cloudflare to access your GitHub account
4. Select your repository: `your-username/your-repo`
5. Configure build settings:
   - **Project name:** `footvault-frontend` (or your preferred name)
   - **Production branch:** `main`
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** `frontend`

### 2. Configure Environment Variables

In the Pages project settings, add the following environment variables:

#### Production Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_ADS_ENABLED=true
NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID=your_exoclick_account_id
```

Add all other ExoClick zone IDs as needed (see `.env.local.example` for full list).

### 3. Trigger First Deployment

1. Click **"Save and Deploy"**
2. Cloudflare will automatically build and deploy your site
3. You'll get a URL like `footvault-frontend.pages.dev`

---

## DNS Configuration

Set up DNS records to point your domain to your services.

### DNS Records to Add

Go to **DNS** → **Records** in your Cloudflare dashboard:

#### 1. Root Domain (Frontend)
- **Type:** `CNAME`
- **Name:** `@`
- **Target:** `footvault-frontend.pages.dev` (your Pages URL)
- **Proxy status:** Proxied (orange cloud)

#### 2. www Subdomain (Frontend)
- **Type:** `CNAME`
- **Name:** `www`
- **Target:** `footvault-frontend.pages.dev`
- **Proxy status:** Proxied (orange cloud)

#### 3. API Subdomain (Backend)
- **Type:** `A`
- **Name:** `api`
- **IPv4 address:** `YOUR_WINDOWS_VPS_IP_ADDRESS`
- **Proxy status:** Proxied (orange cloud) - **Recommended for DDoS protection**
- **TTL:** Auto

**Example:**
```
Type    Name    Content                          Proxy
CNAME   @       footvault-frontend.pages.dev     Proxied
CNAME   www     footvault-frontend.pages.dev     Proxied
A       api     123.45.67.89                     Proxied
```

### Custom Domain for Pages

1. In your Pages project, go to **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain: `yourdomain.com`
4. Cloudflare will automatically configure DNS if not already set
5. Add `www.yourdomain.com` as well (optional but recommended)

---

## SSL/TLS Configuration

### 1. Enable Full (Strict) SSL

1. Go to **SSL/TLS** → **Overview**
2. Select **Full (strict)** encryption mode
3. This ensures end-to-end encryption between Cloudflare and your origin server

### 2. Enable Always Use HTTPS

1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **"Always Use HTTPS"**
3. This redirects all HTTP requests to HTTPS

### 3. Enable HTTP Strict Transport Security (HSTS)

1. In **SSL/TLS** → **Edge Certificates**
2. Enable **HSTS**
3. Recommended settings:
   - **Max Age:** 6 months
   - **Include subdomains:** Yes
   - **Preload:** Yes (optional)

---

## Backend API Proxy Configuration

Since your backend runs on `api.yourdomain.com`, we need to ensure it properly proxies to your Windows VPS.

### Option 1: IIS Reverse Proxy (Recommended for Windows)

**Best for:** Production Windows environments with SSL requirements

With the DNS A record set to Proxied (orange cloud), Cloudflare provides:
- DDoS protection
- SSL termination (Cloudflare to client)
- Global CDN

IIS on your Windows VPS provides:
- SSL termination (Cloudflare to IIS)
- Reverse proxy to Node.js backend (PM2)
- Additional security layer
- Professional Windows integration

**Setup:**

1. **Install IIS and required modules:**
   ```powershell
   cd C:\Apps\footvault-backend\backend
   .\scripts\windows-setup.ps1 -Domain "api.yourdomain.com"
   ```

2. **Configure reverse proxy:**
   ```powershell
   .\scripts\configure-iis-proxy.ps1 -Domain "api.yourdomain.com" -BackendPort 3001
   ```

3. **Install Cloudflare Origin Certificate** (for Full Strict mode):
   - Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
   - Download certificate (.pem) and private key (.key)
   - Convert to PFX and install in Windows
   - Bind to IIS site

**Full guide:** [IIS Setup Documentation](./IIS_SETUP.md)

### Option 2: Direct PM2 Access (Simpler, Less Secure)

**Best for:** Development or when using Cloudflare Tunnel

Backend listens directly on port 3001, exposed through firewall:
```powershell
# Allow backend port through firewall
New-NetFirewallRule -DisplayName "Backend API" `
    -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Note:** Cloudflare will proxy to `http://YOUR_VPS_IP:3001`

**Limitations:**
- No SSL between Cloudflare and origin (use SSL mode: Full, not Full Strict)
- Backend port directly exposed
- Less professional setup

### Option 3: Cloudflare Tunnel (Most Secure, No Public IP)

**Best for:** Maximum security, hiding origin IP completely

For enhanced security without exposing your VPS IP:

1. Install `cloudflared` on your Windows VPS:
   ```powershell
   # Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. Authenticate and create a tunnel:
   ```powershell
   cloudflared tunnel login
   cloudflared tunnel create footvault-backend
   ```

3. Configure the tunnel (create `config.yml`):
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: C:\Users\admin\.cloudflared\YOUR_TUNNEL_ID.json

   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:3001
     - service: http_status:404
   ```

4. Run the tunnel:
   ```powershell
   cloudflared tunnel run footvault-backend
   ```

5. Route DNS to tunnel:
   ```powershell
   cloudflared tunnel route dns footvault-backend api.yourdomain.com
   ```

---

## GitLab CI/CD Integration

### GitLab CI/CD Variables Configuration

Add the following variables to your GitLab project:

1. Go to **Settings** → **CI/CD** → **Variables**
2. Click **"Add variable"** for each:

#### Required Variables

| Variable | Value | Protected | Masked |
|----------|-------|-----------|---------|
| `CLOUDFLARE_API_TOKEN` | your_cloudflare_api_token | ✅ Yes | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | your_cloudflare_account_id | ✅ Yes | ❌ No |
| `CLOUDFLARE_PROJECT_NAME` | footvault-frontend | ❌ No | ❌ No |
| `DOMAIN` | yourdomain.com | ❌ No | ❌ No |
| `NEXT_PUBLIC_API_URL` | https://api.yourdomain.com | ❌ No | ❌ No |
| `NEXT_PUBLIC_SUPABASE_URL` | https://your-prod-project.supabase.co | ❌ No | ❌ No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your_production_anon_key | ✅ Yes | ✅ Yes |
| `SUPABASE_URL` | https://your-prod-project.supabase.co | ✅ Yes | ❌ No |
| `SUPABASE_SERVICE_KEY` | your_service_role_key | ✅ Yes | ✅ Yes |
| `PORT` | 3001 | ❌ No | ❌ No |
| `CORS_ORIGIN` | https://yourdomain.com,https://www.yourdomain.com | ❌ No | ❌ No |

**Notes:**
- **Protected**: Variable only available in protected branches (main)
- **Masked**: Variable value hidden in job logs

### Getting Cloudflare API Token

1. Go to **My Profile** → **API Tokens**
2. Click **"Create Token"**
3. Use template **"Edit Cloudflare Workers"** or create custom token with:
   - **Permissions:**
     - Account - Cloudflare Pages - Edit
   - **Account Resources:**
     - Include - Your Account
4. Create token and copy it immediately (you won't see it again)

### Getting Cloudflare Account ID

1. Go to **Workers & Pages** → **Overview**
2. On the right sidebar, you'll see **Account ID**
3. Copy and save it

---

## Testing Your Setup

### 1. Test Frontend Deployment

```bash
# Push to main branch
git add .
git commit -m "Test deployment"
git push origin main

# Check deployment status
# Go to Cloudflare Pages dashboard and monitor build
```

Visit `https://yourdomain.com` - you should see your frontend.

### 2. Test Backend API

```bash
# SSH or RDP into your Windows VPS
# Ensure backend is running on port 3001
pm2 status

# Test local access
curl http://localhost:3001/api/health

# Test from external
curl https://api.yourdomain.com/api/health
```

### 3. Test CORS

From your frontend, try making an API call. Check browser console for any CORS errors.

If you see CORS errors:
1. Verify `CORS_ORIGIN` in backend `.env` includes your frontend URL
2. Restart the backend: `pm2 restart footvault-backend`

---

## Troubleshooting

### Frontend not loading
- Check Cloudflare Pages build logs
- Verify environment variables are set correctly
- Check DNS records are pointing to Pages URL
- Clear browser cache

### Backend API not accessible
- Verify Windows VPS firewall allows port 3001 (or 80/443)
- Check if backend is running: `pm2 status`
- Verify DNS A record points to correct IP
- Check SSL/TLS mode is set to Full (strict)

### CORS errors
- Add all frontend URLs to `CORS_ORIGIN` in backend `.env`
- Include both `https://yourdomain.com` and `https://www.yourdomain.com`
- Restart backend after changes

### SSL errors
- Ensure SSL/TLS mode is Full (strict)
- Verify HTTPS is enabled on both frontend and backend
- Check Cloudflare SSL certificate is active

---

## Next Steps

✅ Your Cloudflare setup is complete!

Now proceed to:
1. [Deployment Workflow](./DEPLOYMENT.md) - Learn how to deploy updates
2. [Local Development Setup](./LOCAL_SETUP.md) - Set up your local environment

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
