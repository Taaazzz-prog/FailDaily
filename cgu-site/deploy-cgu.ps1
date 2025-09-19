# Script PowerShell de déploiement du site CGU sur cgu.faildaily.com
# Utilisation : .\deploy-cgu.ps1

param(
    [switch]$Force,
    [switch]$SkipTests,
    [string]$Environment = "production"
)

# Configuration
$CGU_DOMAIN = "cgu.faildaily.com"
$CONTAINER_NAME = "faildaily_cgu"
$NETWORK_NAME = "faildaily-network"
$COMPOSE_FILE = "docker-compose.cgu.yml"

# Couleurs pour les logs
function Write-Info($Message) {
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success($Message) {
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning($Message) {
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error($Message) {
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header($Message) {
    Write-Host ""
    Write-Host "🚀 $Message" -ForegroundColor Cyan
    Write-Host ("=" * ($Message.Length + 4))
}

# Vérifications préalables
function Test-Prerequisites {
    Write-Info "Vérification des prérequis..."
    
    # Vérifier Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker disponible : $dockerVersion"
    }
    catch {
        Write-Error "Docker n'est pas installé ou accessible"
        throw
    }
    
    # Vérifier Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose disponible : $composeVersion"
    }
    catch {
        Write-Error "Docker Compose n'est pas installé ou accessible"
        throw
    }
    
    # Vérifier les fichiers nécessaires
    $requiredFiles = @(
        $COMPOSE_FILE,
        "cgu-nginx.conf",
        "index.html",
        "styles.css",
        "script.js"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Fichier manquant : $file"
            throw "Fichiers manquants"
        }
    }
    
    Write-Success "Tous les fichiers requis sont présents"
}

# Créer le réseau Docker
function New-DockerNetwork {
    Write-Info "Vérification du réseau Docker..."
    
    $networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^$NETWORK_NAME$"
    
    if (-not $networkExists) {
        Write-Info "Création du réseau $NETWORK_NAME..."
        docker network create $NETWORK_NAME
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Réseau créé avec succès"
        } else {
            Write-Error "Erreur lors de la création du réseau"
            throw
        }
    } else {
        Write-Success "Réseau existant trouvé"
    }
}

# Arrêter le conteneur existant
function Stop-ExistingContainer {
    Write-Info "Vérification du conteneur existant..."
    
    $runningContainer = docker ps -q --filter "name=$CONTAINER_NAME"
    if ($runningContainer) {
        Write-Info "Arrêt du conteneur en cours d'exécution..."
        docker stop $CONTAINER_NAME
        Write-Success "Conteneur arrêté"
    }
    
    $existingContainer = docker ps -aq --filter "name=$CONTAINER_NAME"
    if ($existingContainer) {
        Write-Info "Suppression du conteneur existant..."
        docker rm $CONTAINER_NAME
        Write-Success "Conteneur supprimé"
    }
}

# Démarrer le conteneur
function Start-Container {
    Write-Info "Démarrage du conteneur CGU..."
    
    try {
        docker-compose -f $COMPOSE_FILE up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Conteneur démarré avec succès"
        } else {
            Write-Error "Erreur lors du démarrage du conteneur"
            throw
        }
    }
    catch {
        Write-Error "Échec du démarrage : $_"
        throw
    }
}

# Attendre que le conteneur soit prêt
function Wait-ContainerReady {
    Write-Info "Attente de la disponibilité du conteneur..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $testResult = docker exec $CONTAINER_NAME nginx -t 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Conteneur prêt et configuration valide"
                return $true
            }
        }
        catch {
            # Continuer à attendre
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Host ""
    Write-Error "Le conteneur n'est pas prêt après $maxAttempts tentatives"
    return $false
}

