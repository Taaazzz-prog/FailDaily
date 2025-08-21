<#
.SYNOPSIS
    Script DevOps pour réinitialiser le dépôt Git vers l'état de la branche distante
.DESCRIPTION
    Automatise les commandes git reset --hard et git clean -fd avec des vérifications de sécurité
.PARAMETER Branch
    La branche à utiliser pour le reset (défaut: main)
.PARAMETER Remote
    Le remote à utiliser (défaut: origin)
.PARAMETER Force
    Force l'exécution sans demander de confirmation
.EXAMPLE
    .\reset-repo.ps1
    .\reset-repo.ps1 -Branch develop -Force
#>

param(
    [string]$Branch = "main",
    [string]$Remote = "origin",
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$logFile = "devops\logs\reset-repo-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"

# Fonction de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    if (!(Test-Path "devops\logs")) {
        New-Item -ItemType Directory -Path "devops\logs" -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

# Vérifications préliminaires
function Test-GitRepository {
    if (!(Test-Path ".git")) {
        Write-Log "Erreur: Pas de dépôt Git trouvé dans le répertoire courant" "ERROR"
        exit 1
    }
}

function Test-GitStatus {
    $status = git status --porcelain
    if ($status) {
        Write-Log "Modifications non commitées détectées:" "WARN"
        git status --short
        return $true
    }
    return $false
}

# Fonction principale
function Reset-Repository {
    Write-Log "=== DÉBUT DU RESET DU DÉPÔT ===" "INFO"
    Write-Log "Branche cible: $Remote/$Branch" "INFO"
    
    try {
        # Vérification du dépôt Git
        Test-GitRepository
        
        # Vérification des modifications
        $hasChanges = Test-GitStatus
        
        if ($hasChanges -and !$Force) {
            $confirm = Read-Host "Des modifications non sauvegardées seront perdues. Continuer? (y/N)"
            if ($confirm -ne "y" -and $confirm -ne "Y") {
                Write-Log "Opération annulée par l'utilisateur" "INFO"
                exit 0
            }
        }
        
        # Fetch des dernières modifications
        Write-Log "Récupération des dernières modifications depuis $Remote..." "INFO"
        git fetch $Remote
        
        # Reset hard vers la branche distante
        Write-Log "Reset vers $Remote/$Branch..." "INFO"
        $resetOutput = git reset --hard "$Remote/$Branch" 2>&1
        Write-Log "Résultat reset: $resetOutput" "INFO"
        
        # Nettoyage des fichiers non trackés
        Write-Log "Nettoyage des fichiers non trackés..." "INFO"
        $cleanOutput = git clean -fd 2>&1
        if ($cleanOutput) {
            Write-Log "Fichiers supprimés:" "INFO"
            $cleanOutput | ForEach-Object { Write-Log "  $_" "INFO" }
        } else {
            Write-Log "Aucun fichier à nettoyer" "INFO"
        }
        
        # Vérification finale
        Write-Log "Vérification de l'état final..." "INFO"
        $finalStatus = git status --porcelain
        if (!$finalStatus) {
            Write-Log "✅ Dépôt réinitialisé avec succès!" "INFO"
            git status
        } else {
            Write-Log "⚠️ Des modifications persistent après le reset" "WARN"
        }
        
    } catch {
        Write-Log "Erreur lors du reset: $($_.Exception.Message)" "ERROR"
        exit 1
    } finally {
        Write-Log "=== FIN DU RESET DU DÉPÔT ===" "INFO"
    }
}

# Exécution
Reset-Repository
