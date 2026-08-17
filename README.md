Aqui está o conteúdo do seu `README.md` **100% limpo, corrigido e formatado em Markdown puro**, sem misturar com textos do chat. Adicionei os desenvolvedores que você pediu (**Quizito, Cristiano**) no cabeçalho.

Você pode usar o botão **"Copiar"** no canto superior do bloco de código abaixo para colar diretamente no seu arquivo sem quebrar linhas:

```markdown
# 🛡️ WatchFlow — Plataforma Unificada de Observabilidade e Telemetria

> **Projeto Acadêmico & Sistema Prático de Monitoramento**  
> **Área:** Engenharia de Software / Infraestrutura & Observabilidade  
> **Desenvolvedores:** Quizito, Cristiano  
> **Metodologia:** Alinhado aos Princípios do PMBOK 7ª Edição e Metodologias Ágeis  

---

## 📌 1. Visão Geral do Projeto

O **WatchFlow** é uma solução moderna de monitoramento e observabilidade desenvolvida para resolver a fragmentação de ferramentas no gerenciamento de infraestruturas de TI.

Em vez de exigir cadastros manuais e repetitivos de servidores, CPUs ou bancos de dados, o WatchFlow opera sob o conceito de **Auto-Discovery (Descoberta Automática)**, onde os próprios agentes de telemetria (como **Node Exporter**, **Telegraf** e **Zabbix Agent**) enviam os dados e alimentam o ecossistema automaticamente.

### 🎯 Problema que o Sistema Resolve

1. **Fim do Cadastro Manual:** O usuário não precisa cadastrar cada IP ou servidor na mão. O sistema identifica e cria o recurso na primeira coleta.
2. **Centralização de Agentes:** Unifica métricas de diferentes ferramentas (Prometheus/Node Exporter, Telegraf, Zabbix) em um único painel.
3. **Visibilidade Executiva de SLA:** Transforma métricas de hardware (CPU, RAM, Disco, Rede) em indicadores claros de saúde e SLA.
4. **Agilidade na Resolução de Incidentes (MTTR):** Central de alertas que notifica gargalos de capacidade antes da queda dos serviços.

---

## 🏛️ 2. Alinhamento com o PMBOK (Gestão de Projetos)

Como um projeto acadêmico de alta maturidade, o WatchFlow adota os **Domínios de Desempenho do PMBOK**:

| Domínio PMBOK | Aplicação Prática no WatchFlow |
| :--- | :--- |
| **Partes Interessadas (Stakeholders)** | Atende necessidades de SysAdmins, DevOps, Gestores de TI e a Banca Examinadora. |
| **Escopo do Projeto** | Mapeamento delimitado em 9 telas funcionais focadas em observabilidade. |
| **Entrega de Valor** | Redução do tempo de diagnóstico e monitoramento unificado e proativo. |
| **Medição e Desempenho** | Acompanhamento contínuo de indicadores de disponibilidade e SLA global. |
| **Gestão de Incertezas e Riscos** | Otimização de custos de banco NoSQL utilizando subcoleções e retenção temporal no Firestore. |

---

## 🔄 3. Arquitetura de Telemetria e Auto-Discovery

```text
┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Node Exporter  │     │   Telegraf   │     │ Zabbix Agent │
└───────┬────────┘     └──────┬───────┘     └──────┬───────┘
        │                     │                    │
        └─────────────────────┼────────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ Backend WatchFlow│ (Polling / Ingestion)
                     └────────┬─────────┘
                              │ Auto-discovery / Upsert
                              ▼
                     ┌──────────────────┐
                     │Firebase Firestore│
                     └────────┬─────────┘
                              │ Realtime Subscriptions
                              ▼
                     ┌──────────────────┐
                     │ Dashboard React  │
                     └──────────────────┘

