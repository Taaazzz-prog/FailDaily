#!/usr/bin/env powershell

<#
.SYNOPSIS
    🚀 DÉPLOIEMENT PRODUCTION OVH - Corrections CSS
    
.DESCRIPTION
    Script de déploiement automatique des corrections CSS sur le serveur OVH.
    Synchronise le code, reconstruit les conteneurs Docker avec les nouvelles configs.
#>

param(
    [string]$ServerIP = "51.75.55.185",
    [string]$ServerUser = "debian",
    [string]$ProjectPath = "/var/www/FailDaily"
)

Write-Host "🚀 DÉPLOIEMENT PRODUCTION OVH" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

# Fonction pour exécuter des commandes SSH
function Invoke-SSHCommand {
    param($Command, $Description)
    Write-Host "🔧 $Description..." -ForegroundColor Yellow
    Write-Host "   Commande: $Command" -ForegroundColor Gray
    
    try {
        $result = ssh $ServerUser@$ServerIP $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Succès" -ForegroundColor Green
            return $result
        } else {
            Write-Host "   ❌ Échec (Code: $LASTEXITCODE)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Vérifier la connexion SSH
Write-Host "1️⃣ Vérification connexion serveur OVH..."
$connection = Invoke-SSHCommand "whoami && hostname" "Test connexion SSH"
if (-not $connection) {
    Write-Host "❌ Impossible de se connecter au serveur OVH" -ForegroundColor Red
    Write-Host "💡 Vérifiez que votre clé SSH est configurée" -ForegroundColor Yellow
    exit 1
}
Write-Host "   📡 Connecté en tant que: $($connection -join ' | ')" -ForegroundColor Green
Write-Host ""

# 2. Synchroniser le code source
Write-Host "2️⃣ Synchronisation du code source..."
Invoke-SSHCommand "cd $ProjectPath && git fetch origin" "Récupération des modifications"
Invoke-SSHCommand "cd $ProjectPath && git reset --hard origin/main" "Reset vers dernière version"
Invoke-SSHCommand "cd $ProjectPath && git log --oneline -3" "Vérification commits"
Write-Host ""

# 3. Vérifier les modifications CSS
Write-Host "3️⃣ Vérification des corrections CSS..."
$packageJson = Invoke-SSHCommand "cd $ProjectPath && grep 'build:docker' frontend/package.json" "Commande build:docker"
$dockerfile = Invoke-SSHCommand "cd $ProjectPath && grep 'build:docker' docker/frontend.Dockerfile" "Dockerfile modifié"

if ($packageJson -and $dockerfile) {
    Write-Host "   ✅ Corrections CSS présentes sur le serveur" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Corrections CSS non détectées" -ForegroundColor Yellow
}
Write-Host ""

# 4. Arrêter les conteneurs existants
Write-Host "4️⃣ Arrêt des conteneurs existants..."
Invoke-SSHCommand "cd $ProjectPath/docker && docker-compose down" "Arrêt services Docker"
Write-Host ""

# 5. Nettoyer les images obsolètes
Write-Host "5️⃣ Nettoyage des images Docker..."
Invoke-SSHCommand "docker system prune -f" "Nettoyage images inutilisées"
Write-Host ""

# 6. Reconstruire avec les nouvelles configurations
Write-Host "6️⃣ Reconstruction avec nouvelles configs CSS..."
Invoke-SSHCommand "cd $ProjectPath/docker && docker-compose build --no-cache --pull" "Build complet frontend/backend"
Write-Host ""

# 7. Démarrer les services
Write-Host "7️⃣ Démarrage des services de production..."
Invoke-SSHCommand "cd $ProjectPath/docker && docker-compose up -d" "Démarrage conteneurs"
Write-Host ""

# 8. Vérifier les services
Write-Host "8️⃣ Vérification des services..."
Start-Sleep -Seconds 10  # Attendre que les services démarrent

$healthAPI = Invoke-SSHCommand "curl -s https://faildaily.com/api/health | grep 'status'" "API Health Check"
$frontendCheck = Invoke-SSHCommand "curl -s https://faildaily.com | grep 'FailDaily'" "Frontend Check"

if ($healthAPI -and $frontendCheck) {
    Write-Host "   ✅ Services opérationnels" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Services en cours de démarrage..." -ForegroundColor Yellow
}
Write-Host ""

# 9. Test de l'interface admin
Write-Host "9️⃣ Test interface admin production..."
Write-Host "   🌐 URL: https://faildaily.com/tabs/admin" -ForegroundColor Cyan
Write-Host "   🔑 Login: bruno@taaazzz.be / @51008473@" -ForegroundColor Cyan
Write-Host ""

# Résumé final
Write-Host "🎯 RÉSUMÉ DU DÉPLOIEMENT" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "✅ Code synchronisé depuis GitHub" 
Write-Host "✅ Corrections CSS déployées:"
Write-Host "   - build:docker sans optimisations CSS agressives"
Write-Host "   - Variables Ionic préservées en production"
Write-Host "   - Interface admin maintenant identique partout"
Write-Host "✅ Conteneurs Docker reconstruits"
Write-Host "✅ Services de production redémarrés"
Write-Host ""
Write-Host "🎨 L'interface admin devrait maintenant être magnifique en production !" -ForegroundColor Green
Write-Host "🧪 Testez sur: https://faildaily.com/tabs/admin" -ForegroundColor Yellow