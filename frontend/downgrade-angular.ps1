# Script PowerShell pour downgrader Angular v20 vers v18
Write-Host "🔧 Downgrade Angular v20 -> v18 pour compatibilité Ionic v8..." -ForegroundColor Yellow

# Arrêter les processus Angular/esbuild
Write-Host "⏹️ Arrêt des processus en cours..." -ForegroundColor Blue
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*ng*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Aller dans le répertoire frontend
Set-Location $PSScriptRoot

# Sauvegarder package.json
Write-Host "💾 Sauvegarde package.json..." -ForegroundColor Blue
Copy-Item package.json package.json.backup -Force

# Nettoyer d'abord
Write-Host "🧹 Nettoyage..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Installer Angular v18
Write-Host "📦 Installation Angular v18..." -ForegroundColor Green
npm install @angular/animations@^18.2.0 @angular/common@^18.2.0 @angular/compiler@^18.2.0 @angular/core@^18.2.0 @angular/forms@^18.2.0 @angular/platform-browser@^18.2.0 @angular/platform-browser-dynamic@^18.2.0 @angular/router@^18.2.0 --save

# Installer Angular DevKit v18
Write-Host "📦 Installation Angular DevKit v18..." -ForegroundColor Green
npm install @angular-devkit/build-angular@^18.2.0 @angular/cli@^18.2.0 --save-dev

# Mettre à jour TypeScript (compatible Angular v18)
Write-Host "📦 Installation TypeScript compatible..." -ForegroundColor Green
npm install typescript@~5.4.0 --save-dev

# Réinstaller les dépendances
Write-Host "📦 Réinstallation des dépendances..." -ForegroundColor Green
npm install

Write-Host "✅ Downgrade terminé !" -ForegroundColor Green
Write-Host "🚀 Vous pouvez maintenant redémarrer avec: npm start" -ForegroundColor Cyan