```

**Fluxo de Dados:**

1. O usuário cadastra apenas as Integrações (endpoints dos agentes).
2. O Backend obtém o payload de telemetria.
3. O sistema faz o upsert automático no `devices` (se for a primeira vez, cria o dispositivo).
4. Grava o histórico na subcoleção `metrics` e gera `alerts` se os thresholds forem violados.

---

## 🗄️ 4. Modelagem do Banco de Dados NoSQL (Firestore Schema)

Estruturado para suportar gravações frequentes de séries temporais com alto desempenho de leitura.

```text
users/{userId}                           (Coleção Raiz: Usuários)
 └── integrations/{integrationId}        (Subcoleção: Conexões de Coleta)

devices/{deviceId}                       (Coleção Raiz: Servidores Descobertos)
 ├── metrics/{metricId}                  (Subcoleção: Série Temporal de Métricas)
 └── alerts/{alertId}                    (Subcoleção: Alertas do Dispositivo)

alerts/{alertId}                         (Coleção Raiz: Central Global de Incidentes)
reports/{reportId}                       (Coleção Raiz: Relatórios Gerados)

```

### Exemplos dos Documentos JSON:

#### `users/{userId}/integrations/{integrationId}`

```json
{
  "id": "int_node_exp_01",
  "type": "node_exporter",
  "name": "Servidores de Produção",
  "baseUrl": "[http://192.168.0.15:9100](http://192.168.0.15:9100)",
  "status": "online",
  "lastSync": "2026-08-15T19:14:10Z",
  "version": "1.9.0"
}

```

#### `devices/{deviceId}`

```json
{
  "id": "dev_srv_api_01",
  "userId": "usr_99812a",
  "integrationId": "int_node_exp_01",
  "hostname": "srv-api-01",
  "ip": "192.168.0.10",
  "os": { "distro": "Ubuntu 24.04 LTS" },
  "status": "online",
  "latestMetricsSummary": { "cpu": 42, "memory": 63, "disk": 71 }
}

```

#### `devices/{deviceId}/metrics/{metricId}`

```json
{
  "collectedAt": "2026-08-15T19:14:13Z",
  "cpu": { "usagePercent": 42.5 },
  "memory": { "usedPercent": 63.1 },
  "disk": { "usedPercent": 71.0 },
  "network": { "bytesInSec": 1200, "bytesOutSec": 980 }
}

```

---

## 🖥️ 5. Mapeamento das 9 Telas do Sistema

| # | Tela | Função Principal | Fonte de Dados (Firestore) |
| --- | --- | --- | --- |
| **1** | Login | Autenticação do usuário | Firebase Auth |
| **2** | Cadastro | Criação de conta | Firebase Auth + `users` |
| **3** | Dashboard | Visão geral de KPIs, SLA e incidentes | `devices`, `alerts`, `metrics` |
| **4** | Integrações | Status de conexão do Node Exporter, Telegraf e Zabbix | `users/{id}/integrations` |
| **5** | Dispositivos | Lista dos servidores descobertos automaticamente | `devices` |
| **6** | Métricas | Gráficos detalhados temporais por dispositivo | `devices/{id}/metrics` |
| **7** | Alertas | Central de incidentes e regras disparadas | `alerts` |
| **8** | Relatórios | Geração de PDFs e CSVs de disponibilidade/SLA | `reports` |
| **9** | Perfil | Configurações de conta e alertas | `users` |

---

## 📋 6. Checklist de Desenvolvimento do Projeto

* [x] **Etapa 1:** Definição da Arquitetura & Troca para Auto-discovery
* [x] **Etapa 2:** Modelagem de Dados NoSQL e Schemas do Firestore
* [x] **Etapa 3:** Protótipo / Código do Dashboard de Alta Fidelidade (Visão Geral)
* [ ] **Etapa 4:** Desenvolvimento da Tela 4 — Integrações (Próximo Passo)
* [ ] **Etapa 5:** Desenvolvimento da Tela 5 — Dispositivos Descobertos
* [ ] **Etapa 6:** Desenvolvimento da Tela 6 — Métricas Detalhadas
* [ ] **Etapa 7:** Central de Alertas
* [ ] **Etapa 8:** Módulo de Relatórios (PDF/CSV)
* [ ] **Etapa 9:** Conexão em tempo real com Firebase SDK

```

```