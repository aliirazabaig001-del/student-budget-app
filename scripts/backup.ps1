<#
.SYNOPSIS
  SkoolLedger backup for Windows: database (pg_dump) + uploaded files.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
  powershell -ExecutionPolicy Bypass -File scripts\backup.ps1 -Destination E:\SkoolLedgerBackups

.NOTES
  Creates one folder per run (skoolledger-YYYYMMDD-HHMMSS) containing
  database.dump, uploads.tar.gz, manifest.txt and SHA256SUMS. The format is
  identical to scripts/backup.sh, so backups can be restored on either OS.
#>
param([string]$Destination)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\common.ps1')
Assert-Docker

if (-not $Destination) { $Destination = Get-EnvValue 'BACKUP_DIR' '.\backups' }
$keepDays = [int](Get-EnvValue 'BACKUP_KEEP_DAYS' '30')
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$Destination = (Resolve-Path $Destination).Path

$running = docker compose ps --status running --services
if ($running -notcontains 'db') { Stop-WithError 'The database container is not running. Start SkoolLedger first (docker compose up -d).' }

$name = 'skoolledger-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$work = Join-Path $Destination ".$name.partial"
$final = Join-Path $Destination $name
New-Item -ItemType Directory -Force -Path $work | Out-Null

try {
  $dbUser = Get-DbUser; $dbName = Get-DbName
  Write-Info "Backing up database '$dbName'..."
  Invoke-ToFile "docker compose exec -T db pg_dump -U $dbUser -d $dbName --format=custom --no-owner --no-privileges" (Join-Path $work 'database.dump')
  cmd /c "docker compose exec -T db pg_restore --list < `"$(Join-Path $work 'database.dump')`" > NUL"
  if ($LASTEXITCODE -ne 0) { Stop-WithError 'The database dump could not be verified.' }

  Write-Info 'Backing up uploaded files...'
  Invoke-ToFile 'docker compose exec -T api tar -czf - -C /app/uploads .' (Join-Path $work 'uploads.tar.gz')

  $version = (docker compose exec -T api node -e "process.stdout.write(require('/app/package.json').version)") 2>$null
  @(
    'SkoolLedger backup'
    "created_at=$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"
    "host=$env:COMPUTERNAME"
    "app_version=$version"
    "database=$dbName"
  ) | Set-Content -Path (Join-Path $work 'manifest.txt') -Encoding ascii

  $sums = foreach ($f in 'database.dump', 'uploads.tar.gz', 'manifest.txt') {
    $hash = (Get-FileHash -Algorithm SHA256 -Path (Join-Path $work $f)).Hash.ToLower()
    "$hash  $f"
  }
  # LF line endings so the file also verifies with sha256sum on Linux.
  [System.IO.File]::WriteAllText((Join-Path $work 'SHA256SUMS'), (($sums -join "`n") + "`n"))

  Move-Item $work $final
} catch {
  Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
  throw
}

if ($keepDays -gt 0) {
  Get-ChildItem -Path $Destination -Directory -Filter 'skoolledger-*' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$keepDays) } |
    ForEach-Object { Write-Info "Removing backup older than $keepDays days: $($_.Name)"; Remove-Item -Recurse -Force $_.FullName }
}

Write-Info "Backup complete: $final"
Write-Info 'Copy this folder to a USB drive or another computer to keep it safe.'
