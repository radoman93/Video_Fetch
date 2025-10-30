# IIS Setup Guide for Windows VPS

Complete guide for setting up IIS (Internet Information Services) as a reverse proxy for your Node.js backend on Windows Server.

## Table of Contents
1. [Why Use IIS?](#why-use-iis)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Quick Setup](#quick-setup)
5. [Detailed Configuration](#detailed-configuration)
6. [SSL/TLS Certificates](#ssltls-certificates)
7. [Performance Tuning](#performance-tuning)
8. [Troubleshooting](#troubleshooting)
9. [Alternative: Direct PM2 Access](#alternative-direct-pm2-access)

---

## Why Use IIS?

### Benefits of IIS as Reverse Proxy

✅ **Native Windows Integration** - Built into Windows Server
✅ **SSL/TLS Termination** - Handles HTTPS, backend stays HTTP
✅ **Better Performance** - Optimized for Windows
✅ **Load Balancing** - Built-in ARR for multiple backends
✅ **Static File Serving** - Efficient handling of static content
✅ **Logging & Monitoring** - Comprehensive IIS logs
✅ **Security** - Additional security layer, request filtering
✅ **Professional** - Standard in enterprise Windows environments

### When to Use IIS vs Direct PM2

| Scenario | Recommended Setup |
|----------|-------------------|
| Production with SSL | **IIS** (handles SSL termination) |
| Multiple domains/sites | **IIS** (easier management) |
| Enterprise environment | **IIS** (standard practice) |
| Simple dev/test | **Direct PM2** (simpler) |
| Behind Cloudflare Tunnel | **Direct PM2** (no SSL needed) |

---

## Architecture Overview

### IIS Reverse Proxy Architecture

```
Internet
   │
   ▼
Cloudflare CDN (SSL/TLS)
   │
   ▼
Windows Server Firewall (Ports 80, 443)
   │
   ▼
IIS Web Server (Port 80/443)
   │
   ├─ SSL/TLS Termination
   ├─ URL Rewrite (Reverse Proxy)
   ├─ Request Filtering
   └─ Logging
   │
   ▼
PM2 Process Manager
   │
   ▼
Node.js Backend (localhost:3001)
   │
   ▼
Supabase Database
```

### Request Flow

1. **Client** → `https://api.yourdomain.com/api/health`
2. **Cloudflare** → Proxies to Windows VPS IP
3. **IIS** → Receives HTTPS request, terminates SSL
4. **URL Rewrite** → Forwards to `http://localhost:3001/api/health`
5. **PM2/Node.js** → Processes request, returns response
6. **IIS** → Returns response to client (encrypted with SSL)

---

## Prerequisites

Before starting:

- [ ] Windows Server 2016+ (or Windows 10/11 Pro)
- [ ] Administrator access
- [ ] Domain name pointing to your server IP
- [ ] Node.js and PM2 installed
- [ ] Backend running on port 3001

---

## Quick Setup

### Option 1: Automated Setup (Recommended)

```powershell
# RDP into your Windows VPS
cd C:\Apps\footvault-backend\backend

# Run setup script with IIS and domain
.\scripts\windows-setup.ps1 -Domain "api.yourdomain.com"

# Configure reverse proxy
.\scripts\configure-iis-proxy.ps1 -Domain "api.yourdomain.com" -BackendPort 3001
```

### Option 2: Manual Setup

See [Detailed Configuration](#detailed-configuration) section below.

---

## Detailed Configuration

### Step 1: Install IIS

#### Via PowerShell (Recommended)

```powershell
# Install IIS with management tools
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

# Install additional features
Install-WindowsFeature -Name Web-WebSockets
Install-WindowsFeature -Name Web-Http-Redirect

# Verify installation
Get-WindowsFeature -Name Web-Server
```

#### Via Server Manager (GUI)

1. Open **Server Manager**
2. Click **Add roles and features**
3. Select **Web Server (IIS)**
4. Include:
   - Web Server
   - Management Tools
   - WebSockets Protocol
   - HTTP Redirection
5. Install

### Step 2: Install URL Rewrite Module

**Required for reverse proxy functionality**

1. Download: [URL Rewrite 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Run installer: `rewrite_amd64_en-US.msi`
3. Accept defaults and install
4. Restart IIS: `iisreset`

Verify installation:
```powershell
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite"
```

### Step 3: Install Application Request Routing (Optional)

**Recommended for advanced proxy features**

1. Download: [ARR 3.0](https://www.iis.net/downloads/microsoft/application-request-routing)
2. Run installer: `requestRouter_amd64.msi`
3. Accept defaults and install
4. Restart IIS: `iisreset`

**Enable proxy in ARR:**
```powershell
# Enable proxy functionality
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/proxy" -Name "enabled" -Value "True"

# Set timeout (10 minutes for long-running requests)
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/proxy" -Name "timeout" -Value "00:10:00"

# Preserve host header
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/proxy" -Name "preserveHostHeader" -Value "True"
```

### Step 4: Create IIS Site

#### Via PowerShell

```powershell
# Import IIS module
Import-Module WebAdministration

# Create site directory
$sitePath = "C:\inetpub\wwwroot\footvault-api"
New-Item -ItemType Directory -Path $sitePath -Force

# Create IIS site
New-Website -Name "FootVault-API" `
    -PhysicalPath $sitePath `
    -Port 80 `
    -HostHeader "api.yourdomain.com"

# Start the site
Start-Website -Name "FootVault-API"
```

#### Via IIS Manager (GUI)

1. Open IIS Manager: `inetmgr`
2. Right-click **Sites** → **Add Website**
3. Fill in:
   - **Site name:** FootVault-API
   - **Physical path:** `C:\inetpub\wwwroot\footvault-api`
   - **Binding:**
     - Type: http
     - IP address: All Unassigned
     - Port: 80
     - Host name: api.yourdomain.com
4. Click **OK**

### Step 5: Configure Reverse Proxy

Create **web.config** in site directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <!-- URL Rewrite Rules -->
        <rewrite>
            <rules>
                <!-- Reverse Proxy to Node.js Backend -->
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                        <set name="HTTP_X_REAL_IP" value="{REMOTE_ADDR}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>

        <!-- Security Settings -->
        <security>
            <requestFiltering>
                <!-- Allow up to 2GB requests (for video uploads) -->
                <requestLimits maxAllowedContentLength="2147483648" />
            </requestFiltering>
        </security>

        <!-- Pass through errors from backend -->
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
```

**PowerShell method:**

```powershell
cd C:\Apps\footvault-backend\backend
.\scripts\configure-iis-proxy.ps1 -Domain "api.yourdomain.com" -BackendPort 3001
```

### Step 6: Configure Firewall

```powershell
# Allow HTTP (port 80)
New-NetFirewallRule -DisplayName "HTTP Inbound" `
    -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "HTTPS Inbound" `
    -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### Step 7: Test Configuration

```powershell
# Ensure backend is running
pm2 status

# Test locally (on Windows VPS)
curl http://localhost/api/health
curl http://localhost:3001/api/health

# Should return same response from both

# Test from external (on your local machine)
curl http://api.yourdomain.com/api/health
```

---

## SSL/TLS Certificates

### Option 1: Cloudflare SSL (Recommended - Easiest)

**Best for:** Sites using Cloudflare DNS

1. In Cloudflare Dashboard:
   - Set SSL/TLS mode to **Full** or **Full (Strict)**
   - Enable **Always Use HTTPS**
   - Edge Certificates will be auto-managed

2. For Full (Strict), install Cloudflare Origin Certificate:
   ```
   a. Cloudflare Dashboard → SSL/TLS → Origin Server
   b. Create Certificate (15-year validity)
   c. Download certificate (.pem) and private key (.key)
   ```

3. Install in Windows:
   ```powershell
   # Convert PEM to PFX
   # Install OpenSSL first: https://slproweb.com/products/Win32OpenSSL.html

   openssl pkcs12 -export `
       -out cloudflare-cert.pfx `
       -inkey privkey.key `
       -in cert.pem `
       -password pass:YourPassword

   # Import to Windows Certificate Store
   Import-PfxCertificate -FilePath cloudflare-cert.pfx `
       -CertStoreLocation Cert:\LocalMachine\My `
       -Password (ConvertTo-SecureString -String "YourPassword" -AsPlainText -Force)
   ```

4. Bind to IIS site:
   ```powershell
   # Get certificate thumbprint
   Get-ChildItem Cert:\LocalMachine\My | Select Subject, Thumbprint

   # Add HTTPS binding
   New-WebBinding -Name "FootVault-API" `
       -Protocol "https" -Port 443 `
       -HostHeader "api.yourdomain.com" -SslFlags 1

   # Bind certificate (replace THUMBPRINT)
   $cert = Get-ChildItem Cert:\LocalMachine\My |
       Where-Object { $_.Thumbprint -eq "YOUR_CERT_THUMBPRINT" }

   $binding = Get-WebBinding -Name "FootVault-API" -Protocol "https"
   $binding.AddSslCertificate($cert.Thumbprint, "my")
   ```

### Option 2: Let's Encrypt (Free - Automatic Renewal)

**Best for:** Self-managed SSL without Cloudflare

1. Download **win-acme** (ACME client for Windows):
   ```
   https://www.win-acme.com/
   ```

2. Run win-acme:
   ```powershell
   # Extract to C:\Program Files\win-acme
   cd "C:\Program Files\win-acme"

   # Run interactive setup
   .\wacs.exe

   # Follow prompts:
   # - Choose: "Create certificate (default settings)"
   # - Binding: "IIS"
   # - Site: Select your FootVault-API site
   # - Accept defaults for certificate store
   ```

3. win-acme will:
   - Request certificate from Let's Encrypt
   - Validate domain ownership (HTTP challenge)
   - Install certificate in Windows Store
   - Bind to IIS site
   - Set up automatic renewal (scheduled task)

4. Verify:
   ```powershell
   # Check scheduled task
   Get-ScheduledTask -TaskName "win-acme*"

   # Test HTTPS
   curl https://api.yourdomain.com/api/health
   ```

### Option 3: Commercial Certificate

1. Purchase certificate from CA (DigiCert, GlobalSign, etc.)
2. Generate CSR in IIS Manager:
   - Server Certificates → Create Certificate Request
3. Submit CSR to CA
4. Receive certificate files (.cer, .crt)
5. Complete Certificate Request in IIS Manager
6. Bind to site

### Configure HTTP to HTTPS Redirect

Add to **web.config** (before existing rules):

```xml
<rule name="HTTP to HTTPS redirect" stopProcessing="true">
    <match url="(.*)" />
    <conditions>
        <add input="{HTTPS}" pattern="off" ignoreCase="true" />
    </conditions>
    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

---

## Performance Tuning

### IIS Application Pool Settings

```powershell
# Increase queue length for high traffic
Set-ItemProperty "IIS:\AppPools\DefaultAppPool" -Name queueLength -Value 5000

# Configure recycling
Set-ItemProperty "IIS:\AppPools\DefaultAppPool" -Name recycling.periodicRestart.time -Value "00:00:00"

# Set idle timeout (keep alive)
Set-ItemProperty "IIS:\AppPools\DefaultAppPool" -Name processModel.idleTimeout -Value "00:00:00"

# Maximum worker processes (for multi-core servers)
Set-ItemProperty "IIS:\AppPools\DefaultAppPool" -Name processModel.maxProcesses -Value 2
```

### Enable Compression

```powershell
# Enable static compression
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/httpCompression" `
    -Name "staticCompressionEnableCpuUsage" -Value 90

# Enable dynamic compression
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/httpCompression/dynamicTypes" `
    -Name "add[@mimeType='application/json'].enabled" -Value "True"
```

### Logging Configuration

**Reduce log size:**

```powershell
# Set log file rollover (daily)
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.applicationHost/sites/siteDefaults/logFile" `
    -Name "period" -Value "Daily"

# Set log location
Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.applicationHost/sites/siteDefaults/logFile" `
    -Name "directory" -Value "C:\inetpub\logs\LogFiles"
```

---

## Troubleshooting

### Common Issues

#### Issue 1: 502 Bad Gateway

**Symptom:** IIS returns 502 error

**Causes & Solutions:**

1. **Backend not running**
   ```powershell
   pm2 status
   pm2 restart footvault-backend
   ```

2. **Wrong backend port**
   - Check web.config: `url="http://localhost:3001/{R:1}"`
   - Verify backend port in .env: `PORT=3001`

3. **ARR proxy not enabled**
   ```powershell
   Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
       -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
   ```

#### Issue 2: URL Rewrite Not Working

**Symptom:** IIS serves default page instead of proxying

**Solution:**
- Verify URL Rewrite module installed:
  ```powershell
  Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite"
  ```
- Reinstall if needed: https://www.iis.net/downloads/microsoft/url-rewrite
- Restart IIS: `iisreset`

#### Issue 3: SSL Certificate Errors

**Symptom:** HTTPS connection fails or shows warnings

**Solutions:**

1. **Check certificate binding**
   ```powershell
   Get-WebBinding -Name "FootVault-API"
   ```

2. **Verify certificate in store**
   ```powershell
   Get-ChildItem Cert:\LocalMachine\My | Select Subject, Thumbprint, NotAfter
   ```

3. **Rebind certificate**
   ```powershell
   # Remove old binding
   Remove-WebBinding -Name "FootVault-API" -Protocol "https"

   # Add new binding
   New-WebBinding -Name "FootVault-API" -Protocol "https" -Port 443
   ```

#### Issue 4: CORS Errors

**Symptom:** Frontend shows CORS errors in console

**Solution:**

Update backend CORS configuration (`backend/src/server.ts`):

```typescript
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
  credentials: true,
};
```

Restart backend:
```powershell
pm2 restart footvault-backend
```

### Diagnostic Commands

```powershell
# Check IIS service status
Get-Service W3SVC

# List all websites
Get-Website

# View application pools
Get-IISAppPool

# Check specific site status
Get-Website -Name "FootVault-API"

# View IIS logs (latest)
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\u_ex$(Get-Date -Format 'yyMMdd').log" -Tail 50

# Check backend logs
pm2 logs footvault-backend --lines 50

# Test backend directly
curl http://localhost:3001/api/health

# Test through IIS
curl http://localhost/api/health
```

### IIS Reset Commands

```powershell
# Restart IIS completely
iisreset

# Stop IIS
iisreset /stop

# Start IIS
iisreset /start

# Restart specific site
Restart-WebAppPool -Name "DefaultAppPool"
Stop-Website -Name "FootVault-API"
Start-Website -Name "FootVault-API"
```

---

## Alternative: Direct PM2 Access

If you prefer **not** to use IIS (simpler setup):

### Setup

1. **Configure PM2** to listen on port 80/443 (requires privileges):
   ```javascript
   // ecosystem.config.js
   env_production: {
     PORT: 80,  // or 443 for HTTPS
   }
   ```

2. **Allow Node.js to bind to privileged ports:**
   ```powershell
   # Run PM2 as Administrator or use port forwarding
   netsh interface portproxy add v4tov4 `
       listenport=80 connectport=3001 `
       listenaddress=0.0.0.0 connectaddress=127.0.0.1
   ```

3. **Configure firewall:**
   ```powershell
   New-NetFirewallRule -DisplayName "Node.js Backend" `
       -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

### When to Use Direct Access

- ✅ Development/testing environments
- ✅ Behind Cloudflare Tunnel (handles SSL)
- ✅ Simple deployment with no SSL requirements
- ❌ Production with SSL (use IIS instead)
- ❌ Multiple domains/applications (use IIS)

---

## Summary

### Recommended Setup for Production

1. **IIS** as reverse proxy (ports 80/443)
2. **PM2** running backend (localhost:3001)
3. **Cloudflare** for DNS and SSL/TLS
4. **Full (Strict)** SSL mode in Cloudflare
5. **Origin Certificate** installed in IIS

### Quick Command Reference

| Task | Command |
|------|---------|
| Restart IIS | `iisreset` |
| View sites | `Get-Website` |
| Start site | `Start-Website -Name "FootVault-API"` |
| View logs | `Get-Content C:\inetpub\logs\LogFiles\...\*.log -Tail 50` |
| Test proxy | `curl http://localhost/api/health` |
| PM2 status | `pm2 status` |
| PM2 logs | `pm2 logs footvault-backend` |

---

**For additional help, see:**
- [Cloudflare Setup Guide](./CLOUDFLARE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./DEPLOYMENT.md#troubleshooting)
