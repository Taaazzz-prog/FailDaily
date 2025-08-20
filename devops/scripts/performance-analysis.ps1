# FailDaily - Script d'analyse de performance simple
param(
    [Parameter(Position=0)]
    [string]$Type = "help"
)

Write-Host "FailDaily - Analyse de performance" -ForegroundColor Cyan

function Show-Help {
    Write-Host "Usage: .\performance-analysis.ps1 [type]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Types:" -ForegroundColor White
    Write-Host "  security    Audit de securite npm" -ForegroundColor Green
    Write-Host "  deps        Analyse des dependances" -ForegroundColor Green
    Write-Host "  size        Tailles des projets" -ForegroundColor Green
    Write-Host "  help        Cette aide" -ForegroundColor Green
}

function Run-Security-Audit {
    Write-Host "Audit de securite..." -ForegroundColor Blue
    
    Write-Host "`n--- Audit Root ---" -ForegroundColor Yellow
    npm audit --audit-level moderate
    
    Write-Host "`n--- Audit Frontend ---" -ForegroundColor Yellow
    Set-Location frontend
    npm audit --audit-level moderate
    
    Write-Host "`n--- Audit Backend ---" -ForegroundColor Yellow
    Set-Location ../backend-api
    npm audit --audit-level moderate
    
    Set-Location ..
    Write-Host "`nAudit termine" -ForegroundColor Green
}

function Analyze-Dependencies {
    Write-Host "Analyse des dependances..." -ForegroundColor Blue
    
    Write-Host "`n--- Frontend package.json ---" -ForegroundColor Yellow
    if (Test-Path "frontend/package.json") {
        $frontendPkg = Get-Content "frontend/package.json" | ConvertFrom-Json
        $depCount = ($frontendPkg.dependencies | Get-Member -MemberType Properties).Count
        $devDepCount = ($frontendPkg.devDependencies | Get-Member -MemberType Properties).Count
        Write-Host "Dependencies: $depCount" -ForegroundColor Green
        Write-Host "DevDependencies: $devDepCount" -ForegroundColor Green
    }
    
    Write-Host "`n--- Backend package.json ---" -ForegroundColor Yellow
    if (Test-Path "backend-api/package.json") {
        $backendPkg = Get-Content "backend-api/package.json" | ConvertFrom-Json
        $depCount = ($backendPkg.dependencies | Get-Member -MemberType Properties).Count
        $devDepCount = if ($backendPkg.devDependencies) { ($backendPkg.devDependencies | Get-Member -MemberType Properties).Count } else { 0 }
        Write-Host "Dependencies: $depCount" -ForegroundColor Green
        Write-Host "DevDependencies: $devDepCount" -ForegroundColor Green
    }
}

function Analyze-Project-Sizes {
    Write-Host "Analyse des tailles..." -ForegroundColor Blue
    
    if (Test-Path "frontend/node_modules") {
        $frontendSize = (Get-ChildItem "frontend/node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Frontend node_modules: $([math]::Round($frontendSize, 1)) MB" -ForegroundColor Yellow
    }
    
    if (Test-Path "backend-api/node_modules") {
        $backendSize = (Get-ChildItem "backend-api/node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Backend node_modules: $([math]::Round($backendSize, 1)) MB" -ForegroundColor Yellow
    }
    
    if (Test-Path "frontend/www") {
        $buildSize = (Get-ChildItem "frontend/www" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Frontend build: $([math]::Round($buildSize, 1)) MB" -ForegroundColor Yellow
    }
    
    Write-Host "`nTailles principales:" -ForegroundColor Green
    Get-ChildItem -Path "." -Include "*.md", "*.json", "*.js", "*.ts" -Recurse -File | 
        Sort-Object Length -Descending | 
        Select-Object -First 10 Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,1)}} | 
        Format-Table
}

switch ($Type.ToLower()) {
    "security" { Run-Security-Audit }
    "deps" { Analyze-Dependencies }
    "size" { Analyze-Project-Sizes }
    default { Show-Help }
}

Write-Host "`nAnalyse terminee!" -ForegroundColor Green
