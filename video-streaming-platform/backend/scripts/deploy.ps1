# Backend Deployment Script for Windows Server
# This script handles the deployment process for the backend application

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to backend directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptDir
Set-Location $BackendDir

Write-Host "`n[1/6] Pulling latest code from Git..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git pull failed"
    exit 1
}

Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm ci failed"
    exit 1
}

Write-Host "`n[3/6] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

Write-Host "`n[4/6] Creating logs directory..." -ForegroundColor Yellow
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "`n[5/6] Restarting PM2 process..." -ForegroundColor Yellow
pm2 restart ecosystem.config.js --env $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "PM2 restart failed"
    exit 1
}

Write-Host "`n[6/6] Saving PM2 configuration..." -ForegroundColor Yellow
pm2 save
if ($LASTEXITCODE -ne 0) {
    Write-Warning "PM2 save failed, but deployment continues"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Wait a moment for the app to start
Start-Sleep -Seconds 5

Write-Host "`nChecking application health..." -ForegroundColor Yellow
try {
    $port = $env:PORT
    if (-not $port) { $port = 3001 }
    $response = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "Health check passed - Application is running!" -ForegroundColor Green
    } else {
        Write-Warning "Health check returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Health check failed: $_"
    Write-Host "Check PM2 logs with: pm2 logs footvault-backend" -ForegroundColor Yellow
}

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  pm2 status                  - Check process status" -ForegroundColor White
Write-Host "  pm2 logs footvault-backend  - View logs" -ForegroundColor White
Write-Host "  pm2 restart footvault-backend - Restart app" -ForegroundColor White
Write-Host "  pm2 monit                   - Monitor resources" -ForegroundColor White
