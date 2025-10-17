# Version complète du script de synchronisation
# =============================================

param(
    [string]$ServerHost = "51.75.55.185",
    [string]$ServerUser = "taaazzz", 
    [string]$ServerPath = "/home/taaazzz/FailDaily",
    [string]$LocalPath = "d:/WEB API/FailDaily",
    [switch]$FullSync = $false,
    [switch]$CriticalOnly = $false
)

Write-Host "🔍 Vérification synchronisation FailDaily" -ForegroundColor Green
Write-Host "Local:  $LocalPath" -ForegroundColor Blue
Write-Host "Serveur: ${ServerUser}@${ServerHost}:${ServerPath}" -ForegroundColor Blue
Write-Host ""

if ($FullSync) {
    Write-Host "🌐 Mode: Comparaison COMPLÈTE de tous les fichiers" -ForegroundColor Yellow
} elseif ($CriticalOnly) {
    Write-Host "⚡ Mode: Fichiers CRITIQUES seulement" -ForegroundColor Yellow
} else {
    Write-Host "📁 Mode: Dossiers IMPORTANTS" -ForegroundColor Yellow
}

Write-Host ""

# Fonction pour comparer les hash de fichiers
function Compare-FileHashes {
    param($LocalFile, $RemoteFile)
    
    if (!(Test-Path $LocalFile)) {
        Write-Host "❌ $LocalFile (fichier local manquant)" -ForegroundColor Red
        return $false
    }
    
    # Hash local
    $localHash = (Get-FileHash $LocalFile -Algorithm MD5).Hash
    
    # Hash distant via SSH
    $remoteHash = ssh "${ServerUser}@${ServerHost}" "md5sum '$RemoteFile' 2>/dev/null | cut -d' ' -f1"
    
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($remoteHash)) {
        Write-Host "❌ $LocalFile (fichier distant manquant)" -ForegroundColor Red
        return $false
    }
    
    if ($localHash.ToLower() -eq $remoteHash.ToLower()) {
        Write-Host "✅ $LocalFile" -ForegroundColor Green
        return $true
    } else {
        # Vérifier si c'est uniquement une différence de fins de ligne (CRLF vs LF)
        $isLineEndingOnly = $false
        $extension = [System.IO.Path]::GetExtension($LocalFile).ToLower()
        $textExtensions = @('.js', '.ts', '.json', '.html', '.css', '.scss', '.md', '.txt', '.yml', '.yaml', '.ps1', '.sh', '.sql')
        
        if ($textExtensions -contains $extension) {
            try {
                $localContent = Get-Content $LocalFile -Raw
                $remoteContent = ssh "${ServerUser}@${ServerHost}" "cat '$RemoteFile'" 2>$null
                
                if ($LASTEXITCODE -eq 0 -and $remoteContent) {
                    # Normaliser les fins de ligne pour comparaison
                    $localNormalized = $localContent -replace "`r`n", "`n" -replace "`r", "`n"
                    $remoteNormalized = $remoteContent -replace "`r`n", "`n" -replace "`r", "`n"
                    
                    if ($localNormalized -eq $remoteNormalized) {
                        $isLineEndingOnly = $true
                    }
                }
            } catch {
                # En cas d'erreur, on considère que ce n'est pas juste les fins de ligne
            }
        }
        
        if ($isLineEndingOnly) {
            Write-Host "⚠️  $LocalFile (fins de ligne CRLF/LF)" -ForegroundColor Yellow
            Write-Host "   Local:  $localHash (Windows CRLF)" -ForegroundColor Gray  
            Write-Host "   Remote: $remoteHash (Linux LF)" -ForegroundColor Gray
            return $true  # Considéré comme identique pour nos besoins
        } else {
            Write-Host "❌ $LocalFile (contenu différent)" -ForegroundColor Red
            Write-Host "   Local:  $localHash" -ForegroundColor Gray
            Write-Host "   Remote: $remoteHash" -ForegroundColor Gray
            return $false
        }
    }
}

# Fichiers critiques pour le fonctionnement de FailDaily
$criticalFiles = @(
    # Configuration principale
    "backend-api/server.js",
    "backend-api/package.json",
    "frontend/package.json",
    
    # Configuration environnements
    "frontend/src/environments/environment.ts",
    "frontend/src/environments/environment.prod.ts",
    "backend-api/.env.example",
    
    # Configuration Angular/Ionic
    "frontend/angular.json",
    "frontend/ionic.config.json",
    "frontend/capacitor.config.ts",
    
    # Configuration Docker
    "docker/docker-compose.yaml",
    "docker/backend.Dockerfile", 
    "docker/frontend.Dockerfile",
    "docker/nginx.conf",
    
    # Fichiers racine application
    "frontend/src/main.ts",
    "frontend/src/app/app.component.ts",
    "frontend/src/app/app.routes.ts"
)

# Dossiers essentiels pour le fonctionnement de l'application
$essentialDirs = @(
    # Backend - logique métier
    "backend-api/src/controllers",
    "backend-api/src/routes", 
    "backend-api/src/middleware",
    "backend-api/src/services",
    "backend-api/src/config",
    "backend-api/migrations",
    
    # Frontend - composants et services
    "frontend/src/app/services",
    "frontend/src/app/pages",
    "frontend/src/app/components",
    "frontend/src/app/guards",
    "frontend/src/app/models",
    "frontend/src/environments",
    
    # Home page (page principale)
    "frontend/src/home",
    
    # Configuration essentielle
    "docker",
    
    # Scripts de déploiement
    "scripts"
)

