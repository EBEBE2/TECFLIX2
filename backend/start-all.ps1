Write-Host "Iniciando TECFLIX (Backend + Frontend) en esta terminal..." -ForegroundColor Cyan

# Liberar puertos si quedaron ocupados
Get-NetTCPConnection -LocalPort 5000,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Iniciar Backend en segundo plano
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Job -Name "TecflixBackend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm start
} -ArgumentList $backendPath | Out-Null

Write-Host "Backend iniciado en segundo plano (Puerto 5000)." -ForegroundColor Green

# Iniciar Frontend en esta misma terminal
$frontendPath = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendPath
try {
    npm run dev
} finally {
    Stop-Job -Name "TecflixBackend" -ErrorAction SilentlyContinue
    Remove-Job -Name "TecflixBackend" -ErrorAction SilentlyContinue
    Write-Host "Servicios de TECFLIX detenidos." -ForegroundColor Yellow
}
