$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🐱 Installing Ani-Cat CLI..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npm is required but not installed. Please install Node.js." -ForegroundColor Red
    exit 1
}

$InstallDir = Join-Path $env:USERPROFILE ".ani-cat"

$ZipPath = Join-Path $env:TEMP "ani-cat.zip"
$ExtractPath = Join-Path $env:TEMP "ani-cat-extract"

Write-Host "📥 Downloading latest release..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/slice-of-fun/anicat-cli/archive/refs/heads/main.zip" -OutFile $ZipPath

if (Test-Path $InstallDir) {
    Write-Host "🔄 Removing old installation..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $InstallDir
}

Write-Host "📂 Extracting files..." -ForegroundColor Yellow
if (Test-Path $ExtractPath) { Remove-Item -Recurse -Force $ExtractPath }
New-Item -ItemType Directory -Path $ExtractPath | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force

# Move the inner folder (ani-cat-main) to $InstallDir
$ExtractedFolder = Get-ChildItem -Path $ExtractPath -Directory | Select-Object -First 1
Move-Item -Path $ExtractedFolder.FullName -Destination $InstallDir -Force

# Cleanup
Remove-Item -Force $ZipPath
Remove-Item -Recurse -Force $ExtractPath

Set-Location $InstallDir

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install blessed cheerio axios terminal-image sharp got

Write-Host "🔗 Linking executable to global path..." -ForegroundColor Yellow
npm link

Write-Host ""
Write-Host "✅ anicat-cli installed successfully!" -ForegroundColor Green
Write-Host "🎮 Run 'anicat-cli' from your terminal to start streaming!" -ForegroundColor Green
