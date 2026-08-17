$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$python = Join-Path $root ".venv\Scripts\python.exe"
$nodeBin = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpm = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if (-not (Test-Path $python)) {
  throw "Missing Python virtualenv. Run: C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m venv .venv"
}

$env:Path = "$nodeBin;$env:Path"

function Start-IfMissing {
  param(
    [int]$Port,
    [string]$Name,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    Write-Host "$Name already running on port $Port"
    return
  }

  Start-Process -WindowStyle Hidden -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory
  Write-Host "Started $Name on port $Port"
}

Start-IfMissing `
  -Port 8000 `
  -Name "backend" `
  -FilePath $python `
  -Arguments @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
  -WorkingDirectory (Join-Path $root "backend")

Start-IfMissing `
  -Port 8100 `
  -Name "ai-service" `
  -FilePath $python `
  -Arguments @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8100") `
  -WorkingDirectory (Join-Path $root "ai-service")

Start-IfMissing `
  -Port 3000 `
  -Name "frontend" `
  -FilePath $pnpm `
  -Arguments @("--filter", "ai-beauty-growth-frontend", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000") `
  -WorkingDirectory $root

Start-Sleep -Seconds 3
Write-Host "Backend:  http://127.0.0.1:8000/api/bloggers?limit=3"
Write-Host "AI mock:  http://127.0.0.1:8100/health"
Write-Host "Frontend: http://127.0.0.1:3000"
