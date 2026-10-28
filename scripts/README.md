# 📡 WatchFlow — Agente de Telemetria Local e Guia de Execução

Este diretório contém os scripts do agente de monitoramento da máquina local para o **WatchFlow**.

---

## 🎯 Como funciona o Monitoramento Local

O WatchFlow agora tem **duas formas** de monitorar a sua máquina sem gastar nada do saldo da AWS:

### Opção 1: Direto pelo Navegador (1-Click)
1. Inicie a aplicação WatchFlow e faça login.
2. Acesse o menu **Dispositivos** (`/devices`).
3. Clique no botão **"Conectar Máquina Local"**.
4. O sistema registra seu computador no Firebase Firestore e começa a alimentar o Dashboard e a tela de Métricas!
5. Abra a tela **Métricas** (`/metrics`) para acompanhar os gráficos em tempo real via **Recharts**.

---

### Opção 2: Agente em Background (PowerShell Nativo)
O script `agent-local.ps1` lê o hardware real do seu computador (CPU, RAM física e Disco) via WMI/CIM do Windows a cada 5 segundos e envia para a sua conta no Firestore:

```powershell
# Execução básica (exibe no terminal em tempo real):
.\scripts\agent-local.ps1

# Execução sincronizada com o Firebase:
.\scripts\agent-local.ps1 -UserId "SEU_UID_DO_FIREBASE" -ProjectId "SEU_PROJECT_ID"
```

---

## 🛡️ APM (Sentry) — Como Demonstrar para o Professor

1. O módulo Sentry foi integrado em `src/lib/sentry.ts` e inicializado em `src/main.tsx`.
2. Para conectar com sua conta gratuita do Sentry:
   * Crie uma conta em [sentry.io](https://sentry.io) e crie um projeto React.
   * Copie a chave **DSN** e cole no seu arquivo `.env`:
     ```env
     VITE_SENTRY_DSN=https://xxxxxxxx@o00000.ingest.sentry.io/000000
     ```
3. A partir desse momento, qualquer erro de execução ou teste dispara alertas no painel da APM!

---

## ☁️ Como Migrar para a AWS Depois (Usando os $50)
Quando o professor pedir para ver na nuvem:
1. Suba uma instância EC2 Linux gratuita (ex: Ubuntu 24.04).
2. Na AWS EC2, instale o **Node Exporter**:
   ```bash
   sudo apt update && sudo apt install prometheus-node-exporter -y
   ```
3. No WatchFlow, cadastre a URL pública da AWS em **Integrações**: `http://IP_DA_EC2:9100`.
