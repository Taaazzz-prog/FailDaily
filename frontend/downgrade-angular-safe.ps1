#!/usr/bin/env pwsh

Write-Host "🔄 Downgrade Angular v20 vers v18 pour compatibilité Ionic v8" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan

# Vérifier qu'on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Error "❌ package.json non trouvé. Exécutez ce script depuis le répertoire frontend."
    exit 1
}

Write-Host "📦 Sauvegarde du package.json actuel..." -ForegroundColor Yellow
Copy-Item "package.json" "package.json.backup-v20" -Force

Write-Host "🗑️  Suppression du node_modules et package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force }

Write-Host "⬇️  Installation d'Angular v18 (compatible Ionic v8)..." -ForegroundColor Green

# Downgrade vers Angular v18 (dernière version compatible avec Ionic v8)
$angularV18 = "^18.2.0"
$typescriptV18 = "~5.6.0"

npm install --save `
    "@angular/animations@$angularV18" `
    "@angular/common@$angularV18" `
    "@angular/compiler@$angularV18" `
    "@angular/core@$angularV18" `
    "@angular/forms@$angularV18" `
    "@angular/platform-browser@$angularV18" `
    "@angular/platform-browser-dynamic@$angularV18" `
    "@angular/router@$angularV18"

Write-Host "🛠️  Installation des dev dependencies Angular v18..." -ForegroundColor Green
npm install --save-dev `
    "@angular-devkit/build-angular@^18.2.0" `
    "@angular/cli@^18.2.0" `
    "@angular/compiler-cli@$angularV18" `
    "typescript@$typescriptV18"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Downgrade Angular v20 → v18 terminé avec succès!" -ForegroundColor Green
    Write-Host "📋 Versions installées:" -ForegroundColor Cyan
    npm ls @angular/core @ionic/angular --depth=0
    Write-Host "🚀 Vous pouvez maintenant démarrer l'application avec: npm start" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du downgrade. Restauration du package.json..." -ForegroundColor Red
    if (Test-Path "package.json.backup-v20") {
        Copy-Item "package.json.backup-v20" "package.json" -Force
        Write-Host "📁 package.json restauré depuis la sauvegarde" -ForegroundColor Yellow
    }
    exit 1
}
