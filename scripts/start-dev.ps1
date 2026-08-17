$ErrorActionPreference = "Stop"

Write-Host "Starting Beauty AI Platform dependencies..."
docker compose up postgres ai-service backend frontend
