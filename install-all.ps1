# ====================================================================
# TECFLIX - Script PowerShell para Instalar Todas las Dependencias
# ====================================================================

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "📦 TECFLIX: Instalando dependencias de Backend y Frontend" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Backend
Write-Host "`n[1/2] Instalando paquetes del Backend (Express, PG, GCS, Multer, JWT)..." -ForegroundColor Yellow
Set-Location -Path "$rootDir\backend"
npm install

# 2. Frontend
Write-Host "`n[2/2] Instalando paquetes del Frontend (React, Vite, Tailwind CSS, Lucide)..." -ForegroundColor Yellow
Set-Location -Path "$rootDir\frontend"
npm install

Set-Location -Path $rootDir

Write-Host "`n✅ ¡Todas las dependencias se instalaron exitosamente!" -ForegroundColor Green
Write-Host "Para iniciar la plataforma completa, ejecuta: .\start-all.ps1" -ForegroundColor Cyan
