@echo off
REM start-project.bat — start AI Orb Animation dev server and open browser reliably
REM Usage: double-click or run: .\start-project.bat
REM Optional overrides (uncomment at top if needed):
REM set "CMD_OVERRIDE=npm run dev:ui"
REM set "PORT_OVERRIDE=3001"

setlocal enabledelayedexpansion

echo.
echo ==============================================
echo AI Orb Animation — start-project (Windows helper)
echo ==============================================
echo.

REM 1) Ensure dependencies are installed
call "%~dp0install-deps.bat"
if errorlevel 1 (
  echo install-deps.bat reported an error. Fix the issue and re-run start-project.bat.
  pause
  exit /b 2
)

REM 2) Determine start command and candidate ports
if defined CMD_OVERRIDE (
  set "CMD=%CMD_OVERRIDE%"
  if defined PORT_OVERRIDE ( set "PORTS=%PORT_OVERRIDE%" ) else ( set "PORTS=5173,3000,1234,8080" )
) else (
  for /f "usebackq delims=" %%A in (`node -e "const fs=require('fs'); try{const pkg=JSON.parse(fs.readFileSync('package.json')); const scripts=pkg.scripts||{}; let cmd=''; if(scripts.dev) cmd='npm run dev'; else if(scripts.start) cmd='npm start'; else if(scripts.serve) cmd='npm run serve'; else if(scripts.preview) cmd='npm run preview'; else { const keys=Object.keys(scripts); cmd = keys.length?('npm run '+keys[0]):'npm start'; } const deps=Object.assign({},pkg.dependencies||{},pkg.devDependencies||{}); let ports=[]; if(deps.vite) ports.push(5173); if(deps.next) ports.push(3000); if(deps['react-scripts']) ports.push(3000); if(deps.parcel) ports.push(1234); if(deps['webpack-dev-server']) ports.push(8080); if(ports.length===0) ports=[5173,3000,1234,8080]; console.log(cmd+'@@'+ports.join(',')); }catch(e){console.log('npm start@@5173,3000,1234,8080');}"`) do set "OUT=%%A"
  for /f "tokens=1,2 delims=@@" %%A in ("%OUT%") do (
    set "CMD=%%A"
    set "PORTS=%%B"
  )
)

echo Start command: %CMD%
echo Candidate ports: %PORTS%

REM 3) Start attempts (install+start+probe)
set /a ATTEMPT=0
set /a MAX_ATTEMPTS=3
set "LOGFILE=%~dp0devserver.log"

:ATTEMPT_LOOP
set /a ATTEMPT+=1
echo.
echo ===== Attempt %ATTEMPT% of %MAX_ATTEMPTS% =====

if exist "%LOGFILE%" del /f /q "%LOGFILE%" >nul 2>&1

echo Launching dev server (output -> %LOGFILE%)...
start "AI Orb Animation Dev Server" cmd /k "%CMD% 1>\"%LOGFILE%\" 2>^&1"

REM 4) Probe ports for readiness
set "GOOD_PORT="
for %%P in (%PORTS:,= %) do (
  echo Probing http://localhost:%%P/ ...
  call :WAIT_FOR_PORT %%P 120
  if not errorlevel 1 (
    set "GOOD_PORT=%%P"
    goto PORT_FOUND
  )
)

:PORT_FOUND
if defined GOOD_PORT (
  set "URL=http://localhost:%GOOD_PORT%/"
  echo Server reachable at %URL%
  echo Opening default browser...
  start "" "%URL%"
  echo Done.
  exit /b 0
)

echo.
echo Server did not become reachable within the timeout.
echo Showing last 200 lines of log (%LOGFILE%):
powershell -noprofile -command "if(Test-Path('%LOGFILE%')) { Get-Content -Path '%LOGFILE%' -Tail 200 } else { Write-Host 'No log file found.' }"

if %ATTEMPT% lss %MAX_ATTEMPTS% (
  echo Attempting automated repair: reinstalling dependencies and retrying...
  call "%~dp0install-deps.bat"
  timeout /t 2 >nul
  goto ATTEMPT_LOOP
) else (
  echo ERROR: Server failed to start and become reachable after %MAX_ATTEMPTS% attempts.
  echo Please inspect devserver.log and the Dev Server window for errors.
  pause
  exit /b 4
)

REM Helper: WAIT_FOR_PORT <port> <maxSeconds>
:WAIT_FOR_PORT
setlocal
set "PORT_TO_CHECK=%~1"
set /a MAX_SECONDS=%~2
if "%PORT_TO_CHECK%"=="" set "PORT_TO_CHECK=5173"
if %MAX_SECONDS% lss 1 set /a MAX_SECONDS=60
set /a COUNT=0
:WAIT_LOOP
powershell -noprofile -command ^
  "try{ $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:%PORT_TO_CHECK%/' -TimeoutSec 3; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 400){ exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 (
  endlocal & exit /b 0
)
set /a COUNT+=1
if %COUNT% geq %MAX_SECONDS% (
  endlocal & exit /b 1
)
timeout /t 1 >nul
goto WAIT_LOOP
