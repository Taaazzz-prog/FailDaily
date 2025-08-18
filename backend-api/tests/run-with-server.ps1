param(
  [int]$Port = 3001,
  [string]$Env = 'development',
  [string]$Script = '.\\tests\\run-all-tests.js',
  [string[]]$ScriptArgs
)

Set-Location -Path "$PSScriptRoot/.."  # backend-api root
$env:NODE_ENV = $Env
$env:PORT = "$Port"

Write-Host "Starting server on port $Port..."
$job = Start-Job -ScriptBlock { node server.js }

# Wait for health
$healthy = $false
for ($i = 0; $i -lt 40; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $healthy = $true; break }
  } catch { }
  Start-Sleep -Milliseconds 500
}

if (-not $healthy) {
  Write-Error "Server did not become healthy in time."
  Receive-Job $job -Keep | Out-Host
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Server is healthy. Running: node $Script $ScriptArgs"
node $Script @ScriptArgs
$code = $LASTEXITCODE

try { Stop-Job $job -ErrorAction SilentlyContinue } catch {}
Remove-Job $job -ErrorAction SilentlyContinue

exit $code