# Types de fichiers à inclure (extension whitelist)
$allowedExtensions = @(
    '.ts', '.js',           # Code TypeScript/JavaScript
    '.json',                # Configuration
    '.html',                # Templates
    '.scss', '.css',        # Styles
    '.yml', '.yaml',        # Docker/Config
    '.sh', '.ps1',          # Scripts
    '.md',                  # Documentation critique
    '.sql'                  # Scripts BDD
)

$differences = 0

if ($CriticalOnly) {
    # Mode fichiers critiques seulement
    Write-Host "🔍 Vérification des fichiers critiques FailDaily:" -ForegroundColor Yellow
    foreach ($file in $criticalFiles) {
        $localFile = Join-Path $LocalPath $file
        $remoteFile = "$ServerPath/$($file -replace '\\', '/')"
        if (!(Compare-FileHashes $localFile $remoteFile)) {
            $differences++
        }
    }
} elseif ($FullSync) {
    # Mode comparaison complète
    Write-Host "🔍 Comparaison COMPLÈTE de tous les fichiers (peut prendre du temps):" -ForegroundColor Yellow
    
    # Obtenir la liste de tous les fichiers (exclusions optimisées pour FailDaily)
    $allFiles = Get-ChildItem -Path $LocalPath -Recurse -File | Where-Object {
        # Exclusions des dossiers inutiles
        $_.FullName -notmatch "node_modules" -and
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "\.angular" -and
        $_.FullName -notmatch "\.vscode" -and
        $_.FullName -notmatch "\.local-node" -and
        $_.FullName -notmatch "uploads" -and
        $_.FullName -notmatch "\.log" -and
        $_.FullName -notmatch "data" -and
        $_.FullName -notmatch "dist" -and
        $_.FullName -notmatch "www" -and
        $_.FullName -notmatch "\.cache" -and
        $_.FullName -notmatch "tmp" -and
        $_.FullName -notmatch "temp" -and
        $_.FullName -notmatch "android" -and
        $_.FullName -notmatch "ios" -and
        $_.FullName -notmatch "tests" -and
        $_.FullName -notmatch "cypress" -and
        $_.FullName -notmatch "e2e" -and
        # Inclure seulement les extensions nécessaires
        $_.Extension -in $allowedExtensions
    }
    
    Write-Host "📊 Nombre de fichiers à vérifier: $($allFiles.Count)" -ForegroundColor Blue
    
    $processed = 0
    foreach ($file in $allFiles) {
        $processed++
        $relativePath = $file.FullName.Substring($LocalPath.Length + 1) -replace '\\', '/'
        $remoteFile = "$ServerPath/$relativePath"
        
        Write-Progress -Activity "Vérification fichiers" -Status $relativePath -PercentComplete (($processed / $allFiles.Count) * 100)
        
        if (!(Compare-FileHashes $file.FullName $remoteFile)) {
            $differences++
        }
    }
    Write-Progress -Completed -Activity "Vérification fichiers"
} else {
    # Mode dossiers essentiels FailDaily (par défaut)
    Write-Host "🔍 Vérification des dossiers essentiels FailDaily:" -ForegroundColor Yellow
    
    foreach ($dir in $essentialDirs) {
        $localDir = Join-Path $LocalPath $dir
        if (Test-Path $localDir) {
            Write-Host "📁 Dossier: $dir" -ForegroundColor Cyan
            $files = Get-ChildItem -Path $localDir -Recurse -File | Where-Object {
                $_.FullName -notmatch "\.angular" -and
                $_.FullName -notmatch "\.vscode" -and
                $_.FullName -notmatch "\.local-node" -and
                $_.FullName -notmatch "dist" -and
                $_.FullName -notmatch "www" -and
                $_.FullName -notmatch "\.cache" -and
                $_.FullName -notmatch "node_modules" -and
                $_.FullName -notmatch "tests" -and
                $_.FullName -notmatch "test" -and
                $_.FullName -notmatch "spec" -and
                $_.Extension -in $allowedExtensions
            }
            
            foreach ($file in $files) {
                $relativePath = $file.FullName.Substring($LocalPath.Length + 1) -replace '\\', '/'
                $remoteFile = "$ServerPath/$relativePath"
                if (!(Compare-FileHashes $file.FullName $remoteFile)) {
                    $differences++
                }
            }
        }
    }
}

Write-Host ""
if ($differences -eq 0) {
    Write-Host "✅ Tous les fichiers vérifiés sont synchronisés !" -ForegroundColor Green
} else {
    Write-Host "❌ $differences fichier(s) différent(s) détecté(s)" -ForegroundColor Red
}

# Vérifier Git
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
}

Write-Host ""
Write-Host "💡 Utilisation:" -ForegroundColor Yellow
Write-Host "   .\check-server-sync-full.ps1                    # Dossiers essentiels FailDaily (défaut)"
Write-Host "   .\check-server-sync-full.ps1 -CriticalOnly      # 17 fichiers critiques seulement"
Write-Host "   .\check-server-sync-full.ps1 -FullSync          # TOUS les fichiers nécessaires"