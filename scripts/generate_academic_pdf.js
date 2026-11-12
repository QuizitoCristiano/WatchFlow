import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const baseDir = process.cwd();
const docsDir = path.join(baseDir, 'docs');
const evidenciasDir = path.join(docsDir, 'evidencias');

function getBase64Image(filename) {
  const filePath = path.join(evidenciasDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

const img1 = getBase64Image('01-watchflow-god-of-war-sobrecarga.jpg');
const img2 = getBase64Image('02-sentry-issues-alertas-e-lifecycle.jpg');
const img3 = getBase64Image('03-dispositivos-telemetria-gpu.jpg');
const img4 = getBase64Image('04-metricas-grafico-temporal-gpu.png');

console.log('Images loaded successfully as Base64.');

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>WatchFlow - Relatório Final de Projeto de Software e Monitoramento de Sistemas</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111111;
      background-color: #ffffff;
    }

    /* Container de Página A4 Rígido */
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      padding: 30mm 20mm 20mm 30mm; /* ABNT: Sup 3cm, Dir 2cm, Inf 2cm, Esq 3cm */
      position: relative;
      page-break-after: always;
      background: #ffffff;
    }

    .page-number {
      position: absolute;
      top: 20mm;
      right: 20mm;
      font-size: 10pt;
      color: #333333;
      font-weight: normal;
    }

    p {
      margin: 0 0 9pt 0;
      text-align: justify;
      text-indent: 1.25cm;
    }

    p.no-indent {
      text-indent: 0;
    }

    h1, h2, h3, h4 {
      color: #000000;
      margin: 14pt 0 8pt 0;
      font-weight: bold;
      page-break-after: avoid;
    }

    h1.primary-title {
      font-size: 12pt;
      text-transform: uppercase;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 10pt;
    }

    h2.secondary-title {
      font-size: 11pt;
      text-transform: uppercase;
      font-weight: normal;
      margin-top: 10pt;
      margin-bottom: 6pt;
    }

    h3.tertiary-title {
      font-size: 11pt;
      text-transform: none;
      font-weight: bold;
      margin-top: 8pt;
      margin-bottom: 5pt;
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 247mm;
      text-align: center;
    }

    .cover-institution {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }

    .cover-author {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 35mm;
    }

    .cover-title-box {
      margin-top: 30mm;
    }

    .cover-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
    }

    .cover-subtitle {
      font-size: 11pt;
      font-weight: normal;
      margin-top: 6pt;
    }

    .cover-footer {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
    }

    .title-page-note-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 25mm;
      margin-bottom: 25mm;
    }

    .title-page-note {
      width: 90mm;
      font-size: 9.5pt;
      line-height: 1.25;
      text-align: justify;
      color: #222222;
    }

    table.abnt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
      font-size: 9pt;
      line-height: 1.2;
    }

    table.abnt-table th, table.abnt-table td {
      border: 1px solid #444444;
      padding: 4.5pt 6pt;
      text-align: left;
    }

    table.abnt-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    .figure-box {
      margin: 8pt 0;
      text-align: center;
    }

    .figure-caption-top {
      font-size: 9.5pt;
      font-weight: bold;
      margin-bottom: 4pt;
      text-align: center;
    }

    .figure-box img {
      max-width: 95%;
      border: 1px solid #cccccc;
      border-radius: 3px;
    }

    .figure-source-bottom {
      font-size: 9pt;
      color: #333333;
      margin-top: 4pt;
      text-align: center;
    }

    pre, code {
      font-family: "Courier New", Courier, monospace;
      font-size: 8.5pt;
    }

    pre {
      background-color: #f8f9fa;
      border: 1px solid #dddddd;
      padding: 6pt 8pt;
      line-height: 1.25;
      margin: 8pt 0;
    }

    ul, ol {
      margin: 0 0 8pt 18pt;
      padding: 0;
    }

    li {
      margin-bottom: 3pt;
      text-align: justify;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5pt;
      font-size: 10pt;
    }

    .toc-item.bold {
      font-weight: bold;
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #888888;
      margin: 0 5pt 3pt 5pt;
    }

    .reference-item {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 10pt;
      text-align: justify;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1: CAPA ==================== -->
  <div class="page">
    <div class="cover">
      <div class="cover-institution">
        UNIVERSIDADE TUIUTI DO PARANÁ<br />
        FACULDADE DE CIÊNCIAS EXATAS E DE TECNOLOGIA<br />
        CURSO SUPERIOR DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS
      </div>

      <div class="cover-author">
        CRISTIANO QUIZITO
      </div>

      <div class="cover-title-box">
        <div class="cover-title">
          WATCHFLOW: PLATAFORMA DE OBSERVABILIDADE, TELEMETRIA DE ATIVOS E MONITORAMENTO DE DESEMPENHO (APM)
        </div>
        <div class="cover-subtitle">
          Relatório Técnico-Científico e Especificação de Projeto de Software
        </div>
      </div>

      <div class="cover-footer">
        CURITIBA<br />
        2026
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: FOLHA DE ROSTO ==================== -->
  <div class="page">
    <div class="cover">
      <div class="cover-author" style="margin-top: 0;">
        CRISTIANO QUIZITO
      </div>

      <div class="cover-title-box" style="margin-top: 25mm;">
        <div class="cover-title">
          WATCHFLOW: PLATAFORMA DE OBSERVABILIDADE, TELEMETRIA DE ATIVOS E MONITORAMENTO DE DESEMPENHO (APM)
        </div>
      </div>

      <div class="title-page-note-container">
        <div class="title-page-note">
          Relatório técnico-científico e de projeto de software apresentado à Faculdade de Ciências Exatas e de Tecnologia da Universidade Tuiuti do Paraná, como requisito avaliativo do 2º bimestre na disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas.
          <br /><br />
          <strong>Professor Orientador:</strong> Prof. Me. André Luiz de Souza Paula
        </div>
      </div>

      <div class="cover-footer">
        CURITIBA<br />
        2026
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 3: RESUMO ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center; margin-bottom: 20pt;">RESUMO</h1>
    <p>
      O presente trabalho descreve o projeto, a arquitetura e a validação experimental do <strong>WatchFlow</strong>, uma plataforma de monitoramento e observabilidade voltada à coleta contínua de métricas de hardware e rastreamento de desempenho de aplicações (APM – <em>Application Performance Monitoring</em>). O monitoramento proativo de infraestrutura é indispensável para evitar indisponibilidades e manter acordos de nível de serviço (SLA). Diante dos custos elevados e da complexidade de ferramentas corporativas proprietárias como o Datadog, desenvolvemos uma arquitetura híbrida e distribuída. O sistema combina agentes de telemetria baseados no padrão Prometheus Node Exporter, WMI (<em>Windows Management Instrumentation</em>) e consultas diretas ao utilitário <code>nvidia-smi</code>, integrando a camada de alertas à plataforma em nuvem Sentry APM. Para validar o comportamento do software sob estresse real de carga, executamos o jogo <em>God of War</em> no computador do laboratório, exigindo 95% de processamento da GPU dedicada e 97% da memória física RAM. Os dados coletados comprovaram a sensibilidade dos coletores, a eficácia do motor de alertas com trava de resfriamento (<em>cooldown</em> de 45 segundos) e a confiabilidade das notificações visuais e dos registros forenses no Sentry, cumprindo integralmente os objetivos fixados no primeiro bimestre.
    </p>
    <p class="no-indent" style="margin-top: 24pt;">
      <strong>Palavras-chave:</strong> Observabilidade. Telemetria de Hardware. Application Performance Monitoring (APM). Sentry. Auto-Discovery. Projeto Interdisciplinar.
    </p>
  </div>

  <!-- ==================== PÁGINA 4: LISTAS ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center;">LISTA DE ILUSTRAÇÕES</h1>
    <br />
    <div class="toc-item"><span>FIGURA 1 – Topologia da Arquitetura Distribuída e Fluxo de Telemetria</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item"><span>FIGURA 2 – Máquina de Estados Finita do Motor de Alertas e Auto-Recovery</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item"><span>FIGURA 3 – Card de Telemetria do Host com Reconhecimento de Hardware e GPU</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item"><span>FIGURA 4 – Painel de Métricas Temporais com Gráfico Interativo de GPU</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item"><span>FIGURA 5 – Detecção de Saturação Crítica (>90%) sob Execução de Carga Real (God of War)</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item"><span>FIGURA 6 – Painel Sentry APM com Issues Críticas, Tags e Lifecycle Capturados</span><span class="toc-dots"></span><span>15</span></div>

    <br /><br />
    <h1 class="primary-title" style="text-align: center;">LISTA DE QUADROS E TABELAS</h1>
    <br />
    <div class="toc-item"><span>QUADRO 1 – Matriz Comparativa de Soluções APM de Mercado</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item"><span>QUADRO 2 – Matriz de Rastreabilidade e Confronto dos Objetivos do 1º Bimestre</span><span class="toc-dots"></span><span>16</span></div>

    <br /><br />
    <h1 class="primary-title" style="text-align: center;">LISTA DE ABREVIATURAS E SIGLAS</h1>
    <br />
    <div class="toc-item"><span>APM – Application Performance Monitoring</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>ABNT – Associação Brasileira de Normas Técnicas</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>CPU – Central Processing Unit (Unidade Central de Processamento)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>GPU – Graphics Processing Unit (Unidade de Processamento Gráfico)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>HTTP – Hypertext Transfer Protocol</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>JSON – JavaScript Object Notation</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>RAM – Random Access Memory</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>REST – Representational State Transfer</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>SDK – Software Development Kit</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>SLA – Service Level Agreement (Acordo de Nível de Serviço)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>UTP – Universidade Tuiuti do Paraná</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>VRAM – Video Random Access Memory</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>WMI – Windows Management Instrumentation</span><span class="toc-dots"></span></div>
  </div>

  <!-- ==================== PÁGINA 5: SUMÁRIO ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center;">SUMÁRIO</h1>
    <br />
    <div class="toc-item bold"><span>1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item bold"><span>2 OBJETIVOS DO PROJETO</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.1 Objetivo Geral</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.2 Objetivos Específicos</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item bold"><span>3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.1 Topologia Distribuída e Auto-Discovery</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.2 Protocolos e Coletores de Hardware (WMI e nvidia-smi)</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.3 Infraestrutura Física e Configuração do Laboratório</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item bold"><span>4 JUSTIFICATIVA DA ESCOLHA DA APM</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.1 Estudo Comparativo de Mercado (Sentry vs. Datadog vs. Better Stack)</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.2 Decisão Técnica pelo Sentry APM</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.3 Engenharia de Alertas, Cooldown e Máquina de Estados</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.4 Implementação do Algoritmo de Resfriamento</span><span class="toc-dots"></span><span>11</span></div>
    <div class="toc-item bold"><span>5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.1 Ensaio 1: Descoberta e Telemetria Real de Hardware</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.2 Ensaio 2: Séries Temporais e Visualização Gráfica</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.3 Ensaio 3: Teste de Carga Extrema com Aplicação Real (God of War)</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.4 Ensaio 4: Notificação em Tempo Real e Gestão de Incidentes</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.5 Ensaio 5: Rastreamento Forense no Painel do Sentry APM</span><span class="toc-dots"></span><span>15</span></div>
    <div class="toc-item bold"><span>6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</span><span class="toc-dots"></span><span>16</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.1 Confronto entre Objetivos Planejados e Entregas Realizadas</span><span class="toc-dots"></span><span>16</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.2 Trabalhos Futuros</span><span class="toc-dots"></span><span>17</span></div>
    <div class="toc-item bold"><span>REFERÊNCIAS</span><span class="toc-dots"></span><span>18</span></div>
    <div class="toc-item bold"><span>APÊNDICE A – Roteiro de Demonstração Prática para a Banca Avaliadora</span><span class="toc-dots"></span><span>19</span></div>
  </div>

  <!-- ==================== PÁGINA 6: INTRODUÇÃO E OBJETIVOS ==================== -->
  <div class="page">
    <div class="page-number">6</div>
    <h1 class="primary-title">1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</h1>
    <p>
      O monitoramento de infraestrutura e de aplicações é um elemento essencial na engenharia de software contemporânea. Em ambientes distribuídos, anomalias de hardware, saturação de memória ou sobrecarga de processamento podem inviabilizar a entrega de serviços e impactar negativamente a experiência do usuário final antes mesmo da detecção formal por equipes de suporte.
    </p>
    <p>
      Tradicionalmente, a verificação de saúde operacional em redes corporativas demandava rotinas de cadastro manual e parametrização exaustiva em painéis legados. Por outro lado, soluções consolidadas de mercado como o Datadog impõem modelos de faturamento em moeda estrangeira por nó monitorado e exigência de garantias de pagamento que inviabilizam projetos acadêmicos e operações em estágio inicial.
    </p>
    <p>
      Com base no plano de ensino da disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas da Universidade Tuiuti do Paraná (UTP), desenvolvemos o <strong>WatchFlow</strong>. A plataforma foi concebida em React, TypeScript e Vite, integrando serviços locais de telemetria e o serviço em nuvem <strong>Sentry APM</strong>. A proposta foca em descoberta automática de nós (<em>Auto-Discovery</em>), monitoramento de aceleradores gráficos dedicados (GPU) e geração autônoma de incidentes operacionais com proteção contra sobrecarga de chamadas de rede.
    </p>

    <h1 class="primary-title">2 OBJETIVOS DO PROJETO</h1>
    <h2 class="secondary-title">2.1 Objetivo Geral</h2>
    <p>
      Desenvolver, configurar e validar experimentalmente uma plataforma web de observabilidade com capacidade de descoberta automática de ativos, telemetria detalhada de hardware (CPU, RAM, Disco e GPU) e integração nativa com APM para rastreamento de falhas e gestão do ciclo de vida de incidentes.
    </p>

    <h2 class="secondary-title">2.2 Objetivos Específicos</h2>
    <p>
      Para atender às diretrizes formuladas na primeira etapa do semestre, definiram-se sete metas específicas de implementação:
    </p>
    <ol>
      <li><strong>Arquitetura Modular:</strong> Implementar arquitetura desacoplada entre coletores locais, backend de ingestão e frontend analítico;</li>
      <li><strong>Descoberta Automática (Auto-Discovery):</strong> Reconhecer ativamente hosts locais sem formulários manuais de inserção de IP;</li>
      <li><strong>Telemetria Completa de Hardware:</strong> Obter percentuais de uso de CPU, memória RAM física, armazenamento secundário e GPU dedicada;</li>
      <li><strong>Visualização em Séries Temporais:</strong> Construir gráficos temporais contínuos para avaliação de tendências operacionais;</li>
      <li><strong>Integração com APM:</strong> Conectar a aplicação ao Sentry APM para captura de exceções e monitoramento de transações;</li>
      <li><strong>Motor de Alertas e Normalização:</strong> Desenvolver máquina de estados com limiar crítico de 90%, avisos visuais flutuantes e resolução automática (<em>auto-recovery</em>);</li>
      <li><strong>Validação Experimental Real:</strong> Submeter o sistema a estresse prático através da execução de jogo 3D de alta demanda.</li>
    </ol>
  </div>

  <!-- ==================== PÁGINA 7: TOPOLOGIA E ARQUITETURA ==================== -->
  <div class="page">
    <div class="page-number">7</div>
    <h1 class="primary-title">3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</h1>
    <h2 class="secondary-title">3.1 Topologia Distribuída e Auto-Discovery</h2>
    <p>
      O WatchFlow opera segundo uma topologia distribuída e híbrida. A coleta de dados é realizada na máquina hospedeira por serviços especializados que alimentam o frontend analítico em intervalos regulares de 2000 ms:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 1 – Topologia da Arquitetura Distribuída e Fluxo de Telemetria</div>
      <pre>
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              HOST MONITORADO (MÁQUINA LOCAL)                           │
│                                                                                        │
│   ┌────────────────────┐   ┌──────────────────────┐   ┌────────────────────────────┐   │
│   │   SO: Windows 11   │   │  NVIDIA Driver / GPU │   │  Prometheus Node Exporter  │   │
│   │   WMI / os.cpus()  │   │      nvidia-smi      │   │        Porta :9100         │   │
│   └─────────┬──────────┘   └──────────┬───────────┘   └─────────────┬──────────────┘   │
│             │                         │                             │                  │
│             ▼                         ▼                             ▼                  │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                     WatchFlow Telemetry Engine (Vite Dev API)                  │   │
│   │                   Endpoints: /api/system-metrics • /__local/...                │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │ HTTP GET (Polling a cada 2000 ms)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND ANALÍTICO (REACT / VITE)                         │
│                                                                                        │
│   ┌──────────────────────────────────┐      ┌──────────────────────────────────────┐   │
│   │  Serviço de Polling e Descoberta │ ───► │  Máquina de Estados & Cooldown (45s) │   │
│   │       (deviceService.ts)         │      │  Detecção de Limiar Crítico > 90%    │   │
│   └─────────────────┬────────────────┘      └──────────────────┬───────────────────┘   │
│                     │                                          │                       │
│                     ▼                                          ▼                       │
│   ┌──────────────────────────────────┐      ┌──────────────────────────────────────┐   │
│   │  Interface Visual (UI / Toasts)  │      │  Disparo Seguro Sentry APM           │   │
│   │  Cards de Hardware e Gráficos    │      │  Tags: resource, host, severidade    │   │
│   └──────────────────────────────────┘      └──────────────────┬───────────────────┘   │
└────────────────────────────────────────────────────────────────┼───────────────────────┘
                                                                 │ HTTPS (Eventos e Traces)
                                                                 ▼
                                              ┌──────────────────────────────────────┐
                                              │    Sentry Cloud APM (SaaS Oficial)   │
                                              │    watchflow.sentry.io/issues        │
                                              └──────────────────────────────────────┘
      </pre>
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>
    </div>
    <p>
      O mecanismo de <em>Auto-Discovery</em> identifica o nó local assim que a aplicação é iniciada. Ao consultar o endpoint local, o sistema recebe o hostname, o endereço IP de loopback e a configuração de sistema operacional, registrando o dispositivo na visualização central sem requerer qualquer formulário manual de cadastro.
    </p>
  </div>

  <!-- ==================== PÁGINA 8: PROTOCOLOS E INFRAESTRUTURA ==================== -->
  <div class="page">
    <div class="page-number">8</div>
    <h2 class="secondary-title">3.2 Protocolos e Coletores de Hardware (WMI e nvidia-smi)</h2>
    <p>
      A camada de ingestão de telemetria estrutura-se a partir de três mecanismos complementares:
    </p>
    <ul>
      <li><strong>Prometheus Node Exporter:</strong> Padrão aberto de mercado na porta 9100, utilizado para extração de contadores padrão do sistema operacional;</li>
      <li><strong>Módulo do Sistema Operacional (WMI/Node.js):</strong> No Windows, o coletor realiza chamadas às funções internas do sistema operacional (como <code>os.cpus()</code> e <code>os.totalmem()</code>), calculando os deltas de tempo de processamento ativo em relação ao tempo ocioso para mensurar a CPU em percentual exato;</li>
      <li><strong>Utilitário nvidia-smi:</strong> Como a maioria dos agentes tradicionais não monitora placas de vídeo dedicadas de computadores de trabalho, integramos o binário oficial da NVIDIA. A cada ciclo de telemetria, o coletor executa a consulta <code>nvidia-smi --query-gpu=name,utilization.gpu,memory.total,memory.used,temperature.gpu --format=csv,noheader,nounits</code> e converte a saída textual diretamente em atributos tipados no JSON.</li>
    </ul>

    <h2 class="secondary-title">3.3 Infraestrutura Física e Configuração do Laboratório</h2>
    <p>
      Todos os ensaios de campo foram conduzidos na máquina física de desenvolvimento, cujas especificações representam um ambiente de computação de alta intensidade:
    </p>
    <ul>
      <li><strong>Processador (CPU):</strong> AMD Ryzen 7 5700X (8 núcleos físicos, 16 threads, frequência base de 3.4 GHz e boost de 4.6 GHz);</li>
      <li><strong>Memória RAM:</strong> 16 GB DDR4 (15.9 GB disponíveis para o sistema operacional);</li>
      <li><strong>Armazenamento Secundário:</strong> SSD NVMe M.2 de 1.0 TB (999 GB formatados);</li>
      <li><strong>Placa Gráfica Dedicada (GPU):</strong> NVIDIA GeForce GTX 1060 de 6 GB VRAM GDDR5;</li>
      <li><strong>Sistema Operacional:</strong> Microsoft Windows 11 Pro 64 bits (Build 26100);</li>
      <li><strong>Pilha de Software:</strong> Node.js 24 LTS, Vite 6, React 18, Sentry React SDK v8.</li>
    </ul>
  </div>

  <!-- ==================== PÁGINA 9: JUSTIFICATIVA APM E QUADRO 1 ==================== -->
  <div class="page">
    <div class="page-number">9</div>
    <h1 class="primary-title">4 JUSTIFICATIVA DA ESCOLHA DA APM</h1>
    <h2 class="secondary-title">4.1 Estudo Comparativo de Mercado</h2>
    <p>
      Para fundamentar a escolha da ferramenta de APM, avaliamos tecnicamente as opções líderes de mercado: <strong>Sentry</strong>, <strong>Datadog</strong> e <strong>Better Stack</strong>. O resultado do levantamento está consolidado no Quadro 1:
    </p>

    <div class="figure-caption-top">QUADRO 1 – Matriz Comparativa de Soluções APM de Mercado</div>
    <table class="abnt-table">
      <thead>
        <tr>
          <th>Critério de Avaliação</th>
          <th>Sentry APM</th>
          <th>Datadog APM</th>
          <th>Better Stack</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Modelo de Licenciamento</strong></td>
          <td>Plano Developer gratuito com retenção total de eventos e traces.</td>
          <td>Cobrança em dólar por host/mês ($15 a $31/mês) e exigência de cartão.</td>
          <td>Plano gratuito focado primordialmente em Uptime/Ping simples.</td>
        </tr>
        <tr>
          <td><strong>Rastreamento Forense de Erros</strong></td>
          <td>Pioneiro de mercado, com agregação de stack traces e metadados.</td>
          <td>Excelente, porém complexo e voltado a nuvens empresariais.</td>
          <td>Básico, voltado a logs brutos sem agregação analítica de código.</td>
        </tr>
        <tr>
          <td><strong>Tracing Distribuído no Frontend</strong></td>
          <td>Nativo via <code>@sentry/react</code> e monitoramento de transações.</td>
          <td>Requer instrumentação detalhada de agentes RUM adicionais.</td>
          <td>Indisponível no tier gratuito.</td>
        </tr>
        <tr>
          <td><strong>Metadados e Tags Customizadas</strong></td>
          <td>Permite anexar modelo de GPU, memória e contexto de hardware.</td>
          <td>Permite, porém exige configuração de tags em agentes locais.</td>
          <td>Restrito a atributos chave-valor simples em mensagens de texto.</td>
        </tr>
        <tr>
          <td><strong>Viabilidade para o Projeto</strong></td>
          <td><strong>Alta:</strong> Setup ágil, DSN pública segura e sem custo financeiro.</td>
          <td><strong>Baixa:</strong> Burocracia comercial e custos inviáveis para estudantes.</td>
          <td><strong>Média:</strong> Útil para status page, mas limitado em APM de código.</td>
        </tr>
      </tbody>
    </table>
    <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>

    <h2 class="secondary-title">4.2 Decisão Técnica pelo Sentry APM</h2>
    <p>
      A decisão pelo Sentry foi tomada por aliar robustez corporativa a uma política de acesso viável ao ambiente acadêmico. A ferramenta oferece SDK oficial com tipagem completa em TypeScript, integração com rotas do React Router e API de escopo que viabiliza o envio de contextos enriquecidos de hardware sem despesas com infraestrutura de nuvem.
    </p>
  </div>

  <!-- ==================== PÁGINA 10: MÁQUINA DE ESTADOS E COOLDOWN ==================== -->
  <div class="page">
    <div class="page-number">10</div>
    <h2 class="secondary-title">4.3 Engenharia de Alertas, Cooldown e Máquina de Estados</h2>
    <p>
      Um obstáculo prático identificado durante a fase inicial de desenvolvimento foi o risco de saturação da API do Sentry. Com o intervalo de varredura fixado em 2000 ms, uma máquina submetida a um pico de uso de 5 minutos geraria 150 disparos contínuos de alerta, resultando em bloqueio por taxa de requisição (<em>rate-limit</em>) e esgotamento da cota da conta gratuita.
    </p>
    <p>
      Para sanar esse comportamento, projetamos uma <strong>Máquina de Estados com Trava de Resfriamento (*Cooldown*) de 45 segundos</strong>:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 2 – Máquina de Estados Finita do Motor de Alertas e Auto-Recovery</div>
      <pre>
             ┌─────────────────────────────────────────────────────────┐
             │                     ESTADO: ONLINE                      │
             │              (Métricas nominais: todas <= 90%)          │
             └────────────────────────────┬────────────────────────────┘
                                          │
                                          │ Evento: Alguma métrica (CPU, RAM, GPU) > 90%
                                          │ Ação: Dispara Toast Crítico + Sentry Issue Fatal
                                          │       Inicia Temporizador de Cooldown (45 segundos)
                                          ▼
             ┌─────────────────────────────────────────────────────────┐
             │                    ESTADO: CRITICAL                     │
             │                (Limiar crítico violado)                 │
             └────────────────────────────┬────────────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   │ Métrica continua > 90%                      │ Todas as métricas retornam a <= 90%
                   │ e Tempo < 45s                               │
                   ▼                                             ▼
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       BLOQUEIO ANTI-SPAM             │       │         MECANISMO DE AUTO-RECOVERY   │
│  (Mantém alerta visual, mas inibe    │       │  Ação: Emite Toast Verde de Sucesso  │
│   novos envios ao Sentry APM)        │       │        Resolve o Incidente no Painel │
└──────────────────────────────────────┘       │        Transita de volta para ONLINE │
                                               └──────────────────────────────────────┘
      </pre>
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>
    </div>
    <p>
      Caso os valores permaneçam acima do teto de 90%, o estado do host na tela segue destacado em vermelho como <code>CRITICAL</code>, mantendo o operador ciente do perigo. Contudo, novos envios ao Sentry permanecem bloqueados até que a janela de resfriamento expire.
    </p>
  </div>

  <!-- ==================== PÁGINA 11: IMPLEMENTAÇÃO DO CÓDIGO ==================== -->
  <div class="page">
    <div class="page-number">11</div>
    <h2 class="secondary-title">4.4 Implementação do Algoritmo de Resfriamento</h2>
    <p>
      A implementação em TypeScript no módulo <code>src/services/deviceService.ts</code> evidencia a lógica de controle de concorrência e etiquetagem dos eventos:
    </p>

    <pre>
// Implementação do controle de resfriamento e disparo no Sentry APM
const CRITICAL_THRESHOLD = 90; // Limiar percentual de alerta crítico
const ALERT_COOLDOWN_MS = 45000; // Janela de segurança de 45 segundos
const recentDispatches = new Map&lt;string, number&gt;();

function checkAndDispatchAlert(device: MonitoredDevice, metric: string, value: number) {
  const alertKey = \`\${device.id}_\${metric}\`;
  const now = Date.now();
  const lastTime = recentDispatches.get(alertKey) || 0;

  if (value &gt;= CRITICAL_THRESHOLD) {
    if (now - lastTime &gt; ALERT_COOLDOWN_MS) {
      recentDispatches.set(alertKey, now);

      // Notificação visual imediata para o operador
      toast.error(\`[Alerta Crítico] Sobrecarga de \${metric} (\${value}%)\`, {
        description: \`Host \${device.name} ultrapassou o limiar de segurança de 90%.\`
      });

      // Registro analítico estruturado no Sentry
      Sentry.withScope((scope) =&gt; {
        scope.setLevel('fatal');
        scope.setTag('resource', metric);
        scope.setTag('hostname', device.name);
        scope.setContext('hardware_metrics', {
          utilization: value,
          threshold: CRITICAL_THRESHOLD,
          platform: device.os
        });
        Sentry.captureMessage(\`[WatchFlow Alert] Sobrecarga Crítica de \${metric} (\${value}%)\`);
      });
    }
  }
}
    </pre>
    <p>
      Adicionalmente, quando o hardware retorna aos padrões seguros de operação (valores inferiores a 90%), o sistema aciona a função de <em>Auto-Recovery</em>. Essa rotina emite um aviso flutuante em verde informando a recuperação, atualiza a Central de Alertas e restaura a saúde do nó para <code>ONLINE</code>.
    </p>
  </div>

  <!-- ==================== PÁGINA 12: ENSAIO 1 ==================== -->
  <div class="page">
    <div class="page-number">12</div>
    <h1 class="primary-title">5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</h1>
    <p>
      Em conformidade com a solicitação do professor orientador, realizaram-se ensaios empíricos no computador do laboratório para documentar o comportamento da plataforma sob condições reais de uso.
    </p>

    <h2 class="secondary-title">5.1 Ensaio 1: Descoberta e Telemetria Real de Hardware</h2>
    <p>
      Ao iniciar os serviços, o nó de testes local foi identificado sem necessidade de inserção de configurações manuais. O sistema reconheceu a CPU AMD Ryzen 7, o volume de disco SSD de 999 GB e a GPU dedicada NVIDIA GeForce GTX 1060 6GB:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 3 – Card de Telemetria do Host com Reconhecimento de Hardware e GPU</div>
      <img src="${img3}" alt="Card de Telemetria do Host" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura real da tela de Dispositivos Monitorados (/devices).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> Em estado ocioso de trabalho, o processador registrou 39%, a memória RAM 75%, o armazenamento 78% e a placa de vídeo 16%. O card apresentou distintivo verde <code>ONLINE</code>, validando a assertividade da camada de extração de métricas.
    </p>
  </div>

  <!-- ==================== PÁGINA 13: ENSAIO 2 ==================== -->
  <div class="page">
    <div class="page-number">13</div>
    <h2 class="secondary-title">5.2 Ensaio 2: Séries Temporais e Visualização Gráfica</h2>
    <p>
      No módulo analítico de Métricas (<code>/metrics</code>), o WatchFlow oferece gráficos contínuos de séries temporais construídos sobre a biblioteca Recharts, operando com janela deslizante de 30 amostras sucessivas:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 4 – Painel de Métricas Temporais com Gráfico Interativo de GPU</div>
      <img src="${img4}" alt="Painel de Métricas Temporais" style="max-height: 110mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura real da tela de Métricas Históricas (/metrics).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O gráfico de GPU rastreou de forma contínua as variações de carga gráfica, demonstrando a leitura de temperatura operacional da placa de vídeo (37°C) e a alocação de memória gráfica dedicada (1.5 GB em uso de 6.0 GB totais). Isso confirma a entrega de visualização dinâmica requerida no escopo inicial.
    </p>
  </div>

  <!-- ==================== PÁGINA 14: ENSAIO 3 (GOD OF WAR) ==================== -->
  <div class="page">
    <div class="page-number">14</div>
    <h2 class="secondary-title">5.3 Ensaio 3: Teste de Carga Extrema com Aplicação Real (*God of War*)</h2>
    <p>
      Para comprovar que a solução não utiliza números artificiais ou dados simulados em memória, executamos o jogo <em>God of War</em> em resolução nativa na máquina de testes, submetendo a GPU e a memória RAM a uma demanda operacional severa:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 5 – Detecção de Saturação Crítica (>90%) sob Execução de Carga Real (*God of War*)</div>
      <img src="${img1}" alt="Detecção de Saturação Crítica God of War" style="max-height: 100mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela durante execução de *God of War* em segundo plano.</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> Conforme atestado pelos controles do jogo visíveis na barra inferior do sistema operacional, durante a execução gráfica pesada o uso da GPU atingiu <strong>95%</strong> e a memória física RAM chegou a <strong>97%</strong>. O WatchFlow identificou a ultrapassagem do teto crítico de 90%, alterou o distintivo do host para <strong><code>CRITICAL</code></strong> em vermelho e disparou as rotinas de tratamento de incidentes.
    </p>

    <h2 class="secondary-title">5.4 Ensaio 4: Notificação em Tempo Real e Gestão de Incidentes</h2>
    <p>
      No exato momento do estouro de limiar, a aplicação emitiu notificações flutuantes (<em>toasts</em>) na interface. Na tela de Incidentes (<code>/alerts</code>), o registro foi disponibilizado para reconhecimento e resolução pelo operador. Ao fechar o jogo, o motor de <em>Auto-Recovery</em> emitiu o toast de sucesso e normalizou o estado do nó.
    </p>
  </div>

  <!-- ==================== PÁGINA 15: ENSAIO 5 (SENTRY) ==================== -->
  <div class="page">
    <div class="page-number">15</div>
    <h2 class="secondary-title">5.5 Ensaio 5: Rastreamento Forense no Painel do Sentry APM</h2>
    <p>
      Para certificar a recepção ponta a ponta dos eventos pela ferramenta de APM, auditamos o painel corporativo do Sentry hospedado em <code>watchflow.sentry.io/issues</code>:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 6 – Painel Sentry APM com Issues Críticas, Tags e Lifecycle Capturados</div>
      <img src="${img2}" alt="Painel Sentry APM" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura real do dashboard corporativo em watchflow.sentry.io.</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> A auditoria no painel confirmou a recepção fidedigna das ocorrências disparadas durante o ensaio:
    </p>
    <ul>
      <li><code>[WatchFlow Alert] Sobrecarga Crítica de GPU (96%)</code>: Issue com severidade <code>Fatal</code> (<code>WATCHFLOW-APP-7</code>);</li>
      <li><code>[WatchFlow Alert] Esgotamento Crítico de Memória RAM (92%)</code>: Ocorrências <code>WATCHFLOW-APP-2</code> e <code>APP-5</code> com severidade <code>Fatal</code>;</li>
      <li><code>[WatchFlow Alert] Uso Excessivo de CPU (94%)</code>: Issue <code>WATCHFLOW-APP-6</code>;</li>
      <li><code>[WatchFlow Lifecycle] Dispositivo Conectado</code> e <code>Desconectado</code>: Eventos informativos do ciclo de vida dos nós.</li>
    </ul>
  </div>

  <!-- ==================== PÁGINA 16: CONCLUSÃO E CONFRONTO DE OBJETIVOS ==================== -->
  <div class="page">
    <div class="page-number">16</div>
    <h1 class="primary-title">6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</h1>
    <h2 class="secondary-title">6.1 Confronto entre Objetivos Planejados e Entregas Realizadas</h2>
    <p>
      O Quadro 2 apresenta o confronto direto entre os objetivos estabelecidos na proposta inicial do semestre e os módulos efetivamente validados no produto final:
    </p>

    <div class="figure-caption-top">QUADRO 2 – Matriz de Rastreabilidade e Confronto dos Objetivos do 1º Bimestre</div>
    <table class="abnt-table">
      <thead>
        <tr>
          <th>Objetivo Específico (1º Bimestre)</th>
          <th>Status</th>
          <th>Evidência Técnica / Módulo Implementado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Arquitetura Modular Desacoplada</td>
          <td><strong>Cumprido</strong></td>
          <td>Coletores locais independentes comunicando-se via JSON com frontend React/Vite.</td>
        </tr>
        <tr>
          <td>2. Descoberta Automática de Dispositivos</td>
          <td><strong>Cumprido</strong></td>
          <td>Módulo <code>deviceService.ts</code> descobre nós locais sem formulários manuais.</td>
        </tr>
        <tr>
          <td>3. Telemetria Completa de Hardware</td>
          <td><strong>Cumprido</strong></td>
          <td>Leitura de CPU Ryzen 7, RAM 16GB, Disco 999GB e GPU GTX 1060 via <code>nvidia-smi</code> (Figura 3).</td>
        </tr>
        <tr>
          <td>4. Histórico em Séries Temporais</td>
          <td><strong>Cumprido</strong></td>
          <td>Painel de métricas interativas com Recharts e janela deslizante contínua (Figura 4).</td>
        </tr>
        <tr>
          <td>5. Integração com Solução de APM</td>
          <td><strong>Cumprido</strong></td>
          <td>Conexão operacional com Sentry APM, registrando issues com tags e DSN configurada (Figura 6).</td>
        </tr>
        <tr>
          <td>6. Motor de Alertas e Normalização</td>
          <td><strong>Cumprido</strong></td>
          <td>Máquina de estados finita, limiares críticos (>90%), cooldown de 45s e toasts visuais.</td>
        </tr>
        <tr>
          <td>7. Validação Experimental em Carga Real</td>
          <td><strong>Cumprido</strong></td>
          <td>Teste prático de estresse com o jogo <em>God of War</em> com 95% GPU e 97% RAM (Figura 5).</td>
        </tr>
      </tbody>
    </table>
    <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>
  </div>

  <!-- ==================== PÁGINA 17: TRABALHOS FUTUROS ==================== -->
  <div class="page">
    <div class="page-number">17</div>
    <h2 class="secondary-title">6.2 Trabalhos Futuros</h2>
    <p>
      Para dar continuidade ao projeto em disciplinas subsequentes do curso de Análise e Desenvolvimento de Sistemas, sugerem-se as seguintes frentes de expansão:
    </p>
    <ul>
      <li><strong>Suporte a Múltiplos Nós em Clusters:</strong> Empacotar os coletores locais em contêineres Docker para facilitar a distribuição e o monitoramento centralizado de vários computadores na rede acadêmica;</li>
      <li><strong>Ações Automatizadas de Remediação (*Self-Healing*):</strong> Integrar webhooks do Sentry para acionar rotinas automáticas de encerramento de processos travados ou liberação de memória em caso de esgotamento de recursos;</li>
      <li><strong>Suporte Universal a Placas Gráficas:</strong> Expandir o módulo de GPU para compatibilidade direta com aceleradores gráficos das fabricantes AMD e Intel através de bibliotecas abertas de telemetria de hardware.</li>
    </ul>
    <p>
      Em conclusão, o desenvolvimento do WatchFlow permitiu vivenciar de forma prática os princípios de engenharia de software, observabilidade de sistemas e gerenciamento de projetos conforme as diretrizes do Guia PMBOK 7ª Edição, resultando em uma aplicação funcional, validada empiricamente e documentada em conformidade com o padrão acadêmico da Universidade Tuiuti do Paraná.
    </p>
  </div>

  <!-- ==================== PÁGINA 18: REFERÊNCIAS ==================== -->
  <div class="page">
    <div class="page-number">18</div>
    <h1 class="primary-title">REFERÊNCIAS</h1>
    <br />

    <div class="reference-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 10719:</strong> informação e documentação: relatório técnico e/ou científico: apresentação. Rio de Janeiro: ABNT, 2015.
    </div>

    <div class="reference-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 6023:</strong> informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.
    </div>

    <div class="reference-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 6024:</strong> informação e documentação: numeração progressiva das seções de um documento escrito: apresentação. Rio de Janeiro: ABNT, 2012.
    </div>

    <div class="reference-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 6027:</strong> informação e documentação: sumário: apresentação. Rio de Janeiro: ABNT, 2012.
    </div>

    <div class="reference-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 6028:</strong> informação e documentação: resumo: apresentação. Rio de Janeiro: ABNT, 2021.
    </div>

    <div class="reference-item">
      BASS, Len; CLEMENTS, Paul; KAZMAN, Rick. <strong>Software Architecture in Practice</strong>. 4. ed. Boston: Addison-Wesley Professional, 2021.
    </div>

    <div class="reference-item">
      MAJORS, Charity; FONG-JONES, Liz; MIRANDA, George. <strong>Observability Engineering: Achieving Production Excellence</strong>. 1. ed. Sebastopol: O'Reilly Media, 2022.
    </div>

    <div class="reference-item">
      NVIDIA CORPORATION. <strong>NVIDIA System Management Interface (nvidia-smi) Reference Guide</strong>. Santa Clara: NVIDIA Corporation, 2025. Disponível em: &lt;https://developer.nvidia.com/system-management-interface&gt;. Acesso em: 10 nov. 2026.
    </div>

    <div class="reference-item">
      PAULA, André Luiz de Souza. <strong>Plano de Ensino e Plano de Aulas da Disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas</strong>. Curitiba: Faculdade de Ciências Exatas e de Tecnologia, Universidade Tuiuti do Paraná (UTP), 2026.
    </div>

    <div class="reference-item">
      PROJECT MANAGEMENT INSTITUTE (PMI). <strong>Um Guia do Conhecimento em Gerenciamento de Projetos (Guia PMBOK)</strong>. 7. ed. Newtown Square: Project Management Institute, 2021.
    </div>

    <div class="reference-item">
      PROMETHEUS AUTHORS. <strong>Prometheus Node Exporter: Hardware and OS metrics exporter</strong>. 2026. Disponível em: &lt;https://prometheus.io/docs/guides/node-exporter/&gt;. Acesso em: 08 nov. 2026.
    </div>

    <div class="reference-item">
      SENTRY.IO. <strong>Application Performance Monitoring and Error Tracking Documentation</strong>. São Francisco: Functional Software Inc., 2026. Disponível em: &lt;https://docs.sentry.io/&gt;. Acesso em: 10 nov. 2026.
    </div>

    <div class="reference-item">
      UNIVERSIDADE TUIUTI DO PARANÁ (UTP). <strong>Normas técnicas: elaboração e apresentação de trabalhos acadêmico-científicos</strong>. 3. ed. Curitiba: Editora UTP, 2012. 160 p.
    </div>
  </div>

  <!-- ==================== PÁGINA 19: APÊNDICE A ==================== -->
  <div class="page">
    <div class="page-number">19</div>
    <h1 class="primary-title">APÊNDICE A – ROTEIRO DE APRESENTAÇÃO PRÁTICA PARA A BANCA AVALIADORA</h1>
    <br />
    <p>
      Este roteiro operacional foi estruturado para guiar a apresentação prática presencial de 5 a 10 minutos perante o professor da disciplina no laboratório da UTP:
    </p>

    <h2 class="secondary-title">1. Abertura e Propósito do Sistema (1 a 2 Minutos)</h2>
    <p>
      Explicar que o WatchFlow é uma plataforma de observabilidade projetada para superar duas deficiências comuns do mercado: a necessidade de cadastros manuais de nós e os custos elevados de ferramentas como o Datadog. Destacar que a arquitetura adotada combina coletores locais autônomos com a plataforma corporativa Sentry APM.
    </p>

    <h2 class="secondary-title">2. Demonstração da Telemetria em Tempo Real (2 a 3 Minutos)</h2>
    <ul>
      <li>Abrir a interface no navegador em <code>http://localhost:5173/devices</code>;</li>
      <li>Mostrar a detecção automática do nó <code>srv-local-pc</code>, apontando as barras com os dados reais de CPU AMD Ryzen 7, 16 GB de RAM, SSD de 999 GB e placa de vídeo dedicada NVIDIA GeForce GTX 1060 6GB;</li>
      <li>Acessar a tela <code>/metrics</code> e exibir os gráficos de séries temporais oscilando dinamicamente a cada 2000 ms.</li>
    </ul>

    <h2 class="secondary-title">3. Demonstração de Carga, Alertas e Sentry APM (2 a 3 Minutos)</h2>
    <ul>
      <li>Clicar no botão de simulação de carga ou demonstrar os dados gerados pela execução do jogo <em>God of War</em>;</li>
      <li>Exibir a mudança imediata do distintivo para <strong><code>CRITICAL</code></strong> em vermelho e as notificações visuais flutuantes (<em>toasts</em>);</li>
      <li>Alternar para o painel em nuvem oficial do Sentry (<code>watchflow.sentry.io/issues</code>), demonstrando as issues recebidas com nível <code>Fatal</code>, identificadores únicos e tags detalhadas de hardware;</li>
      <li>Explicar a lógica da trava de resfriamento (<em>cooldown</em> de 45 segundos) criada para evitar o consumo abusivo da cota da API.</li>
    </ul>

    <h2 class="secondary-title">4. Normalização Automática e Encerramento (1 Minuto)</h2>
    <p>
      Demonstrar que, com a cessação da carga pesada, o sistema emite o toast de normalização, resolve o incidente e retorna o dispositivo ao estado nominal <code>ONLINE</code>, concluindo com o fechamento dos 7 objetivos estabelecidos no 1º bimestre.
    </p>
  </div>

</body>
</html>
`;

const htmlPath = path.join(docsDir, 'relatorio-final-apm-utp.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`HTML generated successfully at: ${htmlPath}`);

const pdfPath = path.join(docsDir, 'Relatorio_Final_WatchFlow_UTP.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Rendering PDF via Microsoft Edge Headless...');
try {
  execFileSync(edgePath, [
    '--headless',
    '--print-to-pdf=' + pdfPath,
    '--no-pdf-header-footer',
    'file:///' + htmlPath.replace(/\\/g, '/')
  ]);
  console.log('PDF generated successfully at: ' + pdfPath);
} catch (err) {
  console.error('Error generating PDF with Edge:', err);
}
