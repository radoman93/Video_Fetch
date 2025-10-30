# GitLab Runner Setup Script for Windows
# This script installs and registers a GitLab Runner on Windows VPS

param(
    [Parameter(Mandatory=$false)]
    [string]$GitLabUrl = "https://gitlab.com",

    [Parameter(Mandatory=$false)]
    [string]$RegistrationToken = "",

    [Parameter(Mandatory=$false)]
    [string]$RunnerName = "windows-production",

    [Parameter(Mandatory=$false)]
    [string]$RunnerTags = "windows,production",

    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "C:\GitLab-Runner"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitLab Runner Setup for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Step 1: Create installation directory
Write-Host "[1/6] Creating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "Created directory: $InstallPath" -ForegroundColor Green
} else {
    Write-Host "Directory already exists: $InstallPath" -ForegroundColor Green
}

# Step 2: Download GitLab Runner
Write-Host "`n[2/6] Downloading GitLab Runner..." -ForegroundColor Yellow
$runnerExe = Join-Path $InstallPath "gitlab-runner.exe"

if (Test-Path $runnerExe) {
    Write-Host "GitLab Runner already downloaded" -ForegroundColor Green
    $update = Read-Host "Update to latest version? (y/n)"
    if ($update -ne 'y') {
        Write-Host "Skipping download" -ForegroundColor Yellow
        goto :SkipDownload
    }
}

try {
    $downloadUrl = "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe"
    Write-Host "Downloading from: $downloadUrl" -ForegroundColor Gray

    # Use WebClient for better progress
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $runnerExe)

    Write-Host "GitLab Runner downloaded successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to download GitLab Runner: $_"
    exit 1
}

:SkipDownload

# Step 3: Verify download
Write-Host "`n[3/6] Verifying GitLab Runner..." -ForegroundColor Yellow
try {
    $version = & $runnerExe --version
    Write-Host "GitLab Runner version:" -ForegroundColor Green
    Write-Host $version -ForegroundColor Gray
} catch {
    Write-Error "Failed to execute GitLab Runner. File may be corrupted."
    exit 1
}

# Step 4: Install GitLab Runner as a service
Write-Host "`n[4/6] Installing GitLab Runner as Windows service..." -ForegroundColor Yellow

# Check if service already exists
$service = Get-Service -Name "gitlab-runner" -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "GitLab Runner service already exists" -ForegroundColor Yellow
    $reinstall = Read-Host "Reinstall service? (y/n)"
    if ($reinstall -eq 'y') {
        Write-Host "Uninstalling existing service..." -ForegroundColor Yellow
        & $runnerExe uninstall
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Skipping service installation" -ForegroundColor Yellow
        goto :SkipInstall
    }
}

try {
    & $runnerExe install
    Write-Host "GitLab Runner installed as Windows service" -ForegroundColor Green
} catch {
    Write-Error "Failed to install GitLab Runner service: $_"
    exit 1
}

:SkipInstall

# Step 5: Register the runner
Write-Host "`n[5/6] Registering GitLab Runner..." -ForegroundColor Yellow

if (-not $RegistrationToken) {
    Write-Host ""
    Write-Host "To register the runner, you need a registration token:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "For project-specific runner:" -ForegroundColor White
    Write-Host "  1. Go to your GitLab project" -ForegroundColor Gray
    Write-Host "  2. Settings → CI/CD → Runners" -ForegroundColor Gray
    Write-Host "  3. Click 'New project runner'" -ForegroundColor Gray
    Write-Host "  4. Copy the registration token" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For group runner:" -ForegroundColor White
    Write-Host "  1. Go to your GitLab group" -ForegroundColor Gray
    Write-Host "  2. Settings → CI/CD → Runners" -ForegroundColor Gray
    Write-Host ""
    $RegistrationToken = Read-Host "Enter registration token"
}

if ($RegistrationToken) {
    Write-Host "Registering runner with tags: $RunnerTags" -ForegroundColor Yellow

    try {
        # Register the runner
        & $runnerExe register `
            --non-interactive `
            --url $GitLabUrl `
            --registration-token $RegistrationToken `
            --name $RunnerName `
            --tag-list $RunnerTags `
            --executor "shell" `
            --shell "powershell"

        Write-Host "GitLab Runner registered successfully" -ForegroundColor Green
    } catch {
        Write-Error "Failed to register GitLab Runner: $_"
        Write-Host ""
        Write-Host "You can manually register later with:" -ForegroundColor Yellow
        Write-Host "  cd $InstallPath" -ForegroundColor Gray
        Write-Host "  .\gitlab-runner.exe register" -ForegroundColor Gray
    }
} else {
    Write-Host "Skipping registration. You can register manually later." -ForegroundColor Yellow
}

# Step 6: Start the runner service
Write-Host "`n[6/6] Starting GitLab Runner service..." -ForegroundColor Yellow

try {
    Start-Service gitlab-runner
    $serviceStatus = Get-Service gitlab-runner

    if ($serviceStatus.Status -eq "Running") {
        Write-Host "✓ GitLab Runner service is running" -ForegroundColor Green
    } else {
        Write-Warning "GitLab Runner service status: $($serviceStatus.Status)"
    }
} catch {
    Write-Error "Failed to start GitLab Runner service: $_"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "GitLab Runner Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nInstallation Summary:" -ForegroundColor Cyan
Write-Host "  Installation Path: $InstallPath" -ForegroundColor White
Write-Host "  GitLab URL: $GitLabUrl" -ForegroundColor White
Write-Host "  Runner Name: $RunnerName" -ForegroundColor White
Write-Host "  Runner Tags: $RunnerTags" -ForegroundColor White
Write-Host "  Executor: shell (PowerShell)" -ForegroundColor White

Write-Host "`nService Status:" -ForegroundColor Cyan
$serviceStatus = Get-Service gitlab-runner
Write-Host "  Status: $($serviceStatus.Status)" -ForegroundColor White
Write-Host "  Startup Type: $($serviceStatus.StartType)" -ForegroundColor White

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "  List runners:" -ForegroundColor White
Write-Host "    .\gitlab-runner.exe list" -ForegroundColor Gray
Write-Host ""
Write-Host "  Verify runner:" -ForegroundColor White
Write-Host "    .\gitlab-runner.exe verify" -ForegroundColor Gray
Write-Host ""
Write-Host "  Check service status:" -ForegroundColor White
Write-Host "    Get-Service gitlab-runner" -ForegroundColor Gray
Write-Host ""
Write-Host "  Restart service:" -ForegroundColor White
Write-Host "    Restart-Service gitlab-runner" -ForegroundColor Gray
Write-Host ""
Write-Host "  View runner configuration:" -ForegroundColor White
Write-Host "    notepad $InstallPath\config.toml" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify runner appears in GitLab:" -ForegroundColor White
Write-Host "   Settings → CI/CD → Runners" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the pipeline:" -ForegroundColor White
Write-Host "   Push to main branch or create a merge request" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor runner activity:" -ForegroundColor White
Write-Host "   .\gitlab-runner.exe --debug run" -ForegroundColor Gray
Write-Host ""

Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "  View runner logs:" -ForegroundColor White
Write-Host "    Get-EventLog -LogName Application -Source gitlab-runner -Newest 50" -ForegroundColor Gray
Write-Host ""
Write-Host "  Re-register runner:" -ForegroundColor White
Write-Host "    .\gitlab-runner.exe register" -ForegroundColor Gray
Write-Host ""
Write-Host "  Uninstall runner:" -ForegroundColor White
Write-Host "    .\gitlab-runner.exe uninstall" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  GitLab Runner docs: https://docs.gitlab.com/runner/" -ForegroundColor Cyan
Write-Host "  Windows setup: https://docs.gitlab.com/runner/install/windows.html" -ForegroundColor Cyan
