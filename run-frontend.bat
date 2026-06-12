@echo off
REM ---------------------------------------------------------------------------
REM  run-frontend.bat - starts the Flowentra Vite dev server (port 8080).
REM  Generated/maintained alongside watcher.bat. Can also be run standalone.
REM ---------------------------------------------------------------------------
title Flowentra FRONTEND (http://localhost:8080)
cd /d "%~dp0"

echo Starting Flowentra frontend on http://localhost:8080 ...
echo.
call npm run dev

echo.
echo Frontend process exited.
pause
