# Script de démarrage FailDaily pour Windows
# ==========================================

Write-Host "🚀 Démarrage FailDaily - Environnement de développement" -ForegroundColor Green
Write-Host ""

# Fonction de nettoyage
function Stop-FailDailyServices {
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    
    # Arrêter les processus Node.js sur les ports 3000 et 4200
    $processes = Get-NetTCPConnection -LocalPort 3000,4200 -ErrorAction SilentlyContinue | Select-Object OwningProcess -Unique
    foreach ($proc in $processes) {
        if ($proc.OwningProcess) {
            Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
    exit 0
}

# Intercepter Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Stop-FailDailyServices }

try {
    # Vérifier et libérer les ports si nécessaire
    Write-Host "🔍 Vérification des ports..." -ForegroundColor Blue
    
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Write-Host "⚠️ Port 3000 occupé, libération..." -ForegroundColor Yellow
        $port3000 | Select-Object OwningProcess -Unique | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
        Start-Sleep -Seconds 2
    }
    
    $port4200 = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue  
    if ($port4200) {
        Write-Host "⚠️ Port 4200 occupé, libération..." -ForegroundColor Yellow
        $port4200 | Select-Object OwningProcess -Unique | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
        Start-Sleep -Seconds 2
    }

    # Démarrer le backend
    Write-Host "🔧 Démarrage du backend (port 3000)..." -ForegroundColor Blue
    Set-Location "backend-api"
    $backend = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-Command", "node server.js"
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 3
    
    # Tester le backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5
        Write-Host "✅ Backend opérationnel" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur backend: $($_.Exception.Message)" -ForegroundColor Red
        Stop-FailDailyServices
    }
    
    # Démarrer le frontend
    Write-Host "🎨 Démarrage du frontend (port 4200)..." -ForegroundColor Blue
    Set-Location "../frontend"
    $frontend = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-Command", "ng serve --proxy-config proxy.conf.json --port 4200"
    
    # Attendre que le frontend soit prêt
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "✅ Services démarrés !" -ForegroundColor Green
    Write-Host "📡 Backend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🌐 Frontend: http://localhost:4200" -ForegroundColor Cyan
    Write-Host "🔐 Connexion: bruno@taaazzz.be / @51008473@" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter tous les services" -ForegroundColor Gray
    
    # Attendre les processus
    while ($backend.HasExited -eq $false -and $frontend.HasExited -eq $false) {
        Start-Sleep -Seconds 5
        
        # Vérifier l'état des services
        if (!(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Backend arrêté de manière inattendue" -ForegroundColor Red
            break
        }
        
        if (!(Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Frontend arrêté de manière inattendue" -ForegroundColor Red
            break
        }
    }
    
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Stop-FailDailyServices
}