@echo off
setlocal

set "HOST=0.0.0.0"
set "PORT=3000"

set "ROOT=%~dp0..\.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "LOGDIR=%ROOT%\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "LOGFILE=%LOGDIR%\start-lan.log"

set "NODEEXE="
if exist "%ROOT%\node-win\node.exe" set "NODEEXE=%ROOT%\node-win\node.exe"
if not defined NODEEXE if exist "C:\Program Files\nodejs\node.exe" set "NODEEXE=C:\Program Files\nodejs\node.exe"
if not defined NODEEXE set "NODEEXE=node"

pushd "%ROOT%"
echo [%date% %time%] Starting TM44 Search on %HOST%:%PORT% >> "%LOGFILE%"
"%NODEEXE%" server.js >> "%LOGFILE%" 2>&1
popd

endlocal
