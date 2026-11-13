@echo off
title Push LUMINA PRO to GitHub
echo ========================================================
echo   Pushing LUMINA PRO to https://github.com/Sidharthzidzid
echo ========================================================
echo.
echo If you haven't created the repository on GitHub yet:
echo 1. Open: https://github.com/new
echo 2. Repository name: projection-mapping
echo 3. Keep it Public (or Private) and DO NOT initialize with README/license
echo 4. Click "Create repository"
echo.
echo Press any key when the repository is created to push...
pause >nul
echo.
echo Pushing code to main branch...
"C:\Users\samru\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main
echo.
if %errorlevel% equ 0 (
  echo ========================================================
  echo   SUCCESS: Uploaded to https://github.com/Sidharthzidzid/projection-mapping
  echo ========================================================
) else (
  echo.
  echo If authentication failed, GitHub will prompt for login in your browser or for a Personal Access Token.
)
echo.
pause
