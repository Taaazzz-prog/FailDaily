# Script de nettoyage et réinstallation Frontend FailDaily
# Résout les problèmes de permissions Capacitor

Write-Host "🧹 Nettoyage complet du Frontend FailDaily..." -ForegroundColor Yellow

# 1. Arrêter tous les processus Node.js
Write-Host "⏹️ Arrêt des processus Node.js..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Supprimer les dossiers problématiques (avec retry)
$foldersToDelete = @(
    "D:\WEB API\FailDaily\node_modules",
    "D:\WEB API\FailDaily\frontend\node_modules"
)

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "🗑️ Suppression: $folder" -ForegroundColor Red
        for ($i = 1; $i -le 3; $i++) {
            try {
                Remove-Item $folder -Recurse -Force -ErrorAction Stop
                Write-Host "✅ Supprimé: $folder" -ForegroundColor Green
                break
            }
            catch {
                Write-Host "⚠️ Tentative $i échouée, attente 2s..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
}

# 3. Nettoyer les caches
Write-Host "🧽 Nettoyage des caches..." -ForegroundColor Blue
Set-Location "D:\WEB API\FailDaily\frontend"
npm cache clean --force

# 4. Réinstaller uniquement dans frontend
Write-Host "📦 Réinstallation des dépendances frontend..." -ForegroundColor Blue
npm install --no-optional --prefer-offline

# 5. Lancer le serveur
Write-Host "🚀 Lancement du serveur..." -ForegroundColor Green
ionic serve

Write-Host "Script terminé !" -ForegroundColor Green