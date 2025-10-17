# Script de vérification synchronisation serveur FailDaily
# ======================================================

param(
    [string]$ServerHost = "51.75.55.185",
    
    [string]$ServerUser = "taaazzz",
    
    [string]$ServerPath = "/home/taaazzz/FailDaily",
    
    [string]$LocalPath = "d:/WEB API/FailDaily"
)

Write-Host "🔍 Vérification synchronisation FailDaily" -ForegroundColor Green
Write-Host "Local:  $LocalPath" -ForegroundColor Blue
Write-Host "Serveur: ${ServerUser}@${ServerHost}:${ServerPath}" -ForegroundColor Blue
Write-Host ""

# Fonction pour comparer les hash de fichiers
function Compare-FileHashes {
    param($LocalFile, $RemoteFile)
    
    # Hash local
    $localHash = (Get-FileHash $LocalFile -Algorithm MD5).Hash
    
    # Hash distant via SSH
    $remoteHash = ssh "${ServerUser}@${ServerHost}" "md5sum '$RemoteFile' 2>/dev/null | cut -d' ' -f1"
    
    if ($localHash.ToLower() -eq $remoteHash.ToLower()) {
        Write-Host "✅ $LocalFile" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $LocalFile (différent)" -ForegroundColor Red
        Write-Host "   Local:  $localHash" -ForegroundColor Gray
        Write-Host "   Remote: $remoteHash" -ForegroundColor Gray
        return $false
    }
}

# Fichiers critiques à vérifier
$criticalFiles = @(
    "frontend/src/environments/environment.ts",
    "frontend/src/app/services/mysql.service.ts", 
    "backend-api/server.js",
    "backend-api/src/controllers/failsController.js",
    "backend-api/package.json",
    "frontend/package.json",
    "docker-compose.yml"
)

Write-Host "🔍 Vérification des fichiers critiques:" -ForegroundColor Yellow
Write-Host ""

$differences = 0
foreach ($file in $criticalFiles) {
    $localFile = Join-Path $LocalPath $file
    $remoteFile = "$ServerPath/$($file -replace '\\', '/')"
    
    if (Test-Path $localFile) {
        if (!(Compare-FileHashes $localFile $remoteFile)) {
            $differences++
        }
    } else {
        Write-Host "⚠️  $file (fichier local manquant)" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($differences -eq 0) {
    Write-Host "✅ Tous les fichiers critiques sont synchronisés !" -ForegroundColor Green
} else {
    Write-Host "❌ $differences fichier(s) différent(s) détecté(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Pour synchroniser:" -ForegroundColor Yellow
    Write-Host "rsync -avz --exclude node_modules --exclude .git '$LocalPath/' '${ServerUser}@${ServerHost}:${ServerPath}/'"
}

# Vérifier les derniers commits
Write-Host ""
Write-Host "🔍 Vérification Git:" -ForegroundColor Yellow
$localCommit = git -C "$LocalPath" rev-parse HEAD
$remoteCommit = ssh "${ServerUser}@${ServerHost}" "cd '$ServerPath' && git rev-parse HEAD 2>/dev/null"

if ($localCommit -eq $remoteCommit) {
    Write-Host "✅ Même commit Git: $($localCommit.Substring(0,8))" -ForegroundColor Green
} else {
    Write-Host "❌ Commits différents:" -ForegroundColor Red
    Write-Host "   Local:  $($localCommit.Substring(0,8))" -ForegroundColor Gray
    Write-Host "   Remote: $($remoteCommit.Substring(0,8))" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Pour synchroniser Git:" -ForegroundColor Yellow
    Write-Host "ssh '${ServerUser}@${ServerHost}' 'cd $ServerPath && git pull origin main'"
}