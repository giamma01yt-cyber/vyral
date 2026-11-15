@echo off
title Vyral - Collega YouTube Studio
cd /d "%~dp0"
chcp 65001 >nul
where python >nul 2>&1 || (echo Python non trovato. Installalo da https://www.python.org/downloads/ spuntando "Add Python to PATH". & pause & exit /b)
python studio_setup.py
