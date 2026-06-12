@echo off
REM ---------------------------------------------------------------------------
REM  run-backend.bat - starts the Flowentra .NET 8 API.
REM  By default it uses the remote Neon DB; use watcher.bat --local-db for a local Postgres target.
REM  Generated/maintained alongside watcher.bat. Can also be run standalone.
REM ---------------------------------------------------------------------------
title Flowentra BACKEND (http://localhost:5000)
cd /d "%~dp0Backend"

REM  Local development environment.
set "ASPNETCORE_ENVIRONMENT=Development"
if "%USE_LOCAL_DB%"=="1" (
    set "DATABASE_URL=Host=localhost;Port=5432;Database=flowentra;Username=postgres;Password=postgres;SSL Mode=Disable;Trust Server Certificate=true"
) else (
    set "DATABASE_URL=postgresql://neondb_owner:npg_PMd7SsoVCO0r@ep-rapid-hall-aqt13tdq-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

echo Starting Flowentra backend on http://localhost:5000 ...
echo Swagger UI: http://localhost:5000/swagger
echo.
dotnet run --launch-profile http

echo.
echo Backend process exited.
pause
