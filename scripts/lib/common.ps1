# Shared helpers for SkoolLedger PowerShell scripts. Dot-sourced, not executed.

$script:SkoolLedgerRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $script:SkoolLedgerRoot

function Write-Info([string]$Message) { Write-Host "[skoolledger] $Message" -ForegroundColor Cyan }
function Write-Warn([string]$Message) { Write-Host "[skoolledger] $Message" -ForegroundColor Yellow }
function Stop-WithError([string]$Message) {
  Write-Host "[skoolledger] ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Assert-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Stop-WithError 'Docker Desktop is not installed. See docs\INSTALLATION.md.'
  }
  docker info *> $null
  if ($LASTEXITCODE -ne 0) { Stop-WithError 'Docker Desktop is not running. Start it and try again.' }
}

# Reads KEY from .env without executing the file.
function Get-EnvValue([string]$Key, [string]$Default = '') {
  if (Test-Path .env) {
    $line = Get-Content .env | Where-Object { $_ -match "^$Key=" } | Select-Object -Last 1
    if ($line) {
      $value = $line.Substring($Key.Length + 1).Trim('"')
      if ($value) { return $value }
    }
  }
  return $Default
}

function Get-DbUser { Get-EnvValue 'POSTGRES_USER' 'skoolledger' }
function Get-DbName { Get-EnvValue 'POSTGRES_DB' 'skoolledger' }

# Runs a command and streams its binary stdout into a file (PowerShell 5 pipes
# would corrupt binary data, so cmd.exe redirection is used).
function Invoke-ToFile([string]$Command, [string]$Path) {
  cmd /c "$Command > `"$Path`""
  if ($LASTEXITCODE -ne 0) { Stop-WithError "Command failed: $Command" }
}

# Runs a command with a file as binary stdin.
function Invoke-FromFile([string]$Command, [string]$Path) {
  cmd /c "$Command < `"$Path`""
  if ($LASTEXITCODE -ne 0) { Stop-WithError "Command failed: $Command" }
}
