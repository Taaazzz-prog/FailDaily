# Script de déploiement avec base logs séparée
# FailDaily - Configuration Docker avancée

Write-Host "🚀 Déploiement FailDaily avec base logs séparée" -ForegroundColor Green

# Vérification des prérequis
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé ou accessible" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose n'est pas installé ou accessible" -ForegroundColor Red
    exit 1
}

# Navigation vers le répertoire docker
Set-Location -Path "d:/WEB API/FailDaily/docker"

# Arrêt des services existants si ils tournent
Write-Host "🛑 Arrêt des services existants..." -ForegroundColor Yellow
docker-compose -f docker-compose.yaml down -v 2>$null

# Copie du fichier d'environnement
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.logs") {
        Copy-Item ".env.logs" ".env"
        Write-Host "✅ Fichier .env créé depuis .env.logs" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Fichier .env.logs non trouvé, utilisation des valeurs par défaut" -ForegroundColor Yellow
    }
}

# Construction des images
Write-Host "🔨 Construction des images Docker..." -ForegroundColor Cyan
docker-compose -f docker-compose-with-logs.yml build

# Démarrage des bases de données d'abord
Write-Host "🗄️ Démarrage des bases de données..." -ForegroundColor Cyan
docker-compose -f docker-compose-with-logs.yml up -d db logs_db

# Attente de la disponibilité des bases
Write-Host "⏳ Attente démarrage bases de données (30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Initialisation base logs
Write-Host "📝 Initialisation base de données logs..." -ForegroundColor Cyan
docker exec faildaily_logs_db mysql -u root -p@51008473@Alexia@Logs -e "source /docker-entrypoint-initdb.d/init-logs-database.sql" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base logs initialisée avec succès" -ForegroundColor Green
} else {
    Write-Host "⚠️ Initialisation base logs via fichier SQL échouée, tentative manuelle..." -ForegroundColor Yellow
    
    # Création manuelle de la base
    $sqlCommands = @"
CREATE DATABASE IF NOT EXISTS faildaily_logs;
USE faildaily_logs;
CREATE TABLE activity_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSON DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"@
    
    docker exec faildaily_logs_db mysql -u root -p@51008473@Alexia@Logs -e $sqlCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base logs créée manuellement" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec création base logs" -ForegroundColor Red
    }
}

# Démarrage de tous les services
Write-Host "🌐 Démarrage de tous les services..." -ForegroundColor Cyan
docker-compose -f docker-compose-with-logs.yml up -d

# Attente démarrage complet
Write-Host "⏳ Attente démarrage complet (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Vérification des services
Write-Host "🔍 Vérification des services..." -ForegroundColor Cyan

$services = @(
    @{Name="faildaily_db"; Port=3306; Description="Base principale"},
    @{Name="faildaily_logs_db"; Port=3307; Description="Base logs"},
    @{Name="faildaily_backend"; Port=3000; Description="API Backend"},
    @{Name="faildaily_frontend"; Port=80; Description="Frontend"},
    @{Name="faildaily_traefik"; Port=8080; Description="Traefik Dashboard"}
)

foreach ($service in $services) {
    $status = docker ps --filter "name=$($service.Name)" --format "{{.Status}}"
    if ($status -match "Up") {
        Write-Host "✅ $($service.Description) ($($service.Name)) - OK" -ForegroundColor Green
    } else {
        Write-Host "❌ $($service.Description) ($($service.Name)) - Erreur" -ForegroundColor Red
    }
}

# Test de connectivité
Write-Host "🌐 Tests de connectivité..." -ForegroundColor Cyan

# Test API
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method GET -TimeoutSec 10
    if ($healthCheck.status -eq "OK") {
        Write-Host "✅ API Backend accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API Backend inaccessible" -ForegroundColor Red
}

# Test Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend inaccessible" -ForegroundColor Red
}

# Test bases de données
Write-Host "🗄️ Test connexions bases de données..." -ForegroundColor Cyan

# Test base principale
$dbTest = docker exec faildaily_db mysql -u faildaily_user -p@51008473@Alexia@ -e "SELECT 1 as test;" faildaily 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base principale connectée" -ForegroundColor Green
} else {
    Write-Host "❌ Base principale inaccessible" -ForegroundColor Red
}

# Test base logs
$logsDbTest = docker exec faildaily_logs_db mysql -u logs_user -p@51008473@Alexia@Logs -e "SELECT COUNT(*) as logs_count FROM activity_logs;" faildaily_logs 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base logs connectée" -ForegroundColor Green
} else {
    Write-Host "❌ Base logs inaccessible" -ForegroundColor Red
}

# Affichage des URLs finales
Write-Host "`n🎯 URLs d'accès:" -ForegroundColor Magenta
Write-Host "   Frontend: http://localhost:8000" -ForegroundColor White
Write-Host "   API: http://localhost:8000/api" -ForegroundColor White
Write-Host "   Traefik Dashboard: http://localhost:8080" -ForegroundColor White
Write-Host "   Base principale: localhost:3306" -ForegroundColor White
Write-Host "   Base logs: localhost:3307" -ForegroundColor White

# Affichage logs en temps réel
Write-Host "`n📋 Pour voir les logs en temps réel:" -ForegroundColor Magenta
Write-Host "   docker-compose -f docker-compose-with-logs.yml logs -f backend" -ForegroundColor White

Write-Host "`n🎉 Déploiement terminé!" -ForegroundColor Green