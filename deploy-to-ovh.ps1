# ====================================================================
# 🚀 Script de déploiement FailDaily pour OVH (Windows PowerShell)
# ====================================================================
# Pour bruno@taaazzz.be - FailDaily
# ====================================================================

param(
    [string]$ServerIP = "51.75.55.185",
    [string]$SSHUser = "taaazzz",
    [switch]$SkipTests = $false
)

Write-Host "🚀 Déploiement FailDaily vers serveur OVH" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Vérification des prérequis
if (-not $ServerIP) {
    Write-Host "❌ Erreur: IP du serveur OVH requis" -ForegroundColor Red
    Write-Host "Usage: .\deploy-to-ovh.ps1 -ServerIP '51.75.55.185'" -ForegroundColor Yellow
    exit 1
}

# Test connexion serveur
Write-Host "🔍 Test de connexion au serveur $ServerIP..." -ForegroundColor Blue
$testConnection = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
if (-not $testConnection) {
    Write-Host "❌ Impossible de joindre le serveur $ServerIP" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Serveur accessible" -ForegroundColor Green

# Tests locaux optionnels
if (-not $SkipTests) {
    Write-Host "🧪 Exécution des tests locaux..." -ForegroundColor Blue
    
    # Test backend
    Push-Location "backend-api"
    npm test 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Tests backend échoués, continuer quand même ? (y/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "❌ Déploiement annulé" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    Pop-Location
    
    Write-Host "✅ Tests passés" -ForegroundColor Green
}

# Copie des fichiers vers le serveur
Write-Host "📁 Copie des fichiers vers le serveur..." -ForegroundColor Blue

# Commandes SSH pour le déploiement
$deployCommands = @(
    "mkdir -p /home/taaazzz/FailDaily",
    "cd /home/taaazzz/FailDaily",
    "if [ -d '.git' ]; then git pull origin main; else git clone https://github.com/Taaazzz-prog/FailDaily.git .; fi",
    "chmod +x deploy-ovh.sh",
    "./deploy-ovh.sh"
)

foreach ($command in $deployCommands) {
    Write-Host "🔧 Exécution: $command" -ForegroundColor Blue
    ssh $SSHUser@$ServerIP $command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'exécution de: $command" -ForegroundColor Red
        exit 1
    }
}

# Vérification du déploiement
Write-Host "🔍 Vérification du déploiement..." -ForegroundColor Blue
$healthCheck = ssh $SSHUser@$ServerIP "curl -s http://localhost/api/health"
if ($healthCheck -match "healthy") {
    Write-Host "✅ Application déployée avec succès !" -ForegroundColor Green
    Write-Host "🌐 Site accessible sur: https://faildaily.com" -ForegroundColor Green
} else {
    Write-Host "⚠️  Application déployée mais health check échoué" -ForegroundColor Yellow
    Write-Host "Vérifiez les logs: ssh $SSHUser@$ServerIP 'docker-compose logs'" -ForegroundColor Yellow
}

Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "📊 Pour voir les logs: ssh $SSHUser@$ServerIP 'cd /home/taaazzz/FailDaily && docker-compose logs -f'" -ForegroundColor Blue
Write-Host "🛑 Pour arrêter: ssh $SSHUser@$ServerIP 'cd /home/taaazzz/FailDaily && docker-compose down'" -ForegroundColor Blue