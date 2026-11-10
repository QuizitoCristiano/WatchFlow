# 🛡️ WatchFlow — Plataforma Unificada de Observabilidade, Telemetria & APM

> **Projeto Acadêmico & Sistema Prático de Monitoramento**  
> **Instituição:** Universidade Tuiuti do Paraná (UTP) — Análise e Desenvolvimento de Sistemas (ADS)  
> **Desenvolvedores:** Quizito, Cristiano  
> **Metodologia:** Alinhado aos Princípios do PMBOK 7ª Edição e Práticas DevOps / SRE  
> **APM Integrado:** Sentry Enterprise-grade Application Performance Monitoring  

---

## 📌 1. Visão Geral do Projeto

O **WatchFlow** é uma solução moderna de observabilidade e monitoramento de infraestrutura desenvolvida para eliminar a fragmentação de ferramentas no ecossistema de TI. 

Diferente de ferramentas tradicionais que exigem cadastros manuais e lentos de IPs e ativos, o WatchFlow implementa **Auto-Discovery contínuo**, **Telemetria de Hardware em Tempo Real** (incluindo leitura direta de **GPUs dedicadas** como NVIDIA GeForce) e integração nativa com o **Sentry APM** para rastreabilidade de falhas, métricas de saturação e auditoria de ciclo de vida de ativos.

### 🎯 Problemas que o WatchFlow Resolve

1. **Fim do Cadastro Manual:** O sistema identifica e registra os recursos de hardware automaticamente ao iniciar a telemetria.
2. **Telemetria Completa com Suporte a GPU:** Monitoramento direto de CPU, Memória RAM física, Disco e GPU (NVIDIA via `nvidia-smi`) em tempo real a cada 2 segundos.
3. **Gestão Inteligente de Incidentes com Auto-Recovery:** Transições de estado automáticas (`Normal` ➡️ `Crítico` ➡️ `Resolvido`) com emissão de alertas na interface e despacho para o Sentry APM.
4. **Resiliência e Arquitetura Híbrida:** Suporte a execução distribuída (Firebase Firestore / Coletor Local) e operação local autônoma e segura, garantindo alta disponibilidade mesmo sem conexão externa.

---

## 🏛️ 2. Alinhamento com o PMBOK (7ª Edição)

O WatchFlow adota os Domínios de Desempenho do Guia PMBOK:

| Domínio PMBOK | Aplicação Prática no WatchFlow |
| :--- | :--- |
| **Partes Interessadas (Stakeholders)** | Atende requisitos operacionais de Engenheiros DevOps, SysAdmins, Gestores de TI e a Banca Avaliadora. |
| **Escopo do Projeto** | Mapeamento e entrega de módulos integrados: Dashboard, Integrações, Dispositivos, Métricas, Alertas, Relatórios, Configurações, Perfil e Sobre Nós. |
| **Entrega de Valor** | Redução drástica do MTTR (Mean Time to Resolution) através de alertas proativos com Sentry APM. |
| **Medição e Desempenho** | Coleta contínua de telemetria a cada 2000ms com gráficos interativos e rastreamento de SLA. |
| **Gestão de Incertezas e Riscos** | Tolerância a falhas na camada de nuvem (fallback local resiliente) e prevenção contra estouro de quotas. |

---

## 🔄 3. Arquitetura de Observabilidade & APM

```text
┌────────────────────────────────────────────────────────┐
│             HARDWARE DA MÁQUINA MONITORADA             │
│   AMD Ryzen 7 (CPU) | 16GB RAM | NVIDIA GTX 1060 (GPU) │
└──────────────────────────┬─────────────────────────────┘
                           │ Coleta OS (os.cpus, mem, nvidia-smi)
                           ▼
┌────────────────────────────────────────────────────────┐
│           Vite Local Telemetry Engine (Node.js)        │
│    GET /api/system-metrics  |  POST /api/trigger-stress│
└──────────────────────────┬─────────────────────────────┘
                           │ Polling a cada 2s
                           ▼
┌────────────────────────────────────────────────────────┐
│            WatchFlow Frontend (React + TypeScript)     │
│   • Recharts (Gráficos Temporais de GPU, CPU, RAM)    │
│   • State Machine de Alertas (>90%) + Auto-Recovery   │
│   • Notificações Visuais em Tempo Real (Sonner Toasts) │
└─────────────┬──────────────────────────┬───────────────┘
              │                          │
              ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────┐
│     Firebase Firestore   │   │       Sentry APM        │
│ (Persistência / Nuvem)   │   │  (Issues, Traces, SLA,  │
│                          │   │   Lifecycle de Hosts)   │
└──────────────────────────┘   └─────────────────────────┘
```

