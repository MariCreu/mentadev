@echo off
rem Abre el panel local de prospeccion en http://localhost:4321 (solo en este ordenador).
rem Para cerrarlo, cierra esta ventana.
cd /d "%~dp0"
node --no-warnings prospecting\panel.mjs
pause
