# ====================================================================
# TECFLIX - Inicializador de Base de Datos PostgreSQL
# ====================================================================

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host " TECFLIX: Inicializando Base de Datos PostgreSQL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Comprobar servicio de PostgreSQL en Windows
$pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue
if ($pgService) {
    Write-Host "Estado del servicio PostgreSQL: $($pgService.Status)" -ForegroundColor Green
    if ($pgService.Status -ne "Running") {
        Write-Host "Iniciando servicio $($pgService.Name)..." -ForegroundColor Yellow
        Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[Aviso] No se detect servicio local de PostgreSQL registrado con nombre estndar." -ForegroundColor Yellow
}

# 2. Ejecutar inicializacin de esquema y datos con Node.js
Write-Host "`nEjecutando script de esquema (database/schema.sql) y semillas (database/seed.sql)..." -ForegroundColor Cyan
Set-Location -Path "$rootDir\backend"

node src/config/initDb.js

Set-Location -Path $rootDir

Write-Host "`nSi necesitas configurar la contrasea de tu PostgreSQL local," -ForegroundColor DarkGray
Write-Host "edita el archivo backend\.env (PGPASSWORD=tu_contrasea)." -ForegroundColor DarkGray
Write-Host "Base de datos lista para TECFLIX!" -ForegroundColor Green
