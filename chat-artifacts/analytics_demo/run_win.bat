@echo off
REM MarginOps Python demo - Windows launcher.
REM Double-click. First run may show SmartScreen: click "More info" > "Run anyway".
REM Installs uv if needed, then builds the venv + deps and opens the dashboard.
setlocal enableextensions
cd /d "%~dp0"

echo MarginOps Python demo - setup and launch
echo.

REM Make sure uv is visible (may be installed but not on PATH yet).
set "PATH=%USERPROFILE%\.local\bin;%PATH%"

where uv >nul 2>nul
if errorlevel 1 (
  echo Installing uv ^(one time, needs internet^)...
  powershell -ExecutionPolicy Bypass -NoProfile -Command "irm https://astral.sh/uv/install.ps1 | iex"
  set "PATH=%USERPROFILE%\.local\bin;%PATH%"
)

where uv >nul 2>nul
if errorlevel 1 (
  echo.
  echo uv install failed. Try once in PowerShell:  winget install astral-sh.uv
  echo.
  pause
  exit /b 1
)

echo Preparing data...
uv run mock_streams.py
if errorlevel 1 ( echo Data step failed. & pause & exit /b 1 )

echo.
echo Opening the dashboard in your browser. Leave this window open.
echo To stop the demo: close the browser tab, then press Ctrl+C here.
echo.
uv run streamlit run app.py

pause
