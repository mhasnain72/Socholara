# Opportunity Finder Agent

Standalone FastAPI service for discovering, verifying, classifying, and reviewing scholarships and internships.

## Run

```powershell
cd opportunity-agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
New-Item -ItemType Directory -Force "$HOME\.scholara"
Copy-Item .env.example "$HOME\.scholara\agent.env"
uvicorn app.main:app --reload --port 8000
```

The agent reads its private configuration from `$HOME\.scholara\agent.env`, outside
the project directory. Keep the API key and database credentials in that file only.

For Windows login auto-start, register the scheduled task from PowerShell:

```powershell
Register-ScheduledTask -TaskName "Scholara Opportunity Agent" `
  -Action (New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PWD\run-agent.ps1`"") `
  -Trigger (New-ScheduledTaskTrigger -AtLogOn) `
  -Settings (New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)) `
  -Description "Starts the Scholara opportunity agent on Windows login."
```

The scheduler runs every `FETCH_INTERVAL_MINUTES`. Trigger a run manually with:

```powershell
curl -X POST http://localhost:8000/api/agent/run -H "X-Agent-Key: $env:AGENT_API_KEY"
```

The service intentionally stores discoveries as `pending_review`; it never publishes automatically.
The agent only fetches public HTTP(S) destinations and blocks private, loopback, link-local, reserved, and multicast IP ranges.

The browser-facing website runs at `http://localhost:3000`. The Vite dev server proxies
website APIs to the Node backend on port `5000`; the Node backend proxies protected
Opportunity Finder requests to this service on port `8000`. Only port `3000` needs to be
opened in the browser.
