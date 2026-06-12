@echo off
REM ---------------------------------------------------------------------------
REM  run-backend.bat - starts the Flowentra .NET 8 API against the LOCAL DB.
REM  Generated/maintained alongside watcher.bat. Can also be run standalone.
REM ---------------------------------------------------------------------------
title Flowentra BACKEND (http://localhost:5000)
cd /d "%~dp0Backend"

REM  Local development environment + local PostgreSQL connection (key=value form).
set "ASPNETCORE_ENVIRONMENT=Development"
set "DATABASE_URL=Host=localhost;Port=5432;Database=flowentra;Username=postgres;Password=postgres;SSL Mode=Disable;Trust Server Certificate=true"

echo Starting Flowentra backend on http://localhost:5000 ...
echo Swagger UI: http://localhost:5000/swagger
echo.
dotnet run --launch-profile http

echo.
echo Backend process exited.
pause
