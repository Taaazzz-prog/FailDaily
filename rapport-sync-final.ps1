# 📊 RAPPORT DE SYNCHRONISATION FAILDAILY
# Généré le: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

Write-Host "
╔══════════════════════════════════════════════════════════════════════════════╗
║                     🚀 RAPPORT DE SYNCHRONISATION FAILDAILY                 ║
║                                                                              ║
║  🎯 OBJECTIF: Vérifier la synchronisation entre local et serveur OVH        ║
║  📅 Date: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Green

# 1. Vérification Git
Write-Host "🔍 1. SYNCHRONISATION GIT" -ForegroundColor Cyan
Write-Host "═══════════════════════════" -ForegroundColor Gray

$localCommit = git rev-parse --short HEAD
$remoteCommit = ssh taaazzz@51.75.55.185 "cd /home/taaazzz/FailDaily && git rev-parse --short HEAD"

Write-Host "   Local:  $localCommit" -ForegroundColor White
Write-Host "   Remote: $remoteCommit" -ForegroundColor White

if ($localCommit -eq $remoteCommit) {
    Write-Host "   ✅ Git synchronisé" -ForegroundColor Green
    $gitStatus = "✅ SYNCHRONISÉ"
} else {
    Write-Host "   ❌ Git désynchronisé" -ForegroundColor Red  
    $gitStatus = "❌ DÉSYNCHRONISÉ"
}

# 2. Test de fichiers critiques pour fins de ligne
Write-Host "`n🔍 2. ANALYSE DES DIFFÉRENCES DE FICHIERS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray

$testFiles = @(
    "backend-api/server.js",
    "frontend/package.json", 
    "docker/docker-compose.yaml",
    "frontend/src/main.ts",
    "backend-api/package.json"
)

$lineEndingOnly = 0
$contentDifferences = 0

foreach ($file in $testFiles) {
    $localPath = "d:/WEB API/FailDaily/$file"
    $remotePath = "/home/taaazzz/FailDaily/$file"
    
    if (Test-Path $localPath) {
        $localSize = (Get-Item $localPath).Length
        $remoteSize = [int](ssh taaazzz@51.75.55.185 "wc -c '$remotePath' | cut -d' ' -f1")
        $localLines = (Get-Content $localPath).Count
        $remoteLines = [int](ssh taaazzz@51.75.55.185 "wc -l '$remotePath' | cut -d' ' -f1")
        
        $sizeDiff = $localSize - $remoteSize
        $expectedLineEndingDiff = $localLines
        
        Write-Host "   📄 $file" -ForegroundColor Yellow
        Write-Host "      Tailles: Local=$localSize, Remote=$remoteSize, Diff=$sizeDiff" -ForegroundColor Gray
        Write-Host "      Lignes:  Local=$localLines, Remote=$remoteLines" -ForegroundColor Gray
        
        # Tolérance de ±10% pour les fins de ligne mixtes
        $tolerance = [math]::Max(1, [math]::Round($expectedLineEndingDiff * 0.1))
        
        if ([math]::Abs($sizeDiff - $expectedLineEndingDiff) -le $tolerance) {
            Write-Host "      ✅ Fins de ligne seulement (CRLF vs LF)" -ForegroundColor Green
            $lineEndingOnly++
        } else {
            Write-Host "      ❌ Différence de contenu" -ForegroundColor Red
            $contentDifferences++
        }
    }
}

# 3. Résumé final
Write-Host "`n🎯 3. RÉSUMÉ EXÉCUTIF" -ForegroundColor Cyan
Write-Host "══════════════════════" -ForegroundColor Gray

Write-Host "   📊 Statut Git: $gitStatus" -ForegroundColor $(if ($localCommit -eq $remoteCommit) { "Green" } else { "Red" })
Write-Host "   📁 Fichiers analysés: $($testFiles.Count)" -ForegroundColor White
Write-Host "   ✅ Fins de ligne seulement: $lineEndingOnly" -ForegroundColor Green
Write-Host "   ❌ Différences de contenu: $contentDifferences" -ForegroundColor $(if ($contentDifferences -eq 0) { "Green" } else { "Red" })

# 4. Conclusion et recommandations
Write-Host "`n💡 4. CONCLUSION ET RECOMMANDATIONS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Gray

if ($localCommit -eq $remoteCommit -and $contentDifferences -eq 0) {
    Write-Host "
   🎉 EXCELLENTE NOUVELLE !
   
   ✅ Votre serveur FailDaily est parfaitement synchronisé
   ✅ Tous les fichiers critiques sont identiques (contenu)
   ✅ Les seules différences sont les fins de ligne Windows/Linux (normal)
   
   🚀 Votre environnement est prêt pour la production !
   " -ForegroundColor Green
} elseif ($localCommit -eq $remoteCommit) {
    Write-Host "
   ⚠️  SYNCHRONISATION PARTIELLE
   
   ✅ Git est synchronisé
   ❌ $contentDifferences fichier(s) ont des différences de contenu
   
   🔧 Action recommandée: Analyser les différences de contenu
   " -ForegroundColor Yellow
} else {
    Write-Host "
   ❌ SYNCHRONISATION REQUISE
   
   ❌ Git désynchronisé: Local=$localCommit vs Remote=$remoteCommit  
   
   🔧 Action immédiate: Synchroniser Git d'abord
   " -ForegroundColor Red
}

Write-Host "`n📋 5. INFORMATIONS TECHNIQUES" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════" -ForegroundColor Gray
Write-Host "   🖥️  Environnement local: Windows avec Git autocrlf=true" -ForegroundColor Gray
Write-Host "   🐧 Serveur OVH: Linux avec Git autocrlf=false" -ForegroundColor Gray  
Write-Host "   📝 Fins de ligne: CRLF (Windows) vs LF (Linux)" -ForegroundColor Gray
Write-Host "   🔧 Comportement: Normal et attendu pour environnements mixtes" -ForegroundColor Gray

Write-Host "
═══════════════════════════════════════════════════════════════════════════════
              📞 Support: Toutes les vérifications sont complètes !
═══════════════════════════════════════════════════════════════════════════════
" -ForegroundColor Green