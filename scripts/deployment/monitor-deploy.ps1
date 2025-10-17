# Script de surveillance du déploiement production FailDaily
# Auteur: Assistant IA pour débogage CSS Docker

Write-Host "=== SURVEILLANCE DÉPLOIEMENT FAILDAILY ===" -ForegroundColor Green
Write-Host "Serveur: taaazzz@51.75.55.185 (OVH)" -ForegroundColor Yellow
Write-Host "Objectif: Corriger CSS admin panel en production" -ForegroundColor Yellow
Write-Host ""

# Fonction pour vérifier l'état des conteneurs
function Check-DockerStatus {
    Write-Host "=== État des conteneurs Docker ===" -ForegroundColor Cyan
    ssh taaazzz@51.75.55.185 'cd ~/FailDaily && docker-compose -f docker-compose.ssl-production.yml ps'
    Write-Host ""
}

# Fonction pour vérifier les logs
function Check-Logs {
    param([string]$Service)
    Write-Host "=== Logs $Service ===" -ForegroundColor Cyan
    ssh taaazzz@51.75.55.185 "cd ~/FailDaily && docker-compose -f docker-compose.ssl-production.yml logs --tail=10 $Service"
    Write-Host ""
}

# Fonction pour tester l'interface
function Test-Interface {
    Write-Host "=== Test Interface Production ===" -ForegroundColor Cyan
    Write-Host "Testez manuellement:" -ForegroundColor Yellow
    Write-Host "1. https://faildaily.com - Page d'accueil" 
    Write-Host "2. https://faildaily.com/auth/login - Connexion"
    Write-Host "3. Connectez-vous avec bruno@taaazzz.be / motdepasse"
    Write-Host "4. https://faildaily.com/tabs/admin - Interface admin (OBJECTIF)"
    Write-Host ""
    Write-Host "ATTENDU: Interface admin identique à localhost:4200/tabs/admin" -ForegroundColor Green
    Write-Host "PROBLÈME ORIGINAL: CSS cassé en production Docker" -ForegroundColor Red
    Write-Host ""
}

# Surveillance principale
Write-Host "Surveillance démarrée à $(Get-Date)" -ForegroundColor Green
Check-DockerStatus

while ($true) {
    $choice = Read-Host "Actions: [s]tatus, [l]ogs frontend, [b]ackend logs, [t]est interface, [q]uitter"
    
    switch ($choice.ToLower()) {
        's' { Check-DockerStatus }
        'l' { Check-Logs "frontend" }
        'b' { Check-Logs "backend" }
        't' { Test-Interface }
        'q' { 
            Write-Host "Surveillance terminée." -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "Choix invalide. Utilisez s, l, b, t, ou q" -ForegroundColor Red 
        }
    }
}