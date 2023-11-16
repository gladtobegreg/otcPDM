@echo off
setlocal

REM Navigate to the program folder
cd /d "%~dp0src\"

REM Execute Python program
python randomize.py

REM Navigate back to the parent directory
cd..

REM Once Node.js program finishes, open HTML file
start "" "selectedItems.html"

REM End of script.