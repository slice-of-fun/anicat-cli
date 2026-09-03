$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🐱 Installing Ani-Cat CLI..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npm is required but not installed. Please install Node.js." -ForegroundColor Red
    exit 1
}

$ProgressPreference = 'SilentlyContinue'
$InstallDir = Join-Path $HOME ".ani-cat"
$ZipUrl = "https://github.com/slice-of-fun/anicat-cli/archive/refs/heads/main.zip"
$ZipPath = Join-Path $env:TEMP "anicat.zip"
$ExtractPath = Join-Path $env:TEMP "anicat-extract"

Write-Host ""
Write-Host "🐱 Ani-Cat CLI Installer" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Progress -Activity "Installing Ani-Cat CLI" -Status "Downloading source code..." -PercentComplete 10
Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing

Write-Progress -Activity "Installing Ani-Cat CLI" -Status "Extracting files..." -PercentComplete 30
if (Test-Path $ExtractPath) { Remove-Item -Path $ExtractPath -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force

if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
}

$ExtractedFolder = Get-ChildItem -Path $ExtractPath -Directory | Select-Object -First 1
Move-Item -Path $ExtractedFolder.FullName -Destination $InstallDir -Force

Write-Progress -Activity "Installing Ani-Cat CLI" -Status "Installing dependencies (No Warnings)..." -PercentComplete 60
Set-Location -Path $InstallDir
# Use npm.cmd instead of npm to bypass strict Windows execution policies on npm.ps1
$null = npm.cmd install --silent --no-fund

Write-Progress -Activity "Installing Ani-Cat CLI" -Status "Linking global command..." -PercentComplete 90
$null = npm.cmd link --silent

Write-Progress -Activity "Installing Ani-Cat CLI" -Status "Cleaning up..." -PercentComplete 100
Remove-Item -Path $ZipPath -Force
Remove-Item -Path $ExtractPath -Recurse -Force

Write-Host ""
Write-Host "✅ anicat-cli installed successfully!" -ForegroundColor Green
Write-Host "🎮 Run 'anicat-cli' from your terminal to start streaming!" -ForegroundColor Green
Write-Host ""
