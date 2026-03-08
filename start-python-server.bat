@echo off
echo Starting Python Liveness Detection Server...
cd python-liveness-server
call venv\Scripts\activate.bat
python app.py
