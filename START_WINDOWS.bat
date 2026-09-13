@echo off
setlocal
cd /d "%~dp0"
where flutter >nul 2>nul
if errorlevel 1 goto missing
echo Start your Android emulator before continuing.
echo First build downloads packages and Android build dependencies.
call flutter pub get
if errorlevel 1 goto failed
call flutter devices
call flutter run
if errorlevel 1 goto failed
pause
exit /b 0
:missing
echo Flutter is not on PATH. Install Flutter and restart your terminal.
pause
exit /b 1
:failed
echo Launch failed. Run flutter doctor -v and review the error above.
pause
exit /b 1