# Tests de déploiement
function Test-Deployment {
    if ($SkipTests) {
        Write-Warning "Tests ignorés (paramètre -SkipTests)"
        return
    }
    
    Write-Info "Exécution des tests de déploiement..."
    
    # Test configuration Nginx
    try {
        $nginxTest = docker exec $CONTAINER_NAME nginx -t 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Configuration Nginx valide"
        } else {
            Write-Warning "Configuration Nginx : $nginxTest"
        }
    }
    catch {
        Write-Warning "Impossible de tester la configuration Nginx"
    }
    
    # Test accès local
    try {
        $curlTest = docker exec $CONTAINER_NAME curl -f -s http://localhost/ 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Site accessible localement"
        } else {
            Write-Warning "Site non accessible localement"
        }
    }
    catch {
        Write-Warning "Impossible de tester l'accès local"
    }
    
    # Afficher les logs récents
    Write-Info "Logs récents du conteneur :"
    try {
        docker logs --tail 10 $CONTAINER_NAME
    }
    catch {
        Write-Warning "Impossible d'afficher les logs"
    }
}

# Informations de déploiement
function Show-DeploymentInfo {
    Write-Host ""
    Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
    Write-Host "======================"
    Write-Host ""
    
    # Status du conteneur
    try {
        $containerStatus = docker inspect --format='{{.State.Status}}' $CONTAINER_NAME 2>$null
        Write-Host "🌐 Site CGU : https://$CGU_DOMAIN" -ForegroundColor Cyan
        Write-Host "🐳 Conteneur : $CONTAINER_NAME" -ForegroundColor Cyan
        Write-Host "📊 Status : $containerStatus" -ForegroundColor Cyan
    }
    catch {
        Write-Warning "Impossible de récupérer le status du conteneur"
    }
    
    Write-Host ""
    Write-Host "📋 Commandes utiles :" -ForegroundColor Yellow
    Write-Host "  • Logs : docker logs -f $CONTAINER_NAME"
    Write-Host "  • Restart : docker restart $CONTAINER_NAME"
    Write-Host "  • Stop : docker stop $CONTAINER_NAME"
    Write-Host "  • Shell : docker exec -it $CONTAINER_NAME sh"
    Write-Host ""
    Write-Host "🔧 Monitoring :" -ForegroundColor Yellow
    Write-Host "  • Health : docker ps | Select-String $CONTAINER_NAME"
    Write-Host "  • Config test : docker exec $CONTAINER_NAME nginx -t"
    Write-Host "  • Reload config : docker exec $CONTAINER_NAME nginx -s reload"
    Write-Host ""
    
    # Informations supplémentaires pour la production
    if ($Environment -eq "production") {
        Write-Host "🔐 Vérifications SSL :" -ForegroundColor Magenta
        Write-Host "  • Test SSL : curl -I https://$CGU_DOMAIN"
        Write-Host "  • Certificat : docker logs traefik | Select-String $CGU_DOMAIN"
        Write-Host ""
    }
}

# Fonction principale
function Main {
    try {
        Write-Header "Déploiement du site CGU FailDaily"
        Write-Info "Début du déploiement à $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Info "Environnement : $Environment"
        
        if ($Force) {
            Write-Warning "Mode Force activé - les vérifications seront ignorées"
        }
        
        Test-Prerequisites
        New-DockerNetwork
        Stop-ExistingContainer
        Start-Container
        
        if (Wait-ContainerReady) {
            Test-Deployment
            Show-DeploymentInfo
            Write-Success "Déploiement réussi ! 🎉"
            
            # Ouvrir le site dans le navigateur (optionnel)
            $openSite = Read-Host "Voulez-vous ouvrir le site dans votre navigateur ? (y/N)"
            if ($openSite -eq 'y' -or $openSite -eq 'Y') {
                Start-Process "https://$CGU_DOMAIN"
            }
        } else {
            Write-Error "Échec du déploiement - le conteneur n'est pas prêt"
            Write-Info "Affichage des logs pour diagnostic :"
            docker logs $CONTAINER_NAME
            exit 1
        }
    }
    catch {
        Write-Error "Erreur lors du déploiement : $_"
        Write-Info "Nettoyage en cours..."
        
        try {
            docker stop $CONTAINER_NAME 2>$null
            docker rm $CONTAINER_NAME 2>$null
        }
        catch {
            # Ignorer les erreurs de nettoyage
        }
        
        exit 1
    }
}

# Gestion des interruptions
try {
    Main
}
catch [System.Management.Automation.PipelineStoppedException] {
    Write-Error "Déploiement interrompu par l'utilisateur"
    exit 1
}