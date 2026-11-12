# UNIVERSIDADE TUIUTI DO PARANÁ — UTP
## FACULDADE DE CIÊNCIAS EXATAS E TECNOLOGIA
### CURSO DE ANÁLISE E DESENVOLVIMENTO DE SISTEMAS (ADS)

---

<br />

# **WATCHFLOW**
### **Plataforma Unificada de Observabilidade, Telemetria de Hardware & Monitoramento de Desempenho de Aplicações (APM)**

<br />

**Autores / Desenvolvedores:**  
Quizito, Cristiano  

**Professor / Orientador da Disciplina:**  
Prof. da Disciplina de Projeto de Software / Infraestrutura  

<br />

**Curitiba — PR**  
**Novembro de 2026**

---

<div style="page-break-after: always;"></div>

## **SUMÁRIO EXECUTIVO**

1. [INTRODUÇÃO E CONTEXTUALIZAÇÃO](#1-introdução-e-contextualização)
2. [OBJETIVOS DO PROJETO (ALINHAMENTO 1º BIMESTRE)](#2-objetivos-do-projeto-alinhamento-1º-bimestre)
   - 2.1 Objetivo Geral
   - 2.2 Objetivos Específicos
3. [ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO](#3-arquitetura-técnica-e-fluxo-de-monitoramento)
   - 3.1 Modelo Arquitetural: Distribuído, Híbrido e Auto-Discovery
   - 3.2 Protocolos, Coletores e Camada de Leitura de Hardware
   - 3.3 Diagrama Completo do Fluxo de Telemetria e Dados
4. [JUSTIFICATIVA TÉCNICA DA ESCOLHA DA APM](#4-justificativa-técnica-da-escolha-da-apm)
   - 4.1 Estudo Comparativo de Soluções de Mercado (Sentry vs. Datadog vs. Better Stack)
   - 4.2 Critérios de Seleção e Decisão pelo Sentry APM
5. [IMPLEMENTAÇÃO DA APM E ESPECIFICIDADES NO WATCHFLOW](#5-implementação-da-apm-e-especificidades-no-watchflow)
   - 5.1 Rastreamento de Ciclo de Vida de Hosts (Conexão e Desconexão)
   - 5.2 Violação de Thresholds Críticos (>90%) e Cooldown Inteligente
   - 5.3 Máquina de Estados e Normalização Automática (Auto-Recovery)
   - 5.4 Distributed Tracing e Tratamento de Exceções
6. [EVIDÊNCIAS PRÁTICAS E RESULTADOS OBTIDOS (PRINTS & DEMONSTRAÇÕES)](#6-evidências-práticas-e-resultados-obtidos-prints--demonstrações)
   - 6.1 Descoberta e Telemetria Real de Hardware (CPU Ryzen 7, RAM e GPU NVIDIA GTX 1060)
   - 6.2 Painel de Métricas e Gráficos Históricos Temporais
   - 6.3 Teste de Sobrecarga em Carga Real (*God of War* com 95% GPU e 97% RAM)
   - 6.4 Central de Incidentes com Notificações em Tempo Real (Toasts)
   - 6.5 Painel Sentry APM com Eventos, Tags e Severidades Capturadas
7. [CONCLUSÃO E CUMPRIMENTO DOS OBJETIVOS](#7-conclusão-e-cumprimento-dos-objetivos)
   - 7.1 Confronto entre Objetivos Planejados e Entregas Realizadas
   - 7.2 Alinhamento com os Princípios do PMBOK 7ª Edição
   - 7.3 Trabalhos Futuros e Evolução do Sistema
8. [REFERÊNCIAS BIBLIOGRÁFICAS (ABNT)](#8-referências-bibliográficas-abnt)

---

<div style="page-break-after: always;"></div>

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO

Na operação contemporânea de ambientes de Tecnologia da Informação, a fragmentação de ferramentas de infraestrutura, a dependência de cadastros manuais de ativos e a ausência de rastreabilidade de falhas em tempo real representam gargalos severos para equipes de Engenharia de Software e SRE (*Site Reliability Engineering*). Ambientes heterogêneos exigem inspeção contínua não apenas de métricas operacionais clássicas (como ocupação de processador e memória volátil), mas também de unidades de processamento gráfico dedicadas (GPUs) e rastreamento transacional de falhas em nível de aplicação.

O **WatchFlow** foi concebido como uma plataforma unificada de observabilidade e telemetria com capacidade de **Auto-Discovery** (descoberta automática de hosts), integração nativa com o **Sentry APM** (*Application Performance Monitoring*) e um motor de detecção proativa de anomalias com normalização automática (*Auto-Recovery*).

O presente relatório técnico cumpre os requisitos avaliativos do 2º Bimestre, detalhando formalmente o **fluxo de dados do monitoramento**, a **justificativa fundamentada para a adoção da APM selecionada**, a **apresentação das evidências práticas e prints da telemetria sob estresse** e a **conclusão analítica balizada pelos objetivos fixados no início do projeto**.

---

## 2. OBJETIVOS DO PROJETO (ALINHAMENTO 1º BIMESTRE)

Conforme estabelecido na Especificação de Software apresentada no primeiro bimestre acadêmico, o escopo do WatchFlow foi guiado pelas seguintes metas estruturantes:

### 2.1 Objetivo Geral
Desenvolver e validar uma aplicação web com arquitetura distribuída e resiliente capaz de centralizar o monitoramento de saúde de ativos de TI, processando telemetria em tempo real, persistindo séries temporais e integrando uma ferramenta de APM de padrão corporativo para notificação e análise de incidentes.

### 2.2 Objetivos Específicos
1. **Autenticação e Controle de Sessão:** Implementar controle de acesso seguro para segregação de ambientes e histórico do operador.
2. **Auto-Discovery e Conectividade de Agentes:** Substituir o cadastramento manual de servidores por mecanismos de descoberta baseados na recepção de fluxos de telemetria (Prometheus Node Exporter, Telegraf, Zabbix Agent e agentes locais).
3. **Telemetria de Hardware Completa (sem mocks):** Coletar contadores reais do sistema operacional, incluindo CPU multinúcleo, memória física, disco e **placas gráficas dedicadas (NVIDIA GPU)**.
4. **Engine de Alertas e Incidentes:** Avaliar periodicamente thresholds de saturação (>90%), disparando eventos de alerta com severidade categorizada.
5. **Integração com APM Corporativo:** Conectar a aplicação a uma plataforma de APM para registro de exceções, auditoria de ciclo de vida de ativos e rastreabilidade distribuída (*distributed tracing*).
6. **Mecanismo de Auto-Recovery:** Implementar normalização de estado para fechamento automático de incidentes quando os recursos retornam a parâmetros seguros.
7. **Resiliência e Tolerância a Falhas:** Garantir operação autônoma da plataforma através de buffers locais mesmo sob indisponibilidade temporária de conectividade externa.

---

## 3. ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO

Conforme orientado pela banca examinadora, a documentação de um projeto de observabilidade não deve restringir-se a instruções triviais de instalação, mas sim evidenciar a **arquitetura de comunicação, protocolos empregados e o fluxo de dados entre os nós**.

### 3.1 Modelo Arquitetural: Distribuído, Híbrido e Auto-Discovery
O WatchFlow opera sob uma topologia distribuída com modelo de ingestão híbrido (push/pull):

* **Topologia Distribuída:** Os nós monitorados (servidores Linux, instâncias em nuvem ou estações locais) executam agentes ou bridges de telemetria independentes que dialogam com a camada de visualização e persistência.
* **Auto-Discovery (Descoberta Automática):** Ao identificar a emissão de métricas de um novo endereço IP ou hostname, a plataforma realiza um procedimento de *upsert* automático: cria o registro do dispositivo em caso de primeiro contato ou atualiza o sumário de métricas e o indicador de última visualização (*lastSeen*).
* **Arquitetura Híbrida de Persistência:** Os dados de telemetria e incidentes podem ser gravados tanto em nuvem via **Firebase Cloud Firestore** (em ambiente produtivo compartilhado) quanto em **Cache/Buffer Local em Storage e Memória**, permitindo que o sistema opere com zero perda de continuidade mesmo sem credenciais ativas de nuvem.

### 3.2 Protocolos, Coletores e Camada de Leitura de Hardware

```
   +-------------------------------------------------------------------------+
   |                     HARDWARE FÍSICO DO DISPOSITIVO                      |
   |   • CPU: AMD Ryzen 7 5700X (16 threads / 8 núcleos)                     |
   |   • RAM: 16 GB DDR4 (15.9 GB endereçáveis)                              |
   |   • Disco: Volume SSD / C:\ (999 GB)                                    |
   |   • GPU: NVIDIA GeForce GTX 1060 6GB (Driver PCI-Express)               |
   +-------------------------------------------------------------------------+
                                        │
                                        ▼ Chamadas nativas de SO
   +-------------------------------------------------------------------------+
   |                  CAMADA DE COLETA E BRIDGE NODE.JS                      |
   |   • CPU / RAM: Módulo 'os' nativo (os.cpus(), os.totalmem())            |
   |   • Disco: Chamada síncrona de bloco de arquivos (fs.statfsSync())      |
   |   • GPU: Execução de 'nvidia-smi' via child_process                     |
   |   • Fallback GPU: WMI do Windows ('Get-CimInstance Win32_VideoController')|
   +-------------------------------------------------------------------------+
                                        │
                                        ▼ Streaming REST JSON (a cada 2000ms)
   +-------------------------------------------------------------------------+
   |                     WATCHFLOW FRONTEND (APLICAÇÃO)                      |
   |   • Engine de Estado: Polling de 2 segundos (deviceService.ts)          |
   |   • Recharts: Séries temporais de CPU, RAM, Disco, GPU e Rede           |
   |   • State Machine de Alertas: Limiar de saturação > 90%                 |
   |   • Cooldown: 45 segundos anti-flooding com normalização automática     |
   +──────────────────────────┬──────────────────────────┬───────────────────+
                              │                          │
                              ▼ Envio de Métricas        ▼ Despacho de Eventos Críticos
                   +──────────────────────+   +──────────────────────────────+
                   |  FIREBASE FIRESTORE  |   |          SENTRY APM          |
                   |  • Subcoleções       |   |  • Issues individuais        |
                   |  • Índices temporais |   |  • Distributed Tracing       |
                   |  • Retenção métricas |   |  • Lifecycle de ativos       |
                   +──────────────────────+   +──────────────────────────────+
```

1. **Leitura da GPU sem Dependências Externas ou Mocks:**  
   A coleta da unidade gráfica é executada consultando a ferramenta nativa do driver NVIDIA:
   $$\text{Comando: } \texttt{nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits}$$
   O retorno é analisado sintaticamente, extraindo dinamicamente o nome da placa, percentual de uso, VRAM alocada (MB) e temperatura (°C). Caso o dispositivo utilize outra fabricante (AMD Radeon ou Intel Graphics), a plataforma aciona o fallback via WMI (*Windows Management Instrumentation*), assegurando compatibilidade universal.

2. **Cálculo Preciso de Carga de CPU:**  
   O percentual de processamento não utiliza números aleatórios. O sistema calcula o diferencial de tempo de atividade dos núcleos entre dois instantes sucessivos $t_1$ e $t_2$:
   $$\Delta \text{Idle} = \text{idle}_{t_2} - \text{idle}_{t_1}, \quad \Delta \text{Total} = \text{total}_{t_2} - \text{total}_{t_1}$$
   $$\text{CPU}_{\%} = 100 \times \left(1 - \frac{\Delta \text{Idle}}{\Delta \text{Total}}\right)$$

3. **Padronização para Coletores de Mercado:**  
   Além da coleta local direta, o WatchFlow dispõe de adaptadores para integração com endpoints no padrão **Prometheus** (`/metrics` na porta 9100 do Node Exporter), permitindo que agentes remotos alimentem o sistema sob o mesmo contrato de dados.

---

## 4. JUSTIFICATIVA TÉCNICA DA ESCOLHA DA APM

A integração de uma ferramenta de APM (*Application Performance Monitoring*) foi motivada pela necessidade de ir além do monitoramento passivo de infraestrutura, incorporando **visibilidade profunda sobre o comportamento da aplicação em tempo de execução, rastreamento de latência e captura estruturada de exceções**.

### 4.1 Estudo Comparativo de Soluções de Mercado
Para atender ao escopo acadêmico e aos requisitos de viabilidade técnica e financeira, foram confrontadas três ferramentas líderes de observabilidade:

| Critério de Análise | **Sentry APM (Escolhido)** | **Datadog** | **Better Stack** |
| :--- | :--- | :--- | :--- |
| **Domínio Primário** | Rastreamento de Erros, Distributed Tracing & APM de Aplicações | Observabilidade corporativa completa (Infra, Logs, APM, Redes) | Monitoramento de Uptime (Heartbeat/Ping) e agregação de logs |
| **Modelo de Licenciamento & Free Tier** | **Plano gratuito perpétuo e generoso** (sem necessidade de cartão de crédito para fins acadêmicos/pesquisa) | Trial restrito a 14 dias; exige faturamento corporativo pós-período | Plano gratuito limitado a poucos monitores e retenção de logs curta |
| **Sobrecarga no Cliente (*Overhead*)** | **Extremamente leve (~30 KB gzipped)** via `@sentry/react` | Moderado a elevado (SDK complexo com alto consumo de memória) | Mínimo (foco em chamadas HTTP) |
| **Granularidade de Fingerprint** | **Totalmente customizável via código (`setFingerprint`)**, permitindo agrupar ou segregar incidentes por hardware | Automático por facets e tags de serviço | Básico, baseado exclusivamente na mensagem textual |
| **Distributed Tracing** | **Nativo com `browserTracingIntegration`**, medindo tempos de renderização e rotas | Nativo com APM Agent completo | Focado em tempos de resposta de rede (TTFB) |
| **Adequação ao WatchFlow** | **Excelente:** Conecta-se diretamente ao React e recebe alertas de saturação em tempo real | **Inadequado:** Bloqueio comercial após 2 semanas inviabilizaria a banca | **Parcial:** Não ofereceria a profundidade de tracing necessária |

### 4.2 Critérios de Seleção e Decisão pelo Sentry APM
A escolha do **Sentry** fundamentou-se em quatro pilares técnicos:
1. **Rastreabilidade Fina de Falhas:** O Sentry permite anexar *extras* e *tags* personalizadas em cada evento (ex.: `% de uso da GPU`, `temperatura`, `modelo da CPU`, `hostname`), transformando uma simples notificação de erro em um diagnóstico forense de infraestrutura.
2. **Controle Estrito de Deduplicação:** A biblioteca expõe APIs explícitas de controle de escopo (`Sentry.withScope`), viabilizando a definição de regras determinísticas de agrupamento por tipo de métrica.
3. **Sustentabilidade Operacional:** Ausência de travas de expiração comercial, permitindo que o projeto permaneça operacional para bancas futuras e avaliações continuadas.
4. **Alinhamento com SRE:** Capacidade de mensurar transações web, avaliar o impacto de degradações de hardware na experiência do usuário e auditar o ciclo de vida dos nós monitorados.

---

## 5. IMPLEMENTAÇÃO DA APM E ESPECIFICIDADES NO WATCHFLOW

Diferente de implementações triviais que utilizam o APM apenas como repositório de falhas não tratadas (*unhandled rejections*), o WatchFlow utiliza o Sentry de maneira arquiteturalmente ativa:

### 5.1 Rastreamento de Ciclo de Vida de Hosts (Conexão e Desconexão)
Sempre que um novo host é descoberto e conectado ou quando o operador executa a desconexão de um dispositivo, o WatchFlow emite um evento de ciclo de vida com severidade de auditoria para o Sentry:
* **Evento de Conexão:** Registra o hostname, arquitetura do SO, núcleos de processamento, total de memória RAM e GPU detectada.
* **Evento de Desconexão:** Audita a remoção do ativo com o identificador do dispositivo e timestamp.

### 5.2 Violação de Thresholds Críticos (>90%) e Cooldown Inteligente
O motor de alertas avalia continuamente as métricas coletadas a cada 2000ms. Quando um recurso (CPU, Memória RAM ou GPU) atinge ou ultrapassa **90% de ocupação**, o sistema despacha uma Issue de severidade `fatal` ao Sentry:
* **Prevenção contra Tempestade de Alertas (*Alert Storms*):** Para não exaurir a cota de ingestão do APM e não poluir a visualização operacional, foi implementado um **cooldown de 45 segundos**. Enquanto o recurso persistir em estado crítico, atualizações periódicas ocorrem a cada 45s, e não a cada 2 segundos.
* **Fingerprinting Dinâmico:** Cada alerta utiliza fingerprint estruturado `[title, metric]`, permitindo que incidentes de GPU fiquem claramente separados de incidentes de RAM e CPU.

### 5.3 Máquina de Estados e Normalização Automática (Auto-Recovery)
O sistema implementa uma máquina de estados finita para cada métrica:
$$\text{Estado: } \texttt{NORMAL} \xrightarrow{\text{Métrica } \ge 90\%} \texttt{CRÍTICO} \xrightarrow{\text{Métrica } < 90\%} \texttt{RESOLVIDO (Auto-Recovery)}$$
Ao retornar para parâmetros seguros (< 90%), o WatchFlow:
1. Marca o incidente como `resolved` na base de dados com timestamp de resolução.
2. Emite uma notificação visual verde (*Toast*) informando a recuperação do recurso.
3. Restaura o status de saúde do dispositivo no card para `ONLINE`.
4. Habilita o sistema a disparar imediatamente um novo alerta caso uma nova sobrecarga ocorra (sem retenção de trava).

### 5.4 Distributed Tracing e Tratamento de Exceções
No módulo `src/lib/sentry.ts`, o SDK é inicializado com:
```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
  environment: import.meta.env.MODE || "development",
  release: "watchflow@1.0.0",
});
```
Isso garante a amostragem integral das transações de roteamento e renderização dos gráficos, atendendo ao requisito de auditoria de performance da aplicação.

---

## 6. EVIDÊNCIAS PRÁTICAS E RESULTADOS OBTIDOS (PRINTS & DEMONSTRAÇÕES)

Para comprovar o pleno funcionamento da plataforma e a veracidade da telemetria, foram realizados ensaios práticos em ambiente real no host `DESKTOP-FFGBKK3` equipado com processador AMD Ryzen 7 5700X, 16 GB de RAM e placa de vídeo dedicada NVIDIA GeForce GTX 1060 6GB.

### 6.1 Descoberta e Telemetria Real de Hardware
O WatchFlow identificou automaticamente a máquina local sem necessidade de inserção manual de campos.
* **Leitura de Hardware:** 16 núcleos de CPU mapeados, 15.9 GB de RAM calculados com precisão, ocupação do SSD de 999 GB e placa gráfica dedicada com temperatura em tempo real.
* **Visualização no Card:** A interface exibe barras proporcionais dinâmicas por cor (laranja para CPU, ciano para RAM, magenta para Disco e verde para GPU).

![Figura 1: Card de Telemetria Real do Host com Leitura de GPU](./evidencias/03-dispositivos-telemetria-gpu.jpg)
*Figura 1: Telemetria em tempo real no WatchFlow identificando o hardware físico sem mocks.*

### 6.2 Painel de Métricas e Gráficos Históricos Temporais
Na tela de **Métricas**, os dados são plotados em gráficos de linha temporais (utilizando a biblioteca Recharts). A aba dedicada de **GPU** exibe o comportamento histórico dos últimos 30 pontos com atualização contínua, permitindo ao operador correlacionar oscilações de carga gráfica com a latência de rede e uso de memória volátil.

![Figura 2: Gráfico Temporal Interativo com Aba de GPU](./evidencias/04-metricas-grafico-temporal-gpu.png)
*Figura 2: Séries temporais no WatchFlow exibindo oscilações e histórico contínuo da GPU dedicada.*

### 6.3 Teste de Sobrecarga em Carga Real (*God of War* com 95% GPU e 97% RAM)
Para comprovar que o sistema não utiliza valores simulados e responde fielmente ao hardware, foi executado o jogo *God of War* em resolução nativa na máquina:
* **Comportamento Observado na Aplicação:**
  - O uso da **GPU saltou para 95%**;
  - O consumo de **Memória RAM física alcançou 97%**;
  - O status do host no WatchFlow alterou-se instantaneamente para **`CRITICAL`** com badge em vermelho;
  - O motor de alertas disparou notificações visuais (*toasts*) no topo da tela confirmando o envio da ocorrência ao APM.

![Figura 3: Execução de God of War com 95% GPU e 97% RAM no WatchFlow](./evidencias/01-watchflow-god-of-war-sobrecarga.jpg)
*Figura 3: Detecção de saturação crítica (>90%) sob carga real de jogo.*

### 6.4 Central de Incidentes com Notificações em Tempo Real
A Central de Incidentes (`/alerts`) registrou os eventos categorizados com severidade `CRITICAL`. Na interface, o operador conta com botões de ação rápida para **Reconhecer**, **Resolver** ou **Limpar Histórico**, além de filtros por severidade e status.

### 6.5 Painel Sentry APM com Eventos, Tags e Severidades Capturadas
No dashboard oficial do Sentry (`watchflow.sentry.io`), foram validadas as seguintes ocorrências reais registradas:
1. `[WatchFlow Alert] Sobrecarga Crítica de GPU (96%)` — Nível: *Fatal*, Tag: *resource=GPU*.
2. `[WatchFlow Alert] Esgotamento Crítico de Memória RAM (92%)` — Nível: *Fatal*, Tag: *resource=RAM*.
3. `[WatchFlow Alert] Uso Excessivo de CPU (94%)` — Nível: *Fatal*, Tag: *resource=CPU*.
4. `[WatchFlow Lifecycle] Dispositivo Conectado com Sucesso: srv-local-pc` — Ação: *device_connected*.
5. `[WatchFlow Lifecycle] Dispositivo Desconectado/Removido: srv-local-pc` — Ação: *device_disconnected*.

![Figura 4: Dashboard do Sentry APM com Alertas de Saturação e Lifecycle](./evidencias/02-sentry-issues-alertas-e-lifecycle.jpg)
*Figura 4: Registro de Issues em tempo real no Sentry com severidades, timestamps e agrupamentos.*

Cada evento no Sentry contém o contexto completo serializado: memória alocada, temperatura da GPU no momento do estouro e especificações do sistema operacional Windows 11.

---

## 7. CONCLUSÃO E CUMPRIMENTO DOS OBJETIVOS

### 7.1 Confronto entre Objetivos Planejados e Entregas Realizadas

| Objetivo Estabelecido no 1º Bimestre | Status de Entrega | Evidência Técnica Implementada |
| :--- | :---: | :--- |
| **1. Autenticação e Segurança** | **Concluído** | Autenticação funcional via Firebase Auth com suporte a modo local resiliente. |
| **2. Eliminação de Cadastro Manual** | **Concluído** | Mecanismo de **Auto-Discovery** que registra o host na primeira transmissão de métricas. |
| **3. Telemetria Real de Hardware** | **Concluído** | Coleta contínua de CPU multinúcleo, memória, disco e **GPU dedicada NVIDIA via `nvidia-smi`**. |
| **4. Motor de Alertas por Threshold** | **Concluído** | Engine com limiar de 90%, detecção de picos e cooldown anti-spam de 45 segundos. |
| **5. Integração com APM Corporativo** | **Concluído** | **Sentry APM integrado**, auditando ciclo de vida e capturando saturações críticas em tempo real. |
| **6. Auto-Recovery (Normalização)** | **Concluído** | Transição de estado automática que resolve o incidente ao término da carga. |
| **7. Resiliência a Falhas** | **Concluído** | Camada híbrida com buffer local, eliminando telas em branco mesmo sem internet externa. |

### 7.2 Alinhamento com os Princípios do PMBOK 7ª Edição
O desenvolvimento do WatchFlow demonstrou aderência aos domínios de desempenho do PMBOK:
* **Entrega de Valor:** Redução do tempo médio de diagnóstico (MTTR) de anomalias operacionais.
* **Gestão de Incertezas e Riscos:** Mitigação proativa de riscos de exaustão de cotas de APM e tolerância a falhas na camada de persistência.
* **Medição e Desempenho:** Ciclos de amostragem rigorosos de 2 segundos, oferecendo métricas auditáveis.

### 7.3 Trabalhos Futuros e Evolução do Sistema
Como perspectivas de evolução para versões futuras da plataforma, apontam-se:
1. **Inteligência Artificial Preditiva:** Aplicação de modelos estatísticos para previsão de esgotamento de capacidade de disco antes da ocorrência do incidente.
2. **Coleta Multi-Cloud e Kubernetes:** Desenvolvimento de *DaemonSets* para coleta agregada de pods em clusters Kubernetes gerenciados (EKS/GKE).
3. **Mecanismos de Auto-Remediação (*Self-Healing*):** Execução de *webhooks* e scripts de mitigação automática acionados diretamente pelas ocorrências registradas no Sentry.

---

## 8. REFERÊNCIAS BIBLIOGRÁFICAS (ABNT)

1. **BASS, Len; CLEMENTS, Paul; KAZMAN, Rick.** *Software Architecture in Practice*. 4. ed. Boston: Addison-Wesley Professional, 2021.
2. **MAJORS, Charity; FONG-JONES, Liz; MIRANDA, George.** *Observability Engineering: Achieving Production Excellence*. Sebastopol: O'Reilly Media, 2022.
3. **PROJECT MANAGEMENT INSTITUTE (PMI).** *Um Guia do Conhecimento em Gerenciamento de Projetos (Guia PMBOK)*. 7. ed. Newtown Square: Project Management Institute, 2021.
4. **SENTRY.IO.** *Application Performance Monitoring and Error Tracking Documentation*. Disponível em: <https://docs.sentry.io/>. Acesso em: 10 nov. 2026.
5. **PROMETHEUS AUTHORS.** *Prometheus Node Exporter: Hardware and OS metrics exporter*. Disponível em: <https://prometheus.io/docs/guides/node-exporter/>. Acesso em: 08 nov. 2026.
6. **NVIDIA CORPORATION.** *NVIDIA System Management Interface (nvidia-smi) Reference Guide*. Santa Clara: NVIDIA, 2025.
