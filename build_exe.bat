@echo off
title Crea Vyral.exe
cd /d "%~dp0"
echo Installo gli strumenti...
python -m pip install -q -U pyinstaller pywebview yt-dlp || goto :err
echo Creo Vyral.exe (ci vuole un minuto)...
pyinstaller --noconfirm --onefile --windowed --name Vyral --icon assets/logo.ico --paths fetcher --hidden-import vyral_core --add-data "index.html;web" --add-data "assets;web/assets" --add-data "manifest.webmanifest;web" desktop/vyral_desktop.py || goto :err
copy /y dist\Vyral.exe "%USERPROFILE%\Desktop\Vyral.exe" >nul
echo.
echo Fatto! Trovi Vyral.exe sul Desktop.
pause
exit /b
:err
echo Qualcosa e' andato storto. Hai installato Python (con "Add Python to PATH")?
pause
