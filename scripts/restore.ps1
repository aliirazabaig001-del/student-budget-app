<#
.SYNOPSIS
  SkoolLedger restore for Windows. Replaces ALL current data with a backup.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\restore.ps1 -Backup .\backups\skoolledger-20260929-194500

.NOTES
  A safety backup of the current data is taken first, so a mistaken restore
  can be undone by restoring that safety backup.
#>
param(
  [Parameter(Mandatory = $true)][string]$Backup,
  [switch]$Yes
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\common.ps1')
Assert-Docker

if (-not (Test-Path $Backup -PathType Container)) { Stop-WithError "Backup folder not found: $Backup" }
$Backup = (Resolve-Path $Backup).Path
foreach ($f in 'database.dump', 'uploads.tar.gz', 'SHA256SUMS') {
  if (-not (Test-Path (Join-Path $Backup $f))) { Stop-WithError "$Backup is not a SkoolLedger backup (missing $f)." }
}

Write-Info 'Verifying backup checksums...'
foreach ($line in Get-Content (Join-Path $Backup 'SHA256SUMS')) {
  if (-not $line.Trim()) { continue }
  $expected, $file = $line -split '\s+', 2
  $actual = (Get-FileHash -Algorithm SHA256 -Path (Join-Path $Backup $file.TrimStart('*'))).Hash.ToLower()
  if ($actual -ne $expected) { Stop-WithError "Checksum mismatch for $file`: the backup is damaged or incomplete." }
}

if (-not $Yes) {
  Write-Warn "This will REPLACE all SkoolLedger data with the backup:`n  $Backup"
  $answer = Read-Host 'Type RESTORE to continue'
  if ($answer -ne 'RESTORE') { Stop-WithError 'Restore cancelled.' }
}

$dbUser = Get-DbUser; $dbName = Get-DbName
docker compose up -d db | Out-Null
Write-Info 'Waiting for the database...'
for ($i = 0; $i -lt 30; $i++) {
  docker compose exec -T db pg_isready -U $dbUser -d postgres *> $null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 2
}

Write-Info 'Taking a safety backup of the current data first...'
& (Join-Path $PSScriptRoot 'backup.ps1')
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { Stop-WithError 'Safety backup failed; nothing was changed.' }

Write-Info 'Stopping the application...'
docker compose stop proxy api | Out-Null

Write-Info 'Restoring database...'
docker compose exec -T db psql -U $dbUser -d postgres -v ON_ERROR_STOP=1 -q `
  -c "DROP DATABASE IF EXISTS `"$dbName`" WITH (FORCE);" `
  -c "CREATE DATABASE `"$dbName`" OWNER `"$dbUser`";"
if ($LASTEXITCODE -ne 0) { Stop-WithError 'Could not recreate the database.' }
Invoke-FromFile "docker compose exec -T db pg_restore -U $dbUser -d $dbName --no-owner --no-privileges --exit-on-error" (Join-Path $Backup 'database.dump')

Write-Info 'Restoring uploaded files...'
Invoke-FromFile "docker compose run --rm --no-deps -T --entrypoint sh api -c `"find /app/uploads -mindepth 1 -delete && tar -xzf - -C /app/uploads`"" (Join-Path $Backup 'uploads.tar.gz')

Write-Info 'Starting SkoolLedger (pending migrations are applied automatically)...'
docker compose up -d | Out-Null
Write-Info 'Restore complete. Users may need to sign in again.'
