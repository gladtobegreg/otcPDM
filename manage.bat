@echo off
setlocal

REM Navigate to the program folder
cd /d "%~dp0src\"

REM Execute Python program
python manage.py

REM End of script.