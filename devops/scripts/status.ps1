# FailDaily - Status du projet
Write-Host "======================================"
Write-Host "    FailDaily - Status du Projet"
Write-Host "======================================"

Write-Host "`nStructure du projet:" -ForegroundColor Yellow
Write-Host "frontend/     - Application Angular/Ionic" -ForegroundColor Green
Write-Host "backend-api/  - API Node.js/Express" -ForegroundColor Green
Write-Host "docker/       - Configuration Docker" -ForegroundColor Green
Write-Host "devops/       - Scripts et outils DevOps" -ForegroundColor Green

Write-Host "`nScripts DevOps disponibles:" -ForegroundColor Yellow
Write-Host "npm run devops:start [option]    - Demarrage du projet" -ForegroundColor Green
Write-Host "npm run devops:test [type]       - Tests automatises" -ForegroundColor Green
Write-Host "npm run load-test [target]       - Tests de charge" -ForegroundColor Green
Write-Host "npm run security-audit           - Audit de securite" -ForegroundColor Green

Write-Host "`nServices:" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 2 | Out-Null
    Write-Host "Backend API - http://localhost:3000 - ACTIF" -ForegroundColor Green
} catch {
    Write-Host "Backend API - ARRETE" -ForegroundColor Red
}

try {
    Invoke-WebRequest -Uri "http://localhost:8100" -TimeoutSec 2 | Out-Null
    Write-Host "Frontend - http://localhost:8100 - ACTIF" -ForegroundColor Green
} catch {
    Write-Host "Frontend - ARRETE" -ForegroundColor Red
}

Write-Host "`nCommandes rapides:" -ForegroundColor Yellow
Write-Host "Demarrer le projet:     npm run devops:start dev" -ForegroundColor Cyan
Write-Host "Lancer les tests:       npm run devops:test" -ForegroundColor Cyan
Write-Host "Tests de charge:        npm run load-test api" -ForegroundColor Cyan

Write-Host "`n======================================" -ForegroundColor Green
