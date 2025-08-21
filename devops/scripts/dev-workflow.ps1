<#
.SYNOPSIS
    Script DevOps pour les workflows de développement courants
.DESCRIPTION
    Automatise les tâches répétitives de développement (reset, build, deploy, etc.)
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("reset", "build", "deploy", "full-reset", "status")]
    [string]$Action,
    
    [string]$Environment = "local",
    [switch]$Force
)

# Configuration
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootPath = Split-Path -Parent (Split-Path -Parent $scriptPath)

function Invoke-ResetRepo {
    Write-Host "🔄 Réinitialisation du dépôt..." -ForegroundColor Yellow
    & "$scriptPath\reset-repo.ps1" @($Force ? "-Force" : "")
}

function Invoke-BuildContainers {
    Write-Host "🐳 Construction des conteneurs Docker..." -ForegroundColor Blue
    Set-Location "$rootPath\docker"
    docker-compose build --no-cache
    Set-Location $rootPath
}

function Invoke-DeployEnvironment {
    Write-Host "🚀 Déploiement en environnement $Environment..." -ForegroundColor Green
    Set-Location "$rootPath\docker"
    docker-compose up -d
    Set-Location $rootPath
}

function Show-Status {
    Write-Host "📊 État du système..." -ForegroundColor Cyan
    Write-Host "`n=== Git Status ===" -ForegroundColor Yellow
    git status
    
    Write-Host "`n=== Docker Status ===" -ForegroundColor Yellow
    docker-compose -f docker\docker-compose.yaml ps
}

# Exécution selon l'action
switch ($Action) {
    "reset" { Invoke-ResetRepo }
    "build" { Invoke-BuildContainers }
    "deploy" { Invoke-DeployEnvironment }
    "full-reset" {
        Invoke-ResetRepo
        Invoke-BuildContainers
        Invoke-DeployEnvironment
    }
    "status" { Show-Status }
}

Write-Host "✅ Action '$Action' terminée!" -ForegroundColor Green
