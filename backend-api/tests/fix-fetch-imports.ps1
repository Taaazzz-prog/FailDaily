# Script pour corriger les imports de fetch dans tous les tests
$files = Get-ChildItem -Path "." -Recurse -Include "*.js" | Where-Object { $_.Name -notlike "*fix-fetch*" -and $_.Name -notlike "*0_test-config*" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Vérifier si le fichier utilise fetch et require 0_test-config
    if ($content -match "fetch\(" -and $content -match "require\('\.\./0_test-config'\)" -and $content -notmatch ", fetch \}") {
        Write-Host "Correction de $($file.Name)..."
        
        # Remplacer les imports sans fetch
        $content = $content -replace "const \{ (.*) \} = require\('\.\./0_test-config'\);", "const { `$1, fetch } = require('../0_test-config');"
        $content = $content -replace "const \{ (.*) \} = require\('\./0_test-config'\);", "const { `$1, fetch } = require('./0_test-config');"
        
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Host "Correction terminée !"
