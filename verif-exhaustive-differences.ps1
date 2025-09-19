# 🔍 VÉRIFICATION EXHAUSTIVE DES DIFFÉRENCES FAILDAILY
# Script de vérification complète pour détecter toutes les différences réelles
param(
    [string]$LocalPath = "d:/WEB API/FailDaily",
    [string]$ServerHost = "51.75.55.185", 
    [string]$ServerUser = "taaazzz",
    [string]$ServerPath = "/home/taaazzz/FailDaily",
    [switch]$ShowContent,  # Afficher le contenu des différences
    [switch]$SkipBinary    # Ignorer les fichiers binaires
)

$sshTarget = "${ServerUser}@${ServerHost}"

Write-Host "
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🕵️ ANALYSE EXHAUSTIVE DES DIFFÉRENCES                    ║
║                                                                              ║
║  🎯 Objectif: Détecter TOUTES les différences réelles entre local/serveur   ║
║  📅 Date: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Green

# Extensions de fichiers à analyser en priorité
$criticalExtensions = @('.js', '.ts', '.json', '.html', '.css', '.scss', '.md', '.yml', '.yaml', '.sql', '.ps1', '.sh', '.env', '.txt')
$binaryExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.exe', '.dll', '.so')

# Compteurs
$script:totalFiles = 0
$script:identicalFiles = 0
$script:lineEndingOnly = 0
$script:contentDifferent = 0
$script:localOnlyFiles = 0
$script:remoteOnlyFiles = 0
$script:errorFiles = 0

function Test-IsTextFile {
    param($FilePath)
    $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    return $criticalExtensions -contains $extension
}

function Test-IsBinaryFile {
    param($FilePath)
    $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    return $binaryExtensions -contains $extension
}

function Compare-FileContent {
    param(
        [string]$LocalFile,
        [string]$RemoteFile,
        [string]$RelativePath
    )
    
    $script:totalFiles++
    Write-Progress -Activity "Analyse des fichiers" -Status $RelativePath -PercentComplete (($script:totalFiles % 100))
    
    if (!(Test-Path $LocalFile)) {
        Write-Host "❌ MANQUANT LOCAL: $RelativePath" -ForegroundColor Red
        $script:localOnlyFiles++
        return
    }
    
    # Vérifier si le fichier existe sur le serveur
    $remoteExists = ssh $sshTarget "test -f '$RemoteFile' && echo 'EXISTS' || echo 'MISSING'" 2>$null
    if ($remoteExists -ne "EXISTS") {
        Write-Host "❌ MANQUANT DISTANT: $RelativePath" -ForegroundColor Red
        $script:remoteOnlyFiles++
        return
    }
    
    try {
        # Hash MD5 pour comparaison rapide
        $localHash = (Get-FileHash $LocalFile -Algorithm MD5).Hash
        $remoteHash = ssh $sshTarget "md5sum '$RemoteFile' 2>/dev/null | cut -d' ' -f1" 2>$null
        
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($remoteHash)) {
            Write-Host "⚠️  ERREUR HASH: $RelativePath" -ForegroundColor Yellow
            $script:errorFiles++
            return
        }
        
        if ($localHash.ToLower() -eq $remoteHash.ToLower()) {
            Write-Host "✅ $RelativePath" -ForegroundColor Green
            $script:identicalFiles++
            return
        }
        
        # Hash différent - analyser en détail
        $isTextFile = Test-IsTextFile $LocalFile
        $isBinaryFile = Test-IsBinaryFile $LocalFile
        
        if ($SkipBinary -and $isBinaryFile) {
            Write-Host "⏭️  BINAIRE IGNORÉ: $RelativePath" -ForegroundColor Gray
            return
        }
        
        # Comparer les tailles
        $localSize = (Get-Item $LocalFile).Length
        try {
            $remoteSize = [int](ssh $sshTarget "stat -c%s '$RemoteFile'" 2>$null)
        } catch {
            $remoteSize = 0
        }
        
        Write-Host "🔍 DIFFÉRENCE DÉTECTÉE: $RelativePath" -ForegroundColor Yellow
        Write-Host "   📏 Tailles: Local=$localSize, Remote=$remoteSize, Diff=$($localSize - $remoteSize)" -ForegroundColor Gray
        Write-Host "   🔑 Hash:    Local=$localHash, Remote=$($remoteHash.ToUpper())" -ForegroundColor Gray
        
        if ($isTextFile) {
            # Pour les fichiers texte, analyser le contenu
            try {
                # Compter les lignes
                $localLines = (Get-Content $LocalFile).Count
                try {
                    $remoteLines = [int](ssh $sshTarget "wc -l '$RemoteFile' | cut -d' ' -f1" 2>$null)
                } catch {
                    $remoteLines = 0
                }
                
                Write-Host "   📝 Lignes:  Local=$localLines, Remote=$remoteLines" -ForegroundColor Gray
                
                # Test de fins de ligne
                $sizeDiff = $localSize - $remoteSize
                $expectedLineEndingDiff = $localLines
                
                # Tolérance pour fins de ligne mixtes ou incomplètes
                $tolerance = [math]::Max(5, [math]::Round($expectedLineEndingDiff * 0.15))
                
                if ([math]::Abs($sizeDiff - $expectedLineEndingDiff) -le $tolerance -and $localLines -eq $remoteLines) {
                    Write-Host "   ✅ DIAGNOSTIC: Fins de ligne seulement (CRLF vs LF)" -ForegroundColor Green
                    $script:lineEndingOnly++
                } else {
                    Write-Host "   ❌ DIAGNOSTIC: Différence de CONTENU RÉEL" -ForegroundColor Red
                    $script:contentDifferent++
                    
                    # Si demandé, afficher les premières différences
                    if ($ShowContent) {
                        Write-Host "   📄 CONTENU LOCAL (10 premières lignes):" -ForegroundColor Cyan
                        Get-Content $LocalFile -Head 10 | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
                        
                        Write-Host "   📄 CONTENU DISTANT (10 premières lignes):" -ForegroundColor Cyan
                        try {
                            $remoteContent = ssh $sshTarget "head -n 10 '$RemoteFile'" 2>$null
                            $remoteContent -split "`n" | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
                        } catch {
                            Write-Host "      Erreur lecture contenu distant" -ForegroundColor Red
                        }
                        
                        Write-Host "" # Ligne vide pour lisibilité
                    }
                }
                
            } catch {
                Write-Host "   ⚠️  ERREUR ANALYSE: $($_.Exception.Message)" -ForegroundColor Yellow
                $script:contentDifferent++
            }
        } else {
            # Fichier binaire ou inconnu
            Write-Host "   📦 TYPE: Fichier binaire ou non-texte" -ForegroundColor Gray
            $script:contentDifferent++
        }
        
    } catch {
        Write-Host "❌ ERREUR: $RelativePath - $($_.Exception.Message)" -ForegroundColor Red
        $script:errorFiles++
    }
}

