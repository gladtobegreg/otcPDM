@echo off
setlocal

REM Navigate to the program folder
cd /d "%~dp0src\"

REM Execute Node.js program
node manage.js

REM End of script.