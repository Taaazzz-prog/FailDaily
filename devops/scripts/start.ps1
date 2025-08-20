# FailDaily - Script de demarrage PowerShell
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

Write-Host "FailDaily - Demarrage du projet" -ForegroundColor Cyan

# Navigation vers la racine du projet
$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootPath

function Show-Help {
    Write-Host "Usage: .\start.ps1 [option]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  install     Installer toutes les dependances" -ForegroundColor Green
    Write-Host "  dev         Demarrer frontend + backend en mode developpement" -ForegroundColor Green
    Write-Host "  frontend    Demarrer uniquement le frontend" -ForegroundColor Green
    Write-Host "  backend     Demarrer uniquement le backend" -ForegroundColor Green
    Write-Host "  android     Build et synchroniser Android" -ForegroundColor Green
    Write-Host "  ios         Build et synchroniser iOS" -ForegroundColor Green
    Write-Host "  docker      Demarrer avec Docker" -ForegroundColor Green
    Write-Host "  test        Lancer tous les tests" -ForegroundColor Green
    Write-Host "  help        Afficher cette aide" -ForegroundColor Green
}

function Install-Dependencies {
    Write-Host "Installation des dependances..." -ForegroundColor Blue
    npm install
    Set-Location frontend
    npm install
    Set-Location ../backend-api
    npm install
    Set-Location $rootPath
    Write-Host "Installation terminee" -ForegroundColor Green
}

function Start-Development {
    Write-Host "Demarrage en mode developpement..." -ForegroundColor Blue
    npm run dev:full
}

function Start-Frontend {
    Write-Host "Demarrage du frontend..." -ForegroundColor Blue
    Set-Location frontend
    ionic serve
}

function Start-Backend {
    Write-Host "Demarrage du backend..." -ForegroundColor Blue
    Set-Location backend-api
    npm start
}

function Build-Android {
    Write-Host "Build Android..." -ForegroundColor Blue
    Set-Location frontend
    ionic build
    npx capacitor sync android
    npx capacitor open android
    Set-Location $rootPath
}

function Build-iOS {
    Write-Host "Build iOS..." -ForegroundColor Blue
    Set-Location frontend
    ionic build
    npx capacitor sync ios
    npx capacitor open ios
    Set-Location $rootPath
}

function Start-Docker {
    Write-Host "Demarrage avec Docker..." -ForegroundColor Blue
    Set-Location docker
    docker-compose up -d --build
    Write-Host "Containers demarres" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:80" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
    Set-Location $rootPath
}

function Run-Tests {
    Write-Host "Lancement des tests..." -ForegroundColor Blue
    npm run test:all
}

switch ($Command.ToLower()) {
    "install" { Install-Dependencies }
    "dev" { Start-Development }
    "frontend" { Start-Frontend }
    "backend" { Start-Backend }
    "android" { Build-Android }
    "ios" { Build-iOS }
    "docker" { Start-Docker }
    "test" { Run-Tests }
    default { Show-Help }
}
