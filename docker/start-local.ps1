# ====================================================================
# 🚀 Script de lancement FailDaily Local avec Docker
# ====================================================================
# Usage: .\start-local.ps1 [--with-data] [--rebuild]
#
# Options:
#   --with-data    : Importe automatiquement la structure de base de données
#   --rebuild      : Force la reconstruction des images Docker
#   --help         : Affiche cette aide
# ====================================================================

param(
    [switch]$WithData,
    [switch]$Rebuild,
    [switch]$Help
)

# Affichage de l'aide
if ($Help) {
    Write-Host "🚀 Script de lancement FailDaily Local" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\start-local.ps1                # Lancement simple"
    Write-Host "  .\start-local.ps1 --with-data    # Avec import de la DB"
    Write-Host "  .\start-local.ps1 --rebuild      # Avec rebuild des images"
    Write-Host "  .\start-local.ps1 --help         # Affiche cette aide"
    Write-Host ""
    Write-Host "URLs d'accès après lancement:"
    Write-Host "  Frontend:  http://localhost:8080" -ForegroundColor Green
    Write-Host "  Backend:   http://localhost:3000" -ForegroundColor Green
    Write-Host "  Database:  localhost:3307" -ForegroundColor Green
    exit 0
}

Write-Host "🐳 Lancement de FailDaily en local avec Docker" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Vérifier que Docker est disponible
try {
    docker --version | Out-Null
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé ou pas accessible" -ForegroundColor Red
    Write-Host "Veuillez installer Docker Desktop : https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Vérifier que docker-compose est disponible
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose n'est pas disponible" -ForegroundColor Red
    exit 1
}

# Se positionner dans le bon répertoire
$dockerPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dockerPath
Write-Host "📁 Répertoire de travail: $dockerPath" -ForegroundColor Blue

# Vérifier que le fichier docker-compose.yaml existe
if (-not (Test-Path "docker-compose.yaml")) {
    Write-Host "❌ Fichier docker-compose.yaml non trouvé" -ForegroundColor Red
    exit 1
}

# Créer le fichier .env s'il n'existe pas
if (-not (Test-Path ".env")) {
    Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  Fichier .env.example non trouvé, création d'un .env basique" -ForegroundColor Yellow
        @"
# Configuration Docker pour FailDaily Local
DB_ROOT_PASSWORD=faildaily_root_password
DB_NAME=faildaily
DB_USER=faildaily_user
DB_PASSWORD=faildaily_password
DB_HOST=db
DB_PORT=3306
NODE_ENV=development
PORT=3000
JWT_SECRET=local-dev-jwt-secret-change-me
API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
CORS_ORIGIN=http://localhost:8080
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
    Write-Host "✅ Fichier .env créé" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Lancement des services Docker..." -ForegroundColor Cyan

# Arrêter les conteneurs existants
Write-Host "🛑 Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose down 2>$null

# Construire et lancer les services
if ($Rebuild) {
    Write-Host "🔨 Reconstruction des images..." -ForegroundColor Yellow
    docker-compose up --build -d
} else {
    docker-compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du lancement de Docker Compose" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services Docker lancés" -ForegroundColor Green

# Attendre que MySQL soit prêt
Write-Host "⏳ Attente que MySQL soit prêt..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Start-Sleep 2
    $mysqlReady = docker exec faildaily_db mysqladmin ping -h localhost -u root -pfaildaily_root_password 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL est prêt" -ForegroundColor Green
        break
    }
    Write-Host "⏳ Tentative $attempt/$maxAttempts..." -ForegroundColor Yellow
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Timeout: MySQL n'est pas prêt après $maxAttempts tentatives" -ForegroundColor Red
    Write-Host "Vérifiez les logs: docker-compose logs db" -ForegroundColor Yellow
    exit 1
}

# Importer la structure de base de données si demandé
if ($WithData) {
    Write-Host ""
    Write-Host "📊 Import de la structure de base de données..." -ForegroundColor Cyan
    
    $sqlFile = "../docs/MIGRATION_MySQL_FailDaily_COMPLETE.sql.backup"
    if (Test-Path $sqlFile) {
        # Copier le fichier SQL dans le conteneur
        docker cp $sqlFile faildaily_db:/tmp/init.sql
        
        # Exécuter le script SQL
        docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily -e "source /tmp/init.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Structure de base de données importée" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Erreur lors de l'import, mais les services continuent" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Fichier SQL non trouvé: $sqlFile" -ForegroundColor Yellow
    }
}

# Afficher le statut des services
Write-Host ""
Write-Host "📊 Statut des services:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🎉 FailDaily est maintenant accessible!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "🌐 Frontend (Angular/Ionic): http://localhost:8080" -ForegroundColor White
Write-Host "🔧 Backend API:              http://localhost:3000" -ForegroundColor White
Write-Host "🗄️  Base de données MySQL:   localhost:3307" -ForegroundColor White
Write-Host "   Username: faildaily_user" -ForegroundColor Gray
Write-Host "   Password: faildaily_password" -ForegroundColor Gray
Write-Host "   Database: faildaily" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Commandes utiles:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f           # Voir les logs en temps réel" -ForegroundColor Gray
Write-Host "  docker-compose restart backend   # Redémarrer le backend" -ForegroundColor Gray
Write-Host "  docker-compose down              # Arrêter tous les services" -ForegroundColor Gray
Write-Host "  docker exec -it faildaily_db mysql -u faildaily_user -pfaildaily_password faildaily" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 Pour importer des données de production:" -ForegroundColor Yellow
Write-Host "   1. Placez votre dump SQL dans ce dossier" -ForegroundColor Gray
Write-Host "   2. docker cp your_dump.sql faildaily_db:/tmp/" -ForegroundColor Gray
Write-Host "   3. docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily < /tmp/your_dump.sql" -ForegroundColor Gray
