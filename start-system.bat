@echo off
echo Iniciando Ginga Distributed Framework...
echo.

REM Verifica se o PM2 está instalado
pm2 --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: PM2 não encontrado. Instale com: npm install -g pm2
    pause
    exit /b 1
)

REM Verifica se o Mosquitto está rodando
echo Verificando Mosquitto...
netstat -an | find ":1883" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Iniciando Mosquitto...
    start /B mosquitto -c mosquitto\mosquitto.conf
    timeout /t 2 >nul
)

REM Inicia os serviços com PM2
echo Iniciando serviços AoP...
pm2 start wsl.config.js

echo.
echo Sistema iniciado! Acesse:
echo - Interface Principal: http://localhost:8080
echo - Criar Novo Perfil: http://localhost:8080/profile/create
echo - Apps: http://localhost:8081
echo - WebServices: http://localhost:44642
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:8080

echo.
echo Para parar o sistema, execute: pm2 stop all
pause
