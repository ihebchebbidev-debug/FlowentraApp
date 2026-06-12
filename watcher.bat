@echo off
REM ============================================================================
REM  watcher.bat  -  Flowentra one-click LOCAL setup & runner (Windows)
REM ----------------------------------------------------------------------------
REM  What this script does, step by step:
REM    1. Installs the required tools if missing (Node.js, .NET 8 SDK, PostgreSQL)
REM    2. Makes sure the local PostgreSQL service is running
REM    3. Creates the local database (default: flowentra)
REM    4. Loads the full schema (Neon\*.sql -> Database\Migrations\*.sql -> Migrations\*.sql)
REM    5. Points the frontend at the local backend (.env.local)
REM    6. Restores backend (dotnet) + installs frontend (npm) dependencies
REM    7. Starts the BACKEND (http://localhost:5000) and FRONTEND (http://localhost:8080)
REM       each in its own window, so everything runs locally in a single run.
REM
REM  Usage:
REM    watcher.bat              -> full setup against remote Neon DB by default
REM    watcher.bat --local-db   -> install/run against a local PostgreSQL DB instead
REM    watcher.bat --reset      -> DROP and recreate the local database, reload schema
REM    watcher.bat --skip-install  -> do not try to install tools (just run)
REM
REM  Run it from the project root (the folder that contains this file).
REM ============================================================================

setlocal EnableDelayedExpansion
title Flowentra - Local Setup ^& Runner

REM ---------------------------------------------------------------------------
REM  CONFIG  (edit these if you need different values)
REM ---------------------------------------------------------------------------
set "ROOT=%~dp0"
set "BACKEND=%ROOT%Backend"
set "PG_VER_DIR="
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=postgres"
set "PGPASSWORD=postgres"
set "DB_NAME=flowentra"
set "BACKEND_URL=http://localhost:5000"
set "FRONTEND_PORT=8080"
set "DB_MODE=remote"
set "USE_LOCAL_DB=0"

REM  Connection string passed to the .NET backend (key=value form -> used as-is)
set "DOTNET_DB_CONN=Host=%PGHOST%;Port=%PGPORT%;Database=%DB_NAME%;Username=%PGUSER%;Password=%PGPASSWORD%;SSL Mode=Disable;Trust Server Certificate=true"

REM  Parse arguments
set "DO_RESET=0"
set "DO_INSTALL=1"
:argloop
if "%~1"=="" goto argdone
if /I "%~1"=="--reset" set "DO_RESET=1"
if /I "%~1"=="--skip-install" set "DO_INSTALL=0"
if /I "%~1"=="--local-db" (
    set "DB_MODE=local"
    set "USE_LOCAL_DB=1"
)
shift
goto argloop
:argdone

echo.
echo ============================================================
echo   FLOWENTRA  -  LOCAL ENVIRONMENT BOOTSTRAP
echo ============================================================
echo   Project root : %ROOT%
echo   Database mode : %DB_MODE%
if /I "%DB_MODE%"=="local" (
    echo   Database      : %DB_NAME% on %PGHOST%:%PGPORT% (user %PGUSER%)
) else (
    echo   Database      : remote Neon DB (no local Postgres required)
)
echo   Backend       : %BACKEND_URL%   (Swagger at %BACKEND_URL%/swagger)
echo   Frontend      : http://localhost:%FRONTEND_PORT%
echo ============================================================
echo.

REM ===========================================================================
echo [STEP 1/7] Checking / installing required tools...
REM ===========================================================================

if "%DO_INSTALL%"=="0" (
    echo   --skip-install set, skipping tool installation.
    goto after_install
)

REM --- winget availability -------------------------------------------------
where winget >nul 2>&1
if errorlevel 1 (
    echo   [WARN] winget not found. Cannot auto-install tools.
    if /I "%DB_MODE%"=="local" (
        echo          Please install manually: Node.js LTS, .NET 8 SDK, PostgreSQL 16.
    ) else (
        echo          Please install manually: Node.js LTS, .NET 8 SDK.
    )
    echo          Then re-run:  watcher.bat --skip-install
) else (
    REM --- Node.js ---------------------------------------------------------
    where node >nul 2>&1
    if errorlevel 1 (
        echo   - Installing Node.js LTS...
        winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    ) else (
        for /f "tokens=*" %%v in ('node --version') do echo   - Node.js already installed (%%v)
    )

    REM --- .NET 8 SDK ------------------------------------------------------
    set "HAS_DOTNET8=0"
    where dotnet >nul 2>&1
    if not errorlevel 1 (
        for /f "tokens=*" %%v in ('dotnet --list-sdks 2^>nul ^| findstr /b "8."') do set "HAS_DOTNET8=1"
    )
    if "!HAS_DOTNET8!"=="1" (
        echo   - .NET 8 SDK already installed
    ) else (
        echo   - Installing .NET 8 SDK...
        winget install -e --id Microsoft.DotNet.SDK.8 --silent --accept-source-agreements --accept-package-agreements
    )

    REM --- PostgreSQL ------------------------------------------------------
    if /I "%DB_MODE%"=="local" (
        where psql >nul 2>&1
        if errorlevel 1 (
            echo   - Installing PostgreSQL 16 (unattended, superuser password = %PGPASSWORD%)...
            winget install -e --id PostgreSQL.PostgreSQL.16 --silent --accept-source-agreements --accept-package-agreements --override "--mode unattended --unattendedmodeui none --superpassword %PGPASSWORD% --serverport %PGPORT% --servicename postgresql-x64-16"
        ) else (
            echo   - PostgreSQL client already installed
        )
    ) else (
        echo   - Remote DB mode selected, skipping local PostgreSQL installation.
    )
)

:after_install

REM --- Make sure the freshly installed tools are on PATH for THIS session ----
echo   - Refreshing PATH for this session...
for /d %%D in ("C:\Program Files\PostgreSQL\*") do set "PG_VER_DIR=%%D"
if defined PG_VER_DIR set "PATH=%PG_VER_DIR%\bin;%PATH%"
set "PATH=%PATH%;%ProgramFiles%\dotnet;%ProgramFiles%\nodejs;%APPDATA%\npm"

REM --- Verify the essential tools are now reachable --------------------------
set "MISSING=0"
where node    >nul 2>&1 || (echo   [ERROR] node not found on PATH   & set "MISSING=1")
where npm     >nul 2>&1 || (echo   [ERROR] npm not found on PATH    & set "MISSING=1")
where dotnet  >nul 2>&1 || (echo   [ERROR] dotnet not found on PATH & set "MISSING=1")
if /I "%DB_MODE%"=="local" (
    where psql    >nul 2>&1 || (echo   [ERROR] psql not found on PATH   & set "MISSING=1")
)
if "%MISSING%"=="1" (
    echo.
    echo   Some tools are not visible yet. This usually means an installer just
    echo   ran and PATH was updated machine-wide. Please CLOSE this window, open a
    echo   NEW terminal, and run:  watcher.bat --skip-install
    echo.
    pause
    exit /b 1
)
if /I "%DB_MODE%"=="local" (
    echo   - All tools available: node, npm, dotnet, psql
) else (
    echo   - All tools available: node, npm, dotnet
)

if /I "%DB_MODE%" NEQ "local" (
    echo.
    echo [STEP 2/7] Remote DB mode selected — skipping local PostgreSQL checks and schema bootstrap.
    echo.
    goto after_local_db
)

REM ===========================================================================
echo.
echo [STEP 2/7] Ensuring PostgreSQL service is running...
REM ===========================================================================
set "PGSVC="
for /f "tokens=*" %%S in ('sc query state^= all ^| findstr /i "SERVICE_NAME" ^| findstr /i "postgres"') do (
    for /f "tokens=2 delims=:" %%N in ("%%S") do set "PGSVC=%%N"
)
if defined PGSVC (
    set "PGSVC=%PGSVC: =%"
    echo   - Found service: !PGSVC!
    net start "!PGSVC!" >nul 2>&1
    if errorlevel 1 (echo   - Service already running) else (echo   - Service started)
) else (
    echo   [WARN] Could not detect a PostgreSQL Windows service by name.
    echo          Assuming a server is already listening on %PGHOST%:%PGPORT%.
)

REM  Wait for the server to accept connections (max ~30s)
echo   - Waiting for PostgreSQL to accept connections...
set "PG_OK=0"
for /l %%i in (1,1,15) do (
    if "!PG_OK!"=="0" (
        pg_isready -h %PGHOST% -p %PGPORT% -U %PGUSER% >nul 2>&1
        if not errorlevel 1 (
            set "PG_OK=1"
            echo   - PostgreSQL is ready.
        ) else (
            timeout /t 2 /nobreak >nul
        )
    )
)
if "!PG_OK!"=="0" (
    echo   [ERROR] PostgreSQL did not become ready on %PGHOST%:%PGPORT%.
    echo           Check the service / password and try again.
    pause
    exit /b 1
)

REM ===========================================================================
echo.
echo [STEP 3/7] Creating database "%DB_NAME%"...
REM ===========================================================================
if "%DO_RESET%"=="1" (
    echo   - --reset requested: dropping existing database if present...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -v ON_ERROR_STOP=0 -c "DROP DATABASE IF EXISTS \"%DB_NAME%\" WITH (FORCE);"
)

REM  Create DB only if it does not already exist
set "DB_EXISTS="
for /f "tokens=*" %%R in ('psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" 2^>nul') do set "DB_EXISTS=%%R"
if "%DB_EXISTS%"=="1" (
    echo   - Database "%DB_NAME%" already exists.
) else (
    echo   - Creating database "%DB_NAME%"...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"%DB_NAME%\";"
    if errorlevel 1 (
        echo   [ERROR] Failed to create database. Aborting.
        pause
        exit /b 1
    )
)

REM ===========================================================================
echo.
echo [STEP 4/7] Loading database schema...
REM ===========================================================================
REM  Detect whether schema is already present by looking for a core table.
set "SCHEMA_LOADED="
for /f "tokens=*" %%R in ('psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %DB_NAME% -tAc "SELECT to_regclass('public.\"MainAdminUsers\"') IS NOT NULL;" 2^>nul') do set "SCHEMA_LOADED=%%R"

if /I "%SCHEMA_LOADED%"=="t" if "%DO_RESET%"=="0" (
    echo   - Schema already loaded (MainAdminUsers exists). Skipping.
    echo     Use "watcher.bat --reset" to wipe and reload.
    goto schema_done
)

echo   - Applying Neon\*.sql (canonical schema, in order)...
for /f "delims=" %%F in ('dir /b /on "%BACKEND%\Neon\*.sql" 2^>nul') do (
    echo       -^> Neon\%%F
    psql -q -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %DB_NAME% -v ON_ERROR_STOP=0 -f "%BACKEND%\Neon\%%F" 1>nul
)

echo   - Applying Database\Migrations\*.sql...
for /f "delims=" %%F in ('dir /b /on "%BACKEND%\Database\Migrations\*.sql" 2^>nul') do (
    echo       -^> Database\Migrations\%%F
    psql -q -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %DB_NAME% -v ON_ERROR_STOP=0 -f "%BACKEND%\Database\Migrations\%%F" 1>nul
)

echo   - Applying Migrations\*.sql...
for /f "delims=" %%F in ('dir /b /on "%BACKEND%\Migrations\*.sql" 2^>nul') do (
    echo       -^> Migrations\%%F
    psql -q -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %DB_NAME% -v ON_ERROR_STOP=0 -f "%BACKEND%\Migrations\%%F" 1>nul
)
echo   - Schema load finished (errors on already-applied statements are expected and ignored).

:schema_done

after_local_db

REM ===========================================================================
echo.
echo [STEP 5/7] Pointing the frontend at the local backend (.env.local)...
REM ===========================================================================
(
    echo # Auto-generated by watcher.bat - local development overrides
    echo VITE_API_URL=%BACKEND_URL%
    echo REACT_APP_API_URL=%BACKEND_URL%
) > "%ROOT%.env.local"
echo   - Wrote %ROOT%.env.local  (VITE_API_URL=%BACKEND_URL%)

REM ===========================================================================
echo.
echo [STEP 6/7] Installing dependencies (backend restore + frontend npm install)...
REM ===========================================================================
echo   - Restoring backend NuGet packages...
pushd "%BACKEND%"
dotnet restore
if errorlevel 1 (
    echo   [ERROR] dotnet restore failed.
    popd
    pause
    exit /b 1
)
popd

echo   - Installing frontend npm packages (this can take a few minutes)...
pushd "%ROOT%"
if exist "%ROOT%node_modules" (
    echo     node_modules already present, running a quick npm install to sync...
)
call npm install
if errorlevel 1 (
    echo   [ERROR] npm install failed.
    popd
    pause
    exit /b 1
)
popd

REM ===========================================================================
echo.
echo [STEP 7/7] Starting BACKEND and FRONTEND...
REM ===========================================================================
if /I "%DB_MODE%"=="local" set "USE_LOCAL_DB=1"
if /I "%DB_MODE%" NEQ "local" set "USE_LOCAL_DB=0"
echo   - Launching backend window  -^> %BACKEND_URL%
start "Flowentra BACKEND" cmd /k "%ROOT%run-backend.bat"

echo   - Launching frontend window -^> http://localhost:%FRONTEND_PORT%
start "Flowentra FRONTEND" cmd /k "%ROOT%run-frontend.bat"

echo.
echo ============================================================
echo   ALL SET. Two new windows are starting:
echo     - BACKEND : %BACKEND_URL%   (Swagger: %BACKEND_URL%/swagger)
echo     - FRONTEND: http://localhost:%FRONTEND_PORT%
echo.
echo   Give them ~20-40s on first launch (build + Vite warmup),
echo   then open:  http://localhost:%FRONTEND_PORT%
echo.
echo   To wipe and reload the DB next time:  watcher.bat --reset
echo ============================================================
echo.
pause
endlocal
