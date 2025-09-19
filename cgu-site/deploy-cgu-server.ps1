# Script PowerShell de déploiement CGU vers serveur OVH
# Utilisation : .\deploy-cgu-server.ps1

param(
    [switch]$Force,
    [switch]$SkipBackup,
    [string]$Environment = "production"
)

# Configuration serveur OVH
$SERVER_IP = "51.75.55.185"
$SERVER_USER = "taaazzz"
$CGU_DOMAIN = "cgu.faildaily.com"
$REMOTE_PATH = "/home/taaazzz/faildaily-cgu"
$CONTAINER_NAME = "faildaily_cgu"

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
    Write-Info "Vérification des prérequis locaux..."
    
    # Vérifier SSH (avec plink ou ssh)
    try {
        $sshVersion = ssh -V 2>&1
        Write-Success "SSH disponible : $sshVersion"
    }
    catch {
        Write-Error "SSH n'est pas installé (installer OpenSSH ou PuTTY)"
        throw
    }
    
    # Vérifier SCP
    try {
        Get-Command scp -ErrorAction Stop | Out-Null
        Write-Success "SCP disponible"
    }
    catch {
        Write-Error "SCP n'est pas disponible"
        throw
    }
    
    # Vérifier les fichiers nécessaires
    $requiredFiles = @(
        "docker-compose.cgu.yml",
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

# Test de connectivité SSH
function Test-ServerConnection {
    Write-Info "Test de connexion au serveur $SERVER_IP..."
    
    try {
        $testResult = ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'Connected'" 2>&1
        
        if ($testResult -like "*Connected*") {
            Write-Success "Connexion SSH établie"
            return $true
        } else {
            Write-Error "Échec de connexion SSH : $testResult"
            return $false
        }
    }
    catch {
        Write-Error "Erreur de connexion SSH : $_"
        return $false
    }
}

# Créer le répertoire distant
function New-RemoteDirectory {
    Write-Info "Création du répertoire distant $REMOTE_PATH..."
    
    $commands = @(
        "mkdir -p $REMOTE_PATH",
        "cd $REMOTE_PATH"
    )
    
    foreach ($cmd in $commands) {
        ssh $SERVER_USER@$SERVER_IP $cmd
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Erreur lors de l'exécution : $cmd"
            throw
        }
    }
    
    Write-Success "Répertoire distant créé"
}

# Backup de l'ancienne version
function Backup-RemoteVersion {
    if ($SkipBackup) {
        Write-Info "Backup ignoré (paramètre -SkipBackup)"
        return
    }
    
    Write-Info "Sauvegarde de l'ancienne version..."
    
    $backupDir = "/home/taaazzz/faildaily-cgu-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    ssh $SERVER_USER@$SERVER_IP "if [ -d '$REMOTE_PATH' ]; then cp -r '$REMOTE_PATH' '$backupDir' && echo 'Backup créé : $backupDir'; fi"
    
    Write-Success "Backup terminé"
}

# Upload des fichiers
function Copy-FilesToServer {
    Write-Info "Upload des fichiers vers le serveur..."
    
    # Créer le répertoire cgu-site sur le serveur
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_PATH/cgu-site"
    
    # Liste des fichiers à uploader
    $filesToCopy = @{
        "docker-compose.cgu.yml" = "$REMOTE_PATH/"
        "cgu-nginx.conf" = "$REMOTE_PATH/"
        "index.html" = "$REMOTE_PATH/cgu-site/"
        "styles.css" = "$REMOTE_PATH/cgu-site/"
        "script.js" = "$REMOTE_PATH/cgu-site/"
        "README.md" = "$REMOTE_PATH/cgu-site/"
    }
    
    foreach ($file in $filesToCopy.Keys) {
        if (Test-Path $file) {
            Write-Info "Upload : $file -> $($filesToCopy[$file])"
            scp "$file" "$SERVER_USER@$SERVER_IP`:$($filesToCopy[$file])"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "✓ $file"
            } else {
                Write-Error "✗ Échec upload : $file"
                throw
            }
        } else {
            Write-Warning "Fichier non trouvé : $file"
        }
    }
    
    Write-Success "Tous les fichiers uploadés"
}

# Arrêter l'ancien conteneur
function Stop-RemoteContainer {
    Write-Info "Arrêt de l'ancien conteneur..."
    
    $commands = @(
        "cd $REMOTE_PATH && docker stop $CONTAINER_NAME 2>/dev/null || true",
        "cd $REMOTE_PATH && docker rm $CONTAINER_NAME 2>/dev/null || true"
    )
    
    foreach ($cmd in $commands) {
        ssh $SERVER_USER@$SERVER_IP $cmd
    }
    
    Write-Success "Ancien conteneur arrêté"
}