---

## 🔍 4. Comparativo Técnico de APMs Avaliados

Para atender aos critérios de escolha de APM do projeto, foram avaliadas 3 soluções de mercado:

| Critério | Sentry (Escolhido) | Datadog | Better Stack |
| :--- | :--- | :--- | :--- |
| **Foco Principal** | Rastreamento de Erros, Telemetria & Performance | Infraestrutura Enterprise & Logs | Uptime Monitoring & Logs simplificados |
| **Free Tier / Custo** | Gratuito e generoso (sem exigir cartão de crédito) | Trial limitado a 14 dias (pago após o período) | Plano gratuito restrito |
| **Overhead no Frontend** | Mínimo (~30KB gzipped) | Moderado / Pesado | Mínimo |
| **Deduplicação / Fingerprints** | Totalmente customizável via código (`setFingerprint`) | Automática via Tags e Facets | Básica por mensagem |
| **Facilidade de Demonstração** | Painel web com atualização em tempo real | Painel web complexo com atraso de ingestão | Painel focado em Uptime Ping |

---

## 🖥️ 5. Mapeamento dos Módulos do Sistema

| # | Módulo | Função Principal | Integração / Fonte |
| :---: | :--- | :--- | :--- |
| **1** | **Dashboard** | Visão executiva de saúde do cluster, KPIs de SLA e lista rápida de hosts | Telemetria Local + Firestore |
| **2** | **Dispositivos** | Cards em tempo real com barras de CPU, RAM, Disco e **GPU dedicada** | `system-metrics` + Sentry Lifecycle |
| **3** | **Métricas** | Gráficos temporais Recharts com aba dedicada para GPU e histórico de 30 pontos | `metricService` |
| **4** | **Alertas** | Central de incidentes com filtros, auto-recovery, botão de resolver e simulação | `deviceService` + Sentry APM |
| **5** | **Integrações** | Conectores para Node Exporter, Telegraf e Zabbix Agent com autodescoberta | `integrationService` |
| **6** | **Relatórios** | Exportação de métricas e relatórios em PDF e CSV | `ReportsPage` |
| **7** | **Configurações** | Ajuste de limites e thresholds de saturação | `settings.service` |
| **8** | **Perfil** | Gestão de dados do operador e preferências de alerta | `profile.service` |
| **9** | **Sobre Nós** | Informações institucionais da equipe acadêmica e objetivos UTP | Componente institucional |

---

## 🚀 6. Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v18+)
- **Git**
- Placa de vídeo NVIDIA (opcional — caso não tenha, o sistema adota fallback automático de GPU)

### Passos:

```bash
# 1. Clonar o repositório
git clone https://github.com/QuizitoCristiano/WatchFlow.git
cd WatchFlow

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (já pré-configurado com a DSN do Sentry)
cp .env.example .env

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse no navegador: `http://localhost:5173`.

---

## 🧪 7. Roteiro de Demonstração para a Banca

1. **Apresentação Inicial:** Mostrar o **Dashboard** com o host local `srv-local-pc` operacional e o status `ONLINE`.
2. **Telemetria de Hardware & GPU:** Ir para a aba **Dispositivos** e **Métricas** mostrando a leitura real dos 16 threads do processador e da GPU GTX 1060.
3. **Simulação / Carga Real:**
   - Clicar em **"Simular Sobrecarga (Pico > 90%)"** ou abrir uma aplicação pesada (ex.: *God of War*);
   - Observar o badge mudar imediatamente para `CRITICAL` e os **Toasts visuais** alertando o estouro de 90%;
4. **Validação no Sentry APM:**
   - Abrir o dashboard do [Sentry Issues](https://watchflow.sentry.io/issues/);
   - Demonstrar o recebimento dos eventos com detalhes completos do hardware e tags de recurso;
5. **Auto-Recovery:**
   - Observar que, ao normalizar a carga, a notificação de resolução é emitida e o dispositivo retorna para `ONLINE`.

---

## 📚 8. Documentação Técnica Detalhada

- [Visão Geral da Arquitetura](docs/architecture/overview.md)
- [Especificação do Coletor](docs/architecture/monitoring-collector.md)
- [Contrato e Retenção de Dados de Métricas](docs/architecture/metrics-data-contract.md)
- [Análise Histórica da Arquitetura de Ingestão](docs/architecture/metrics-ingestion-architecture.md)
- [Viabilidade Técnica e Financeira da Ingestão](docs/architecture/ingestion-feasibility.md)
- [Roadmap e Pendências](docs/development/roadmap.md)