# Obtenir la liste complète des fichiers FailDaily (exclusions optimisées)
Write-Host "🔍 Scan des fichiers FailDaily (APPLICATION SEULEMENT)..." -ForegroundColor Cyan

# Dossiers de l'application à inclure UNIQUEMENT
$appDirectories = @(
    "backend-api/src",
    "backend-api/migrations", 
    "backend-api/scripts",
    "frontend/src",
    "docker",
    "docs", 
    "e2e/cypress",
    "scripts"
)

# Fichiers racine essentiels
$rootFiles = @(
    "package.json",
    "README.md", 
    "AGENTS.md",
    ".gitignore",
    ".env.example",
    "docker-compose*.yml"
)

# Fichiers de configuration importants (avec chemin relatif)
$configFiles = @(
    "backend-api/package.json",
    "backend-api/.env.example", 
    "backend-api/server.js",
    "frontend/package.json",
    "frontend/angular.json",
    "frontend/ionic.config.json",
    "frontend/capacitor.config.ts",
    "frontend/tsconfig.json",
    "frontend/tsconfig.app.json"
)

# Extensions de fichiers à inclure (application seulement)
$appExtensions = @('.js', '.ts', '.json', '.html', '.css', '.scss', '.md', '.yml', '.yaml', '.sql', '.sh', '.ps1', '.env', '.txt', '.mjs', '.cjs')

$allFiles = Get-ChildItem -Path $LocalPath -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($LocalPath.Length + 1).Replace('\', '/')
    $extension = $_.Extension.ToLower()
    $isAppExtension = $appExtensions -contains $extension
    
    # Exclusions globales (plus strictes)
    if ($_.FullName -match "node_modules|\.git[\\/]|\.angular|\.vscode|\.nx|\.local-node|dist[\\/]|www[\\/]|coverage|\.cache|\.tmp|uploads[\\/]|logs[\\/]|android[\\/]|ios[\\/]|\.nyc_output") {
        return $false
    }
    
    # Exclusions par noms de fichiers
    if ($_.Name -match "\.log$|\.lock$|package-lock\.json$|yarn\.lock$|\.DS_Store$|Thumbs\.db$|\.env\.local$|\.env\.production$") {
        return $false
    }
    
    # Exclusions de scripts temporaires créés pour la sync
    if ($_.Name -match "verif-exhaustive-differences\.ps1$|check-server-sync.*\.ps1$|rapport-sync-final\.ps1$|test-line-endings\.ps1$|server-sync-commands\.txt$|CONFIG_PRIVÉ\.md$") {
        return $false
    }
    
    # Inclure les fichiers racine essentiels
    if ($_.Directory.FullName -eq $LocalPath) {
        $matchesRootFile = $false
        foreach ($rootPattern in $rootFiles) {
            if ($_.Name -like $rootPattern) {
                $matchesRootFile = $true
                break
            }
        }
        return $matchesRootFile -and $isAppExtension
    }
    
    # Inclure les fichiers de configuration spécifiques
    $matchesConfigFile = $configFiles | Where-Object { $relativePath -eq $_ }
    if ($matchesConfigFile) {
        return $true
    }
    
    # Inclure les dossiers d'application ET avoir une extension valide
    $isInAppDirectory = $appDirectories | Where-Object { $relativePath.StartsWith($_.Replace('\', '/')) }
    
    return $isInAppDirectory -and $isAppExtension
}

Write-Host "📊 $($allFiles.Count) fichiers à analyser" -ForegroundColor White

# Analyser chaque fichier
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($LocalPath.Length + 1).Replace('\', '/')
    $remoteFilePath = "$ServerPath/$relativePath"
    
    Compare-FileContent $file.FullName $remoteFilePath $relativePath
}

Write-Progress -Completed -Activity "Analyse des fichiers"

# Rapport final détaillé
Write-Host "
╔══════════════════════════════════════════════════════════════════════════════╗
║                             📊 RAPPORT FINAL DÉTAILLÉ                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Green

Write-Host "📈 STATISTIQUES GLOBALES:" -ForegroundColor Cyan
Write-Host "   📁 Total fichiers analysés: $script:totalFiles" -ForegroundColor White
Write-Host "   ✅ Fichiers identiques: $script:identicalFiles" -ForegroundColor Green
Write-Host "   ⚠️  Fins de ligne seulement: $script:lineEndingOnly" -ForegroundColor Yellow
Write-Host "   ❌ Différences de contenu: $script:contentDifferent" -ForegroundColor Red
Write-Host "   📂 Manquants localement: $script:localOnlyFiles" -ForegroundColor Magenta
Write-Host "   📂 Manquants à distance: $script:remoteOnlyFiles" -ForegroundColor Magenta
Write-Host "   ⚠️  Erreurs d'analyse: $script:errorFiles" -ForegroundColor Yellow

$totalDifferences = $script:contentDifferent + $script:localOnlyFiles + $script:remoteOnlyFiles
$percentIdentical = if ($script:totalFiles -gt 0) { [math]::Round(($script:identicalFiles + $script:lineEndingOnly) * 100 / $script:totalFiles, 2) } else { 0 }

Write-Host "`n🎯 ÉVALUATION:" -ForegroundColor Cyan
if ($totalDifferences -eq 0) {
    Write-Host "   🎉 PARFAIT! Tous les fichiers sont synchronisés" -ForegroundColor Green
    Write-Host "   ✅ $percentIdentical% de fichiers identiques (contenu)" -ForegroundColor Green
} elseif ($script:contentDifferent -eq 0) {
    Write-Host "   ✅ EXCELLENT! Seules les fins de ligne diffèrent" -ForegroundColor Green
    Write-Host "   ✅ $percentIdentical% de fichiers identiques (contenu)" -ForegroundColor Green
} elseif ($script:contentDifferent -le 5) {
    Write-Host "   ⚠️  BON: Quelques différences mineures ($script:contentDifferent fichiers)" -ForegroundColor Yellow
    Write-Host "   📊 $percentIdentical% de fichiers identiques (contenu)" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ ATTENTION: $script:contentDifferent fichiers avec différences importantes" -ForegroundColor Red
    Write-Host "   📊 $percentIdentical% de fichiers identiques (contenu)" -ForegroundColor Red
}

Write-Host "`n💡 RECOMMANDATIONS:" -ForegroundColor Cyan
if ($script:contentDifferent -eq 0) {
    Write-Host "   ✅ Aucune action requise - synchronisation parfaite!" -ForegroundColor Green
} else {
    Write-Host "   🔧 Analysez les $script:contentDifferent fichier(s) avec différences de contenu" -ForegroundColor Yellow
    Write-Host "   💻 Relancez avec -ShowContent pour voir les détails" -ForegroundColor Yellow
}

Write-Host "
═══════════════════════════════════════════════════════════════════════════════
🎯 Analyse terminée! Utilisez -ShowContent pour voir le contenu des différences
═══════════════════════════════════════════════════════════════════════════════
" -ForegroundColor Green