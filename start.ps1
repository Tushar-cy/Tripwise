# Travel Guide — One-Click Startup
# Paste this into PowerShell from ANY directory

$root = "C:\Users\jalde\OneDrive\Desktop\TripWise"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Travel Guide — Starting Everything" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kill all zombie node processes
Write-Host "[1/3] Clearing old Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>&1 | Out-Null
Start-Sleep -Seconds 2
Write-Host "      Done." -ForegroundColor Green

# 2. Start backend in a new window
Write-Host "[2/3] Starting backend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\server'; Write-Host 'BACKEND STARTING...' -ForegroundColor Cyan; node src/index.js"
) -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "      Backend running at http://192.168.0.168:3000" -ForegroundColor Green

# 3. Start Expo in THIS window
Write-Host "[3/3] Starting Expo Go (LAN mode)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Phone must be on same WiFi. Scan QR below with Expo Go." -ForegroundColor White
Write-Host ""
Set-Location "$root\mobile"
npx expo start --lan --port 8081
