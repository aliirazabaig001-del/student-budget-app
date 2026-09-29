<#
.SYNOPSIS
  SkoolLedger installer for Windows (Docker Desktop).

.DESCRIPTION
  1. Checks Docker Desktop is running.
  2. Creates .env with strong random secrets (only if .env does not exist).
  3. Builds and starts SkoolLedger with Docker Compose.
  4. Prints the address to open and the first administrator login.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\install.ps1
#>
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\common.ps1')
Assert-Docker

function New-RandomHex([int]$Bytes) {
  $buffer = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  return -join ($buffer | ForEach-Object { $_.ToString('x2') })
}

function Set-EnvValue([string]$Key, [string]$Value) {
  $lines = Get-Content .env | Where-Object { $_ -notmatch "^$Key=" }
  $lines += "$Key=$Value"
  Set-Content -Path .env -Value $lines -Encoding ascii
}

if (Test-Path .env) {
  Write-Info 'Using existing .env (delete it to generate new settings).'
} else {
  Write-Info 'Creating .env with new random secrets...'
  Copy-Item .env.example .env
  $dbPassword = New-RandomHex 24
  $adminPassword = "Sl-$(New-RandomHex 6)-$(New-RandomHex 3)"

  $schoolName = Read-Host 'School name [My School]'
  $adminEmail = Read-Host 'Administrator email [admin@skoolledger.local]'
  $httpPort = Read-Host 'Web port [80]'

  Set-EnvValue 'POSTGRES_PASSWORD' $dbPassword
  Set-EnvValue 'DATABASE_URL' "postgresql://skoolledger:$dbPassword@localhost:5432/skoolledger?schema=public"
  Set-EnvValue 'JWT_ACCESS_SECRET' (New-RandomHex 48)
  Set-EnvValue 'INITIAL_ADMIN_PASSWORD' $adminPassword
  if ($schoolName) { Set-EnvValue 'INITIAL_SCHOOL_NAME' ('"' + $schoolName.Replace('"', '') + '"') }
  if ($adminEmail) { Set-EnvValue 'INITIAL_ADMIN_EMAIL' $adminEmail }
  if ($httpPort) { Set-EnvValue 'HTTP_PORT' $httpPort }
}

Write-Info 'Building and starting SkoolLedger (the first run can take several minutes)...'
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Stop-WithError 'docker compose up failed.' }

$port = Get-EnvValue 'HTTP_PORT' '80'
$suffix = if ($port -eq '80') { '' } else { ":$port" }
$url = "http://localhost$suffix"

Write-Info 'Waiting for SkoolLedger to become ready...'
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri "$url/api/v1/health" -TimeoutSec 5 | Out-Null
    $ready = $true; break
  } catch { Start-Sleep -Seconds 3 }
}
if (-not $ready) { Stop-WithError 'SkoolLedger did not start. Check: docker compose logs api' }

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike '*vEthernet*' } |
  Select-Object -First 1).IPAddress

Write-Host ''
Write-Info 'SkoolLedger is running.'
Write-Info "  On this computer:        $url"
if ($lanIp) { Write-Info "  From other school PCs:   http://$lanIp$suffix" }
Write-Info "  Username: $(Get-EnvValue 'INITIAL_ADMIN_USERNAME' 'admin')"
Write-Info "  Password: $(Get-EnvValue 'INITIAL_ADMIN_PASSWORD' '(see: docker compose logs api)')"
Write-Info 'You will be asked to choose a new password at first sign-in.'
Write-Info 'Then remove INITIAL_ADMIN_PASSWORD from .env; it is only used on first start.'
Write-Info 'Allow the web port through Windows Firewall so other PCs can connect (see docs\INSTALLATION.md).'