# Démarrer le nouveau conteneur
function Start-RemoteContainer {
    Write-Info "Démarrage du nouveau conteneur sur le serveur..."
    
    $commands = @(
        "cd $REMOTE_PATH && docker-compose -f docker-compose.cgu.yml pull",
        "cd $REMOTE_PATH && docker-compose -f docker-compose.cgu.yml up -d"
    )
    
    foreach ($cmd in $commands) {
        Write-Info "Exécution : $cmd"
        ssh $SERVER_USER@$SERVER_IP $cmd
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Erreur lors de l'exécution : $cmd"
            throw
        }
    }
    
    Write-Success "Conteneur démarré"
}

# Vérifier le déploiement
function Test-RemoteDeployment {
    Write-Info "Vérification du déploiement..."
    
    # Attendre quelques secondes pour que le conteneur se lance
    Start-Sleep -Seconds 5
    
    # Vérifier le status du conteneur
    $containerStatus = ssh $SERVER_USER@$SERVER_IP "docker ps | grep $CONTAINER_NAME"
    
    if ($containerStatus) {
        Write-Success "Conteneur en cours d'exécution"
        Write-Info "Status : $containerStatus"
    } else {
        Write-Error "Le conteneur ne semble pas s'exécuter"
        
        # Afficher les logs pour diagnostic
        Write-Info "Logs du conteneur :"
        ssh $SERVER_USER@$SERVER_IP "docker logs $CONTAINER_NAME"
        throw
    }
    
    # Test HTTP local sur le serveur
    Write-Info "Test d'accès HTTP local..."
    $httpTest = ssh $SERVER_USER@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:80"
    
    if ($httpTest -eq "200") {
        Write-Success "Test HTTP local réussi (200)"
    } else {
        Write-Warning "Test HTTP local : $httpTest"
    }
}

# Afficher les informations de déploiement
function Show-DeploymentInfo {
    Write-Host ""
    Write-Host "🎉 Déploiement terminé sur le serveur !" -ForegroundColor Green
    Write-Host "======================================="
    Write-Host ""
    
    Write-Host "🌐 Site CGU : https://$CGU_DOMAIN" -ForegroundColor Cyan
    Write-Host "🖥️  Serveur : $SERVER_IP" -ForegroundColor Cyan
    Write-Host "🐳 Conteneur : $CONTAINER_NAME" -ForegroundColor Cyan
    Write-Host "📁 Chemin : $REMOTE_PATH" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📋 Commandes utiles (SSH) :" -ForegroundColor Yellow
    Write-Host "  • Connexion : ssh $SERVER_USER@$SERVER_IP"
    Write-Host "  • Logs : ssh $SERVER_USER@$SERVER_IP 'docker logs -f $CONTAINER_NAME'"
    Write-Host "  • Restart : ssh $SERVER_USER@$SERVER_IP 'docker restart $CONTAINER_NAME'"
    Write-Host "  • Status : ssh $SERVER_USER@$SERVER_IP 'docker ps | grep $CONTAINER_NAME'"
    Write-Host ""
    
    Write-Host "🔧 Monitoring distant :" -ForegroundColor Yellow
    Write-Host "  • Test site : curl -I https://$CGU_DOMAIN"
    Write-Host "  • Certificat SSL : ssh $SERVER_USER@$SERVER_IP 'docker logs traefik | grep $CGU_DOMAIN'"
    Write-Host "  • Config Nginx : ssh $SERVER_USER@$SERVER_IP 'docker exec $CONTAINER_NAME nginx -t'"
    Write-Host ""
    
    Write-Host "✅ Le site CGU est maintenant déployé et accessible !" -ForegroundColor Green
}

# Fonction principale
function Main {
    try {
        Write-Header "Déploiement CGU vers serveur OVH $SERVER_IP"
        
        # Étapes de déploiement
        Test-Prerequisites
        
        if (-not (Test-ServerConnection)) {
            Write-Error "Impossible de se connecter au serveur"
            Write-Info "Vérifiez :"
            Write-Info "  • Votre clé SSH est configurée"
            Write-Info "  • Le serveur $SERVER_IP est accessible"
            Write-Info "  • L'utilisateur $SERVER_USER a les permissions Docker"
            exit 1
        }
        
        New-RemoteDirectory
        Backup-RemoteVersion
        Copy-FilesToServer
        Stop-RemoteContainer
        Start-RemoteContainer
        Test-RemoteDeployment
        Show-DeploymentInfo
        
        Write-Success "🎉 Déploiement réussi !"
        
    }
    catch {
        Write-Error "Erreur lors du déploiement : $_"
        Write-Info "Nettoyage en cours..."
        
        try {
            ssh $SERVER_USER@$SERVER_IP "docker stop $CONTAINER_NAME 2>/dev/null || true"
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