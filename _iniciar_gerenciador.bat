@echo off
title Nexus SQL View Manager - Live
cls

echo =========================================================
echo  [NEXUS] INICIANDO O SERVIDOR DO GERENCIADOR WEB...
echo =========================================================
echo.

:: 1. Direcione para a pasta onde o seu projeto está salvo localmente
cd /d "E:\Google AI Studio\SQL-View-Governance-Dashboard"

:: 2. Sincroniza o Git se você usar repositório compartilhado (Opcional - remova "::" para ativar)
echo [GIT] Sincronizando views mais recentes...
git pull origin main
pause

:: 3. Abre o navegador na porta do sistema automaticamente
echo [BROWSER] Carregando interface web do usuario...
start "" "http://localhost:3000/"

:: 4. Executa o servidor principal do Node.js
echo [SERVER] Iniciando o motor Express + Vite local...
npm run dev

pause