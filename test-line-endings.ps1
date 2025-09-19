# Test de vérification des fins de ligne
param(
    [string]$TestFile = "backend-api/server.js"
)

$localPath = "d:/WEB API/FailDaily/$TestFile"
$remotePath = "/home/taaazzz/FailDaily/$TestFile"

Write-Host "🔍 Test de fins de ligne pour: $TestFile" -ForegroundColor Cyan

# Tailles des fichiers
$localSize = (Get-Item $localPath).Length
$remoteSize = ssh taaazzz@51.75.55.185 "wc -c '$remotePath' | cut -d' ' -f1"

Write-Host "📏 Tailles:" -ForegroundColor Yellow
Write-Host "   Local:  $localSize octets"
Write-Host "   Remote: $remoteSize octets"
Write-Host "   Diff:   $($localSize - $remoteSize) octets"

# Compter les lignes
$localLines = (Get-Content $localPath).Count
$remoteLines = ssh taaazzz@51.75.55.185 "wc -l '$remotePath' | cut -d' ' -f1"

Write-Host "📝 Lignes:" -ForegroundColor Yellow  
Write-Host "   Local:  $localLines lignes"
Write-Host "   Remote: $remoteLines lignes"

# Théorie : si diff = nb lignes, alors c'est juste CRLF vs LF
$expectedDiff = [int]$localLines
$actualDiff = $localSize - [int]$remoteSize

Write-Host "🧮 Analyse:" -ForegroundColor Green
Write-Host "   Différence attendue (CRLF vs LF): $expectedDiff octets"
Write-Host "   Différence réelle: $actualDiff octets"

if ($actualDiff -eq $expectedDiff) {
    Write-Host "✅ CONFIRMATION: Différence uniquement due aux fins de ligne Windows (CRLF) vs Linux (LF)" -ForegroundColor Green
} else {
    Write-Host "❌ ATTENTION: Différence de contenu réel détectée" -ForegroundColor Red
}