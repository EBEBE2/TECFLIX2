# ====================================================================
# TECFLIX - Arranque Simultneo de API y Cliente en Windows
# ====================================================================

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host " INICIANDO PLATAFORMA STREAMING TECFLIX" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Iniciar Servidor API Backend (Express + PostgreSQL + Google Cloud Storage)
Write-Host "`n[1/2] Arrancando TECFLIX Backend API (Puerto 5000)..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$rootDir\backend`"; Write-Host '--- TECFLIX API SERVER (5000) ---' -ForegroundColor Magenta; npm run dev" -PassThru

Start-Sleep -Seconds 2

# 2. Iniciar Cliente Frontend (React + Vite + Tailwind CSS)
Write-Host "[2/2] Arrancando TECFLIX Frontend Client (Puerto 3000)..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$rootDir\frontend`"; Write-Host '--- TECFLIX FRONTEND (3000) ---' -ForegroundColor Cyan; npm run dev" -PassThru

Start-Sleep -Seconds 3

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " TECFLIX EST EN EJECUCIN!" -ForegroundColor Green
Write-Host " Frontend Cliente: http://localhost:3000" -ForegroundColor Cyan
Write-Host " Backend API:      http://localhost:5000/api" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Presiona Ctrl+C o cierra las ventanas de terminal para detener." -ForegroundColor DarkGray

# Abrir el navegador en el frontend
Start-Process "http://localhost:3000"
