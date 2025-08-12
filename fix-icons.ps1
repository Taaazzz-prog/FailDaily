#!/bin/env pwsh
# Script pour corriger automatiquement les icônes manquantes dans toutes les pages

# Fonction pour extraire les icônes d'un fichier HTML
function Get-IconsFromHTML($htmlFile) {
    if (Test-Path $htmlFile) {
        $content = Get-Content $htmlFile -Raw
        $icons = [regex]::Matches($content, 'name="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        $pullingIcons = [regex]::Matches($content, 'pullingIcon="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        return ($icons + $pullingIcons) | Sort-Object -Unique
    }
    return @()
}

# Fonction pour convertir le nom d'icône en camelCase
function ConvertTo-CamelCase($iconName) {
    $parts = $iconName -split '-'
    $first = $parts[0]
    $rest = $parts[1..($parts.Length - 1)] | ForEach-Object { 
        $_.Substring(0, 1).ToUpper() + $_.Substring(1) 
    }
    return $first + ($rest -join '')
}

# Pages à corriger
$pagesToFix = @(
    "src/app/pages/badges/badges.page"
    "src/app/pages/post-fail/post-fail.page"
    "src/app/pages/auth/register.page"
    "src/app/pages/edit-profile/edit-profile.page"
    "src/app/pages/privacy-settings/privacy-settings.page"
    "src/app/pages/admin/admin.page"
)

foreach ($basePath in $pagesToFix) {
    $tsFile = "$basePath.ts"
    $htmlFile = "$basePath.html"
    
    Write-Host "🔧 Traitement de $basePath..."
    
    # Vérifier si les fichiers existent
    if (!(Test-Path $tsFile) -or !(Test-Path $htmlFile)) {
        Write-Host "⚠️ Fichiers non trouvés pour $basePath"
        continue
    }
    
    # Extraire les icônes du HTML
    $icons = Get-IconsFromHTML $htmlFile
    if ($icons.Count -eq 0) {
        Write-Host "ℹ️ Aucune icône trouvée dans $htmlFile"
        continue
    }
    
    Write-Host "📋 Icônes trouvées: $($icons -join ', ')"
    
    # Convertir en camelCase pour l'import
    $camelCaseIcons = $icons | ForEach-Object { ConvertTo-CamelCase $_ }
    
    # Lire le contenu TypeScript
    $tsContent = Get-Content $tsFile -Raw
    
    # Vérifier si addIcons est déjà présent
    if ($tsContent -match "addIcons") {
        Write-Host "✅ addIcons déjà présent dans $tsFile"
        continue
    }
    
    # Ajouter l'import addIcons et des icônes
    $importLine = "import { addIcons } from 'ionicons';"
    $iconsImportLine = "import { $($camelCaseIcons -join ', ') } from 'ionicons/icons';"
    
    # Trouver la ligne d'import Ionic
    $ionicImportMatch = [regex]::Match($tsContent, "} from '@ionic/angular/standalone';")
    if ($ionicImportMatch.Success) {
        $insertPosition = $ionicImportMatch.Index + $ionicImportMatch.Length
        $tsContent = $tsContent.Insert($insertPosition, "`n$importLine`n$iconsImportLine")
    }
    
    # Ajouter le constructeur ou modifier celui existant
    $addIconsCall = "    addIcons({`n      $($camelCaseIcons -join ', ')`n    });"
    
    if ($tsContent -match "constructor\([^)]*\)\s*{") {
        # Constructeur existant - ajouter après l'accolade ouvrante
        $tsContent = $tsContent -replace "(constructor\([^)]*\)\s*{)", "`$1`n    // Configuration des icônes`n$addIconsCall`n"
    }
    else {
        # Pas de constructeur - en ajouter un
        $classMatch = [regex]::Match($tsContent, "export class [^{]*{")
        if ($classMatch.Success) {
            $insertPos = $classMatch.Index + $classMatch.Length
            $constructor = "`n  constructor() {`n    // Configuration des icônes`n$addIconsCall`n  }`n"
            $tsContent = $tsContent.Insert($insertPos, $constructor)
        }
    }
    
    # Écrire le fichier modifié
    Set-Content -Path $tsFile -Value $tsContent -Encoding UTF8
    Write-Host "✅ $tsFile mis à jour avec les icônes"
}

Write-Host "🎉 Script terminé !"
