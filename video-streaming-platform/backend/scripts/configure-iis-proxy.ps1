# IIS Reverse Proxy Configuration Script
# This script configures IIS as a reverse proxy for the Node.js backend

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,

    [Parameter(Mandatory=$false)]
    [int]$BackendPort = 3001,

    [Parameter(Mandatory=$false)]
    [string]$SiteName = "FootVault-API",

    [Parameter(Mandatory=$false)]
    [switch]$EnableHTTPS = $true,

    [Parameter(Mandatory=$false)]
    [string]$CertificateThumbprint = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IIS Reverse Proxy Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Domain: $Domain" -ForegroundColor Gray
Write-Host "  Backend Port: $BackendPort" -ForegroundColor Gray
Write-Host "  Site Name: $SiteName" -ForegroundColor Gray
Write-Host "  HTTPS: $EnableHTTPS" -ForegroundColor Gray
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Import required modules
Import-Module WebAdministration

# 1. Check if site exists
Write-Host "[1/7] Checking IIS site..." -ForegroundColor Yellow
$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue

if (-not $site) {
    Write-Host "Site '$SiteName' not found. Creating..." -ForegroundColor Yellow

    # Create site directory
    $sitePath = "C:\inetpub\wwwroot\$SiteName"
    if (-not (Test-Path $sitePath)) {
        New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
    }

    # Create new site
    New-Website -Name $SiteName -PhysicalPath $sitePath -Port 80 -HostHeader $Domain
    Write-Host "Site created successfully" -ForegroundColor Green
} else {
    Write-Host "Site '$SiteName' found" -ForegroundColor Green
}

# 2. Check for URL Rewrite Module
Write-Host "`n[2/7] Checking URL Rewrite Module..." -ForegroundColor Yellow
$urlRewriteInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue

if (-not $urlRewriteInstalled) {
    Write-Error "URL Rewrite Module is not installed. Please install it first:"
    Write-Host "https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Cyan
    exit 1
}
Write-Host "URL Rewrite Module is installed" -ForegroundColor Green

# 3. Create web.config with reverse proxy rules
Write-Host "`n[3/7] Creating web.config..." -ForegroundColor Yellow
$sitePath = (Get-Website -Name $SiteName).physicalPath
$webConfigPath = Join-Path $sitePath "web.config"

$webConfigContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:$BackendPort/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                        <set name="HTTP_X_REAL_IP" value="{REMOTE_ADDR}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="2147483648" />
            </requestFiltering>
        </security>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
"@

$webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8 -Force
Write-Host "web.config created at: $webConfigPath" -ForegroundColor Green

# 4. Configure Application Request Routing (if installed)
Write-Host "`n[4/7] Configuring Application Request Routing..." -ForegroundColor Yellow
$arrInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Application Request Routing" -ErrorAction SilentlyContinue

if ($arrInstalled) {
    try {
        # Enable proxy
        Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "enabled" -Value "True"

        # Increase timeout for long-running requests
        Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "timeout" -Value "00:10:00"

        # Preserve host header
        Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" -Filter "system.webServer/proxy" -Name "preserveHostHeader" -Value "True"

        Write-Host "ARR configured successfully" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to configure ARR: $_"
    }
} else {
    Write-Host "ARR not installed (optional)" -ForegroundColor Yellow
}

# 5. Configure HTTPS binding (if certificate provided)
if ($EnableHTTPS -and $CertificateThumbprint) {
    Write-Host "`n[5/7] Configuring HTTPS binding..." -ForegroundColor Yellow

    # Check if HTTPS binding exists
    $httpsBinding = Get-WebBinding -Name $SiteName -Protocol "https" -ErrorAction SilentlyContinue

    if (-not $httpsBinding) {
        New-WebBinding -Name $SiteName -Protocol "https" -Port 443 -HostHeader $Domain -SslFlags 1

        # Bind certificate
        $cert = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Thumbprint -eq $CertificateThumbprint }

        if ($cert) {
            $binding = Get-WebBinding -Name $SiteName -Protocol "https"
            $binding.AddSslCertificate($CertificateThumbprint, "my")
            Write-Host "HTTPS binding configured with certificate" -ForegroundColor Green
        } else {
            Write-Warning "Certificate with thumbprint $CertificateThumbprint not found"
        }
    } else {
        Write-Host "HTTPS binding already exists" -ForegroundColor Green
    }
} elseif ($EnableHTTPS) {
    Write-Host "`n[5/7] HTTPS enabled but no certificate provided" -ForegroundColor Yellow
    Write-Host "To add SSL certificate:" -ForegroundColor White
    Write-Host "  1. Install certificate in Local Machine -> Personal" -ForegroundColor Gray
    Write-Host "  2. Run: Get-ChildItem Cert:\LocalMachine\My" -ForegroundColor Gray
    Write-Host "  3. Copy certificate thumbprint" -ForegroundColor Gray
    Write-Host "  4. Re-run this script with -CertificateThumbprint <thumbprint>" -ForegroundColor Gray
} else {
    Write-Host "`n[5/7] Skipping HTTPS configuration" -ForegroundColor Yellow
}

# 6. Configure HTTP to HTTPS redirect (if HTTPS enabled)
if ($EnableHTTPS) {
    Write-Host "`n[6/7] Configuring HTTP to HTTPS redirect..." -ForegroundColor Yellow

    # Update web.config with redirect rule
    $webConfigContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="HTTP to HTTPS redirect" stopProcessing="true">
                    <match url="(.*)" />
                    <conditions>
                        <add input="{HTTPS}" pattern="off" ignoreCase="true" />
                    </conditions>
                    <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
                </rule>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:$BackendPort/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_FORWARDED_PROTO" value="https" />
                        <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
                        <set name="HTTP_X_REAL_IP" value="{REMOTE_ADDR}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="2147483648" />
            </requestFiltering>
        </security>
        <httpErrors existingResponse="PassThrough" />
    </system.webServer>
</configuration>
"@

    $webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8 -Force
    Write-Host "HTTP to HTTPS redirect configured" -ForegroundColor Green
} else {
    Write-Host "`n[6/7] Skipping HTTP to HTTPS redirect" -ForegroundColor Yellow
}

# 7. Restart IIS site
Write-Host "`n[7/7] Restarting IIS site..." -ForegroundColor Yellow
Restart-WebAppPool -Name "DefaultAppPool"
Stop-Website -Name $SiteName
Start-Sleep -Seconds 2
Start-Website -Name $SiteName
Write-Host "IIS site restarted" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "IIS Reverse Proxy Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
Write-Host "  Site Name: $SiteName" -ForegroundColor White
Write-Host "  Domain: $Domain" -ForegroundColor White
Write-Host "  Backend: http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  HTTP Binding: Port 80" -ForegroundColor White
if ($EnableHTTPS) {
    Write-Host "  HTTPS Binding: Port 443" -ForegroundColor White
}
Write-Host "  web.config: $webConfigPath" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure your backend is running:" -ForegroundColor White
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the proxy locally:" -ForegroundColor White
Write-Host "   curl http://localhost/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test from external:" -ForegroundColor White
Write-Host "   curl http://$Domain/api/health" -ForegroundColor Gray
Write-Host ""

if ($EnableHTTPS -and -not $CertificateThumbprint) {
    Write-Host "4. Install SSL certificate:" -ForegroundColor Yellow
    Write-Host "   Option A: Use Let's Encrypt (win-acme)" -ForegroundColor White
    Write-Host "     Download: https://www.win-acme.com/" -ForegroundColor Cyan
    Write-Host "     Run: wacs.exe --target iis" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option B: Use Cloudflare Origin Certificate" -ForegroundColor White
    Write-Host "     See: ..\docs\IIS_SETUP.md#ssl-certificates" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "  - View IIS logs: C:\inetpub\logs\LogFiles" -ForegroundColor Gray
Write-Host "  - Check backend: pm2 logs footvault-backend" -ForegroundColor Gray
Write-Host "  - Restart IIS: iisreset" -ForegroundColor Gray
Write-Host "  - View configuration: notepad $webConfigPath" -ForegroundColor Gray
