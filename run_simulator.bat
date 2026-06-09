@echo off
echo ==========================================
echo Starting Virtual Analog Laboratory...
echo ==========================================
echo.

echo [1/2] Starting Python FastAPI Backend...
start "Analog Lab Backend" cmd /k "cd backend && .\.venv\Scripts\python.exe main.py"

echo [2/2] Starting Next.js Frontend...
start "Analog Lab Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate command windows!
echo Please wait about 5 seconds for them to fully boot up.
echo.
echo Once they are ready, your browser will open the application.
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo You can close this specific window now, but leave the other two running while you work!
pause
