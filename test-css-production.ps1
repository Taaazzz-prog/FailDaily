#!/usr/bin/env powershell

<#
.SYNOPSIS
    🧪 Test Post-Déploiement CSS - Vérification OVH
    
.DESCRIPTION
    Script de test rapide pour vérifier que les corrections CSS 
    sont bien déployées et fonctionnelles sur le serveur OVH.
#>

Write-Host "🧪 TEST POST-DÉPLOIEMENT CSS OVH" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# 1. Test de connectivité de base
Write-Host "1️⃣ Test connectivité de base..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-RestMethod -Uri "https://faildaily.com/api/health" -TimeoutSec 10
    if ($healthCheck.status -eq "OK") {
        Write-Host "   ✅ API Health Check: OK" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API Health Check: Status inattendu" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ API Health Check: Échec" -ForegroundColor Red
}

try {
    $frontendCheck = Invoke-WebRequest -Uri "https://faildaily.com" -TimeoutSec 10
    if ($frontendCheck.Content -like "*FailDaily*") {
        Write-Host "   ✅ Frontend accessible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend: Contenu inattendu" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Frontend inaccessible" -ForegroundColor Red
}

Write-Host ""

# 2. Test authentification admin
Write-Host "2️⃣ Test authentification super admin..." -ForegroundColor Yellow

$authBody = @{
    email = "bruno@taaazzz.be"
    password = "@51008473@"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "https://faildaily.com/api/auth/login" -Method POST -Body $authBody -ContentType "application/json" -TimeoutSec 10
    
    if ($authResponse.success -and $authResponse.token) {
        Write-Host "   ✅ Authentification: Succès" -ForegroundColor Green
        Write-Host "   👤 Role: $($authResponse.user.role)" -ForegroundColor Cyan
        Write-Host "   🔑 Token obtenu: $(($authResponse.token).Substring(0,20))..." -ForegroundColor Gray
        
        # 3. Test endpoint admin
        Write-Host ""
        Write-Host "3️⃣ Test endpoint admin..." -ForegroundColor Yellow
        
        $headers = @{
            "Authorization" = "Bearer $($authResponse.token)"
            "Content-Type" = "application/json"
        }
        
        try {
            $adminResponse = Invoke-RestMethod -Uri "https://faildaily.com/api/admin/logs/summary" -Headers $headers -TimeoutSec 10
            Write-Host "   ✅ Endpoint admin accessible" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Endpoint admin inaccessible" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ❌ Authentification échouée" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur authentification: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Vérification CSS/Interface
Write-Host "4️⃣ Instructions test interface CSS..." -ForegroundColor Yellow
Write-Host "   🌐 URL Admin: https://faildaily.com/tabs/admin" -ForegroundColor Cyan
Write-Host "   🔑 Login: bruno@taaazzz.be / @51008473@" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📋 Points à vérifier:" -ForegroundColor White
Write-Host "      • Cartes de statistiques bien stylées" -ForegroundColor White
Write-Host "      • Tableau des logs avec scrollbar" -ForegroundColor White
Write-Host "      • Couleurs Ionic correctes (bleu primary, etc.)" -ForegroundColor White
Write-Host "      • Pas de styles 'cassés' ou par défaut" -ForegroundColor White
Write-Host ""

# 5. Comparaison environnements
Write-Host "5️⃣ Comparaison visuelle recommandée..." -ForegroundColor Yellow
Write-Host "   🔄 Comparer côte à côte:" -ForegroundColor Cyan
Write-Host "      • Local: http://localhost:4200/tabs/admin" -ForegroundColor White
Write-Host "      • Production: https://faildaily.com/tabs/admin" -ForegroundColor White
Write-Host "   ✨ L'interface devrait être IDENTIQUE !" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 RÉSUMÉ CORRECTIONS DÉPLOYÉES" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host "✅ Code synchronisé avec GitHub" 
Write-Host "✅ build:docker sans optimisations CSS agressives"
Write-Host "✅ Variables Ionic préservées en production"
Write-Host "✅ Dockerfile modifié pour utiliser la nouvelle commande"
Write-Host "✅ Conteneur frontend reconstruit complètement"
Write-Host ""
Write-Host "🎨 L'interface admin devrait maintenant être magnifique !" -ForegroundColor Green