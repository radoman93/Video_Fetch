# Windows Server Setup Script
# Run this script ONCE on your Windows VPS to set up the environment
# This script installs Node.js, PM2, IIS, and configures the production environment

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipNodeInstall = $false,

    [Parameter(Mandatory=$false)]
    [switch]$SetupIIS = $true,

    [Parameter(Mandatory=$false)]
    [string]$Domain = "",

    [Parameter(Mandatory=$false)]
    [switch]$SkipSSL = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows Server Setup for Backend" -ForegroundColor Cyan
Write-Host "Production-Grade Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will configure:" -ForegroundColor White
Write-Host "  - Node.js 20+" -ForegroundColor Gray
Write-Host "  - PM2 Process Manager" -ForegroundColor Gray
Write-Host "  - IIS Web Server (Reverse Proxy)" -ForegroundColor Gray
Write-Host "  - SSL/TLS Certificates" -ForegroundColor Gray
Write-Host "  - Windows Firewall Rules" -ForegroundColor Gray
Write-Host "  - GitHub Actions Runner" -ForegroundColor Gray
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Warning "This script should be run as Administrator for best results."
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit
    }
}

# 1. Install Node.js (if not skipped)
if (-not $SkipNodeInstall) {
    Write-Host "`n[1/7] Checking Node.js installation..." -ForegroundColor Yellow
    try {
        $nodeVersion = node --version
        Write-Host "Node.js is already installed: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "Node.js not found. Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Red
        Write-Host "After installation, re-run this script with -SkipNodeInstall flag" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "`n[1/7] Skipping Node.js installation check" -ForegroundColor Yellow
}

# 2. Install PM2 globally
Write-Host "`n[2/7] Installing PM2 globally..." -ForegroundColor Yellow
npm install -g pm2
if ($LASTEXITCODE -ne 0) {
    Write-Error "PM2 installation failed"
    exit 1
}
Write-Host "PM2 installed successfully" -ForegroundColor Green

# 3. Install pm2-windows-startup
Write-Host "`n[3/7] Setting up PM2 to run on Windows startup..." -ForegroundColor Yellow
npm install -g pm2-windows-startup
pm2-startup install
Write-Host "PM2 startup configuration completed" -ForegroundColor Green

# 4. Configure Windows Firewall
Write-Host "`n[4/11] Configuring Windows Firewall..." -ForegroundColor Yellow
try {
    # Allow HTTP (port 80)
    New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall rule added for port 80 (HTTP)" -ForegroundColor Green

    # Allow HTTPS (port 443)
    New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall rule added for port 443 (HTTPS)" -ForegroundColor Green

    # Allow port 3001 for backend API (direct access if needed)
    New-NetFirewallRule -DisplayName "Backend API - Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall rule added for port 3001 (Backend)" -ForegroundColor Green
} catch {
    Write-Warning "Failed to add firewall rules. You may need to add them manually."
}

# 5. Install IIS (if enabled)
if ($SetupIIS) {
    Write-Host "`n[5/11] Setting up IIS Web Server..." -ForegroundColor Yellow

    # Check if IIS is already installed
    $iisInstalled = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue

    if ($iisInstalled -and $iisInstalled.Installed) {
        Write-Host "IIS is already installed" -ForegroundColor Green
    } else {
        Write-Host "Installing IIS Web Server..." -ForegroundColor Yellow
        try {
            # Install IIS with required features
            Install-WindowsFeature -Name Web-Server -IncludeManagementTools
            Install-WindowsFeature -Name Web-WebSockets
            Install-WindowsFeature -Name Web-Http-Redirect
            Write-Host "IIS installed successfully" -ForegroundColor Green
        } catch {
            Write-Warning "Failed to install IIS. You may need to install it manually."
            $SetupIIS = $false
        }
    }

    # Install URL Rewrite Module
    if ($SetupIIS) {
        Write-Host "Checking URL Rewrite Module..." -ForegroundColor Yellow
        $urlRewriteInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue

        if (-not $urlRewriteInstalled) {
            Write-Host "URL Rewrite Module not found." -ForegroundColor Yellow
            Write-Host "Please download and install from:" -ForegroundColor White
            Write-Host "https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Cyan
            Write-Host ""
            $installUrlRewrite = Read-Host "Open download page now? (y/n)"
            if ($installUrlRewrite -eq 'y') {
                Start-Process "https://www.iis.net/downloads/microsoft/url-rewrite"
                Write-Host "After installing URL Rewrite, press Enter to continue..." -ForegroundColor Yellow
                Read-Host
            }
        } else {
            Write-Host "URL Rewrite Module is already installed" -ForegroundColor Green
        }
    }

    # Install Application Request Routing (ARR)
    if ($SetupIIS) {
        Write-Host "Checking Application Request Routing (ARR)..." -ForegroundColor Yellow
        $arrInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Application Request Routing" -ErrorAction SilentlyContinue

        if (-not $arrInstalled) {
            Write-Host "ARR not found. This is optional but recommended for advanced proxy features." -ForegroundColor Yellow
            Write-Host "Download from: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Cyan
            Write-Host ""
            $installARR = Read-Host "Open download page now? (y/n)"
            if ($installARR -eq 'y') {
                Start-Process "https://www.iis.net/downloads/microsoft/application-request-routing"
                Write-Host "After installing ARR (optional), press Enter to continue..." -ForegroundColor Yellow
                Read-Host
            }
        } else {
            Write-Host "Application Request Routing is already installed" -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n[5/11] Skipping IIS setup (use -SetupIIS to enable)" -ForegroundColor Yellow
}

# 6. Install Git (if not present)
Write-Host "`n[6/11] Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "Git is already installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found. Please install Git from https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "You'll need Git to pull code updates" -ForegroundColor Yellow
}

# 7. Create application directory structure
Write-Host "`n[7/11] Creating application directories..." -ForegroundColor Yellow
$appDir = "C:\Apps\footvault-backend"
if (-not (Test-Path $appDir)) {
    New-Item -ItemType Directory -Path $appDir -Force | Out-Null
    Write-Host "Created directory: $appDir" -ForegroundColor Green
} else {
    Write-Host "Directory already exists: $appDir" -ForegroundColor Yellow
}

# 8. Configure IIS Reverse Proxy
if ($SetupIIS -and $Domain) {
    Write-Host "`n[8/11] Configuring IIS Reverse Proxy..." -ForegroundColor Yellow
    Write-Host "Domain: $Domain" -ForegroundColor White

    # Import WebAdministration module
    Import-Module WebAdministration -ErrorAction SilentlyContinue

    # Create a new site for the API
    $siteName = "FootVault-API"
    $siteExists = Get-Website -Name $siteName -ErrorAction SilentlyContinue

    if (-not $siteExists) {
        Write-Host "Creating IIS site: $siteName" -ForegroundColor Yellow

        # Create site directory
        $sitePath = "C:\inetpub\wwwroot\footvault-api"
        if (-not (Test-Path $sitePath)) {
            New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
        }

        # Create new site
        New-Website -Name $siteName -PhysicalPath $sitePath -Port 80 -HostHeader $Domain
        Write-Host "IIS site created successfully" -ForegroundColor Green

        Write-Host ""
        Write-Host "IMPORTANT: IIS reverse proxy configuration will be created." -ForegroundColor Yellow
        Write-Host "After this script completes, run:" -ForegroundColor White
        Write-Host "  .\scripts\configure-iis-proxy.ps1 -Domain $Domain" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "IIS site '$siteName' already exists" -ForegroundColor Green
    }
} else {
    Write-Host "`n[8/11] Skipping IIS configuration (no domain specified)" -ForegroundColor Yellow
    Write-Host "To configure IIS reverse proxy later, run:" -ForegroundColor White
    Write-Host "  .\scripts\configure-iis-proxy.ps1 -Domain api.yourdomain.com" -ForegroundColor Cyan
}

# 9. Setup SSL Certificate
if ($SetupIIS -and $Domain -and -not $SkipSSL) {
    Write-Host "`n[9/11] SSL Certificate Setup" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SSL/TLS Certificate Options:" -ForegroundColor Cyan
    Write-Host "  1. Let's Encrypt (Free, recommended)" -ForegroundColor White
    Write-Host "  2. Cloudflare Origin Certificate (Free, if using Cloudflare)" -ForegroundColor White
    Write-Host "  3. Commercial Certificate (Paid)" -ForegroundColor White
    Write-Host "  4. Skip for now" -ForegroundColor White
    Write-Host ""
    Write-Host "Recommended: Use Cloudflare SSL/TLS (Full/Strict mode)" -ForegroundColor Green
    Write-Host "This provides free SSL with automatic renewal" -ForegroundColor Green
    Write-Host ""
    Write-Host "For Let's Encrypt, install win-acme:" -ForegroundColor Yellow
    Write-Host "  Download: https://www.win-acme.com/" -ForegroundColor Cyan
    Write-Host "  Run: wacs.exe --target iis" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "`n[9/11] Skipping SSL setup" -ForegroundColor Yellow
}

# 10. Install Windows Admin Center (Optional)
Write-Host "`n[10/11] Windows Admin Center (Optional)" -ForegroundColor Yellow
Write-Host "Windows Admin Center provides a web-based management interface." -ForegroundColor White
Write-Host "Download: https://www.microsoft.com/en-us/windows-server/windows-admin-center" -ForegroundColor Cyan
$installWAC = Read-Host "Would you like to open the download page? (y/n)"
if ($installWAC -eq 'y') {
    Start-Process "https://www.microsoft.com/en-us/windows-server/windows-admin-center"
}

# 11. Setup GitLab Runner (optional)
Write-Host "`n[11/11] GitLab Runner Setup" -ForegroundColor Yellow
Write-Host "To enable automatic deployments, you need to set up a GitLab Runner." -ForegroundColor White
Write-Host ""
Write-Host "GitLab Runner will execute CI/CD pipelines on this Windows server." -ForegroundColor Gray
Write-Host ""
$setupRunner = Read-Host "Would you like to install and configure GitLab Runner now? (y/n)"
if ($setupRunner -eq 'y') {
    Write-Host ""
    Write-Host "Starting GitLab Runner setup..." -ForegroundColor Yellow
    Write-Host ""

    # Get registration token
    Write-Host "You'll need a registration token from GitLab:" -ForegroundColor Cyan
    Write-Host "  1. Go to your GitLab project" -ForegroundColor White
    Write-Host "  2. Settings → CI/CD → Runners" -ForegroundColor White
    Write-Host "  3. Click 'New project runner'" -ForegroundColor White
    Write-Host "  4. Select 'Run untagged jobs' if you want" -ForegroundColor White
    Write-Host "  5. Copy the registration token" -ForegroundColor White
    Write-Host ""

    $runSetupScript = Read-Host "Do you have the registration token ready? (y/n)"
    if ($runSetupScript -eq 'y') {
        # Run GitLab Runner setup script
        $setupScriptPath = Join-Path (Split-Path -Parent $PSCommandPath) "setup-gitlab-runner.ps1"
        if (Test-Path $setupScriptPath) {
            & $setupScriptPath
        } else {
            Write-Warning "Setup script not found: $setupScriptPath"
            Write-Host "You can manually set up GitLab Runner later with:" -ForegroundColor Yellow
            Write-Host "  .\scripts\setup-gitlab-runner.ps1" -ForegroundColor Cyan
        }
    } else {
        Write-Host ""
        Write-Host "You can set up GitLab Runner later by running:" -ForegroundColor Yellow
        Write-Host "  .\scripts\setup-gitlab-runner.ps1" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Skipping GitLab Runner setup. You can set it up later by running:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-gitlab-runner.ps1" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Windows Server Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Clone your repository to $appDir" -ForegroundColor White
Write-Host "   cd $appDir" -ForegroundColor Gray
Write-Host "   git clone https://gitlab.com/YOUR_USERNAME/YOUR_REPO.git ." -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create .env file with your production secrets" -ForegroundColor White
Write-Host "   cp .env.example .env" -ForegroundColor Gray
Write-Host "   # Edit .env with your values" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run the deployment script" -ForegroundColor White
Write-Host "   .\scripts\deploy.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Set up GitLab Runner for automated deployments" -ForegroundColor White
Write-Host "   .\scripts\setup-gitlab-runner.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Important PM2 commands:" -ForegroundColor Cyan
Write-Host "  pm2 status                  - Check all processes" -ForegroundColor White
Write-Host "  pm2 logs                    - View logs" -ForegroundColor White
Write-Host "  pm2 restart all             - Restart all apps" -ForegroundColor White
Write-Host "  pm2 save                    - Save current process list" -ForegroundColor White
Write-Host ""

if ($SetupIIS) {
    Write-Host "IIS Management:" -ForegroundColor Cyan
    Write-Host "  iisreset                    - Restart IIS" -ForegroundColor White
    Write-Host "  Get-Website                 - List all websites" -ForegroundColor White
    Write-Host "  Start-Website -Name 'name'  - Start a website" -ForegroundColor White
    Write-Host "  Stop-Website -Name 'name'   - Stop a website" -ForegroundColor White
    Write-Host ""
    Write-Host "IIS Manager: Run 'inetmgr' to open GUI" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Next: Configure IIS Reverse Proxy" -ForegroundColor Yellow
Write-Host "  .\scripts\configure-iis-proxy.ps1 -Domain api.yourdomain.com -BackendPort 3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "View detailed IIS setup guide:" -ForegroundColor Yellow
Write-Host "  ..\docs\IIS_SETUP.md" -ForegroundColor Cyan
