@echo off
setlocal
title Consulta CNPJ - React

cd /d "%~dp0"

echo ================================================
echo   Consulta CNPJ - React + Tailwind
echo ================================================
echo.

echo Verificando se o Node.js esta instalado...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org/ e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERRO: npm nao encontrado.
  echo Reinstale o Node.js LTS marcando a opcao de instalar o npm.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo Instalando dependencias do projeto...
  echo Isso acontece apenas na primeira execucao.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo ERRO: nao foi possivel instalar as dependencias.
    echo Confira sua conexao com a internet e tente novamente.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Abrindo o navegador em http://localhost:5173 ...
start "" cmd /c "timeout /t 3 >nul && start http://localhost:5173"

echo.
echo Iniciando servidor local...
echo Para encerrar, feche esta janela ou pressione CTRL + C.
echo.
call npm run dev -- --host 127.0.0.1 --port 5173

pause
