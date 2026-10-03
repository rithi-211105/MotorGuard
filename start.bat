@echo off
echo ============================================
echo   AI Infrastructure Monitor
echo ============================================

echo [1/2] Installing / verifying dependencies...
python -m pip install -r requirements.txt

echo.
echo [2/2] Starting unified FastAPI server on http://localhost:8000 ...
echo       Command Center: http://localhost:8000
echo       API Docs:       http://localhost:8000/docs
echo.

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
