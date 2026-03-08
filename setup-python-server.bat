@echo off
echo ========================================
echo Python Liveness Detection Server Setup
echo ========================================
echo.

cd python-liveness-server

echo [1/3] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the server:
echo   1. cd python-liveness-server
echo   2. venv\Scripts\activate
echo   3. python app.py
echo.
pause
