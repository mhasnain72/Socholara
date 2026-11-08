$ErrorActionPreference = 'Continue'

$agentRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $agentRoot '.venv\Scripts\python.exe'
$logDirectory = Join-Path $agentRoot 'logs'

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python environment not found: $python"
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location -LiteralPath $agentRoot

while ($true) {
    & $python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 `
        *>> (Join-Path $logDirectory 'agent.log')
    if ($LASTEXITCODE -ne 0) {
        Add-Content -Path (Join-Path $logDirectory 'agent.log') -Value "Agent exited with code $LASTEXITCODE. Restarting in 30 seconds."
    }
    Start-Sleep -Seconds 30
}
