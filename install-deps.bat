@echo off
REM install-deps.bat — robust dependency installer for AI Orb Animation
REM Usage: double-click or run: .\install-deps.bat

setlocal enabledelayedexpansion

echo.
echo ==============================================
echo AI Orb Animation — install-deps (Windows helper)
echo ==============================================
echo.

REM 1) Check Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found in PATH.
  echo Install Node.js (LTS recommended) from https://nodejs.org/ and re-run this script.
  pause
  exit /b 2
)

REM 2) Detect package manager by lockfile or available executables
set "PKG_MANAGER="
if exist pnpm-lock.yaml set "PKG_MANAGER=pnpm"
if exist yarn.lock set "PKG_MANAGER=yarn"
if exist package-lock.json if not defined PKG_MANAGER set "PKG_MANAGER=npm"
if not defined PKG_MANAGER (
  where pnpm >nul 2>&1
  if not errorlevel 1 set "PKG_MANAGER=pnpm"
  where yarn >nul 2>&1
  if not errorlevel 1 set "PKG_MANAGER=yarn"
  if not defined PKG_MANAGER set "PKG_MANAGER=npm"
)

echo Detected package manager: %PKG_MANAGER%
echo.

REM 3) Build install command
if "%PKG_MANAGER%"=="pnpm" (
  set "INSTALL_CMD=pnpm install --no-frozen-lockfile"
) else if "%PKG_MANAGER%"=="yarn" (
  set "INSTALL_CMD=yarn install --check-files"
) else (
  set "INSTALL_CMD=npm ci 2>nul || npm install"
)

REM 4) Run install with limited retries
set /a ATTEMPT=0
set /a MAX_ATTEMPTS=2

:INSTALL_LOOP
set /a ATTEMPT+=1
echo Attempt %ATTEMPT% of %MAX_ATTEMPTS%: running %INSTALL_CMD%
cmd /c "%INSTALL_CMD%"
if errorlevel 1 (
  echo.
  echo Install attempt %ATTEMPT% failed.
  if %ATTEMPT% geq %MAX_ATTEMPTS% goto INSTALL_FAILED
  echo Running repair steps...
  if "%PKG_MANAGER%"=="npm" (
    echo Cleaning npm cache...
    npm cache clean --force
  ) else (
    echo Removing node_modules and retrying...
    if exist node_modules rd /s /q node_modules
  )
  timeout /t 1 >nul
  goto INSTALL_LOOP
)

echo.
echo Dependencies installed successfully.
exit /b 0

:INSTALL_FAILED
echo.
echo ERROR: Could not install dependencies after %MAX_ATTEMPTS% attempts.
echo Helpful next steps:
echo - Run this script from an elevated (Administrator) terminal.
echo - Delete node_modules and the lockfile for your package manager, then re-run.
echo - If you're behind a proxy or custom registry, verify your npm/yarn/pnpm config.
pause
exit /b 3
