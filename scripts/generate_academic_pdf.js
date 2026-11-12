import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { figura1Html, figura2Html } from './html_diagrams.js';

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

const img1 = getBase64Image('01-dispositivos-status-online.jpg');
const img2 = getBase64Image('02-metricas-series-temporais.jpg');
const img3 = getBase64Image('03-dispositivos-sobrecarga-critical.png');
const img4 = getBase64Image('04-central-incidentes-alertas.jpg');
const img5 = getBase64Image('05-sentry-issues-incidentes-reais.jpg');

const mainTitle = 'OBSERVABILIDADE E MONITORAMENTO DE DESEMPENHO DE APLICAÇÕES (APM): ARQUITETURA TÉCNICA E VALIDAÇÃO EXPERIMENTAL';

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${mainTitle}</title>
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
      line-height: 1.4;
      margin-top: 25mm;
    }

    .cover-title-box {
      margin-top: 25mm;
    }

    .cover-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.35;
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
      margin-top: 20mm;
      margin-bottom: 20mm;
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
      margin: 6pt 0;
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
        FABRICIO TITO COSTA GOULART<br />
        MATHEUS SERRUTE BAILO<br />
        MIGUEL DE CARLO GOMES<br />
        QUIZITO CRISTIANO AGOSTINHO<br />
        VITOR DA SILVA CAMPOS<br />
        ZACK REYEL FERREIRA BARROZO
      </div>

      <div class="cover-title-box">
        <div class="cover-title">
          ${mainTitle}
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
        FABRICIO TITO COSTA GOULART<br />
        MATHEUS SERRUTE BAILO<br />
        MIGUEL DE CARLO GOMES<br />
        QUIZITO CRISTIANO AGOSTINHO<br />
        VITOR DA SILVA CAMPOS<br />
        ZACK REYEL FERREIRA BARROZO
      </div>

      <div class="cover-title-box" style="margin-top: 15mm;">
        <div class="cover-title">
          ${mainTitle}
        </div>
      </div>

      <div class="title-page-note-container">
        <div class="title-page-note">
          Trabalho apresentado à Faculdade de Ciências Exatas e de Tecnologia da Universidade Tuiuti do Paraná, como requisito parcial para avaliação do 2º bimestre na disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas.
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
    <div class="page-number">1</div>
    <h1 class="primary-title" style="text-align: center; margin-bottom: 20pt;">RESUMO</h1>
    <p>
      O presente trabalho apresenta a especificação técnica, a arquitetura e os resultados práticos da validação de uma plataforma de monitoramento e observabilidade voltada à inspeção contínua de hardware e rastreamento de desempenho de aplicações (APM – <em>Application Performance Monitoring</em>). A indisponibilidade de sistemas e o diagnóstico tardio de sobrecargas de hardware motivaram o desenvolvimento de uma arquitetura híbrida e distribuída. O sistema combina coletores locais baseados no padrão Prometheus Node Exporter, WMI (<em>Windows Management Instrumentation</em>) e utilitário de leitura direta de aceleradores gráficos com a plataforma em nuvem Sentry APM. Para comprovar a eficácia prática da solução em laboratório, foram realizados ensaios empíricos no computador de desenvolvimento, validando o comportamento sob condições nominais (CPU 10%, RAM 73%, Disco 79%, GPU 37%) e sob sobrecarga crítica (>90% de GPU e RAM). Os testes demonstraram a precisão dos gráficos temporais, a sensibilidade da máquina de estados com trava de resfriamento (<em>cooldown</em> de 45 segundos) e o registro forense das ocorrências no Sentry, cumprindo integralmente os objetivos estabelecidos na proposta inicial.
    </p>
    <p class="no-indent" style="margin-top: 24pt;">
      <strong>Palavras-chave:</strong> Observabilidade. Telemetria de Hardware. Application Performance Monitoring (APM). Sentry. Auto-Discovery. Projeto Interdisciplinar.
    </p>
  </div>

  <!-- ==================== PÁGINA 4: LISTAS ==================== -->
  <div class="page">
    <div class="page-number">2</div>
    <h1 class="primary-title" style="text-align: center;">LISTA DE ILUSTRAÇÕES</h1>
    <br />
    <div class="toc-item"><span>FIGURA 1 – Topologia da Arquitetura Distribuída e Fluxo de Telemetria</span><span class="toc-dots"></span><span>5</span></div>
    <div class="toc-item"><span>FIGURA 2 – Máquina de Estados Finita do Motor de Alertas e Auto-Recovery</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item"><span>FIGURA 3 – Painel de Dispositivos Monitorados em Condição Nominal (Status ONLINE)</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item"><span>FIGURA 4 – Módulo de Métricas Detalhadas com Gráfico Temporal de Oscilação</span><span class="toc-dots"></span><span>11</span></div>
    <div class="toc-item"><span>FIGURA 5 – Detecção de Sobrecarga Crítica (>90%) e Comutação para Estado CRITICAL</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item"><span>FIGURA 6 – Central de Incidentes com Fila de Alertas Ativos e Resolvidos (Auto-Recovery)</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item"><span>FIGURA 7 – Rastreamento Forense no Painel Corporativo do Sentry APM</span><span class="toc-dots"></span><span>14</span></div>

    <br /><br />
    <h1 class="primary-title" style="text-align: center;">LISTA DE QUADROS E TABELAS</h1>
    <br />
    <div class="toc-item"><span>QUADRO 1 – Matriz Comparativa de Soluções APM de Mercado</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item"><span>QUADRO 2 – Matriz de Rastreabilidade e Cumprimento dos Objetivos do 1º Bimestre</span><span class="toc-dots"></span><span>15</span></div>

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
    <div class="toc-item"><span>WMI – Windows Management Instrumentation</span><span class="toc-dots"></span></div>
  </div>

  <!-- ==================== PÁGINA 5: SUMÁRIO ==================== -->
  <div class="page">
    <div class="page-number">3</div>
    <h1 class="primary-title" style="text-align: center;">SUMÁRIO</h1>
    <br />
    <div class="toc-item bold"><span>1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</span><span class="toc-dots"></span><span>4</span></div>
    <div class="toc-item bold"><span>2 OBJETIVOS DO PROJETO</span><span class="toc-dots"></span><span>4</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.1 Objetivo Geral</span><span class="toc-dots"></span><span>4</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.2 Objetivos Específicos</span><span class="toc-dots"></span><span>4</span></div>
    <div class="toc-item bold"><span>3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</span><span class="toc-dots"></span><span>5</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.1 Topologia Distribuída e Auto-Discovery</span><span class="toc-dots"></span><span>5</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.2 Protocolos e Coletores de Hardware (WMI e Utilitários de GPU)</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.3 Infraestrutura Física e Configuração do Laboratório</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item bold"><span>4 JUSTIFICATIVA DA ESCOLHA DA APM</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.1 Estudo Comparativo de Mercado (Sentry vs. Datadog vs. Better Stack)</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.2 Decisão Técnica pelo Sentry APM</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.3 Engenharia de Alertas, Cooldown e Máquina de Estados</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.4 Implementação do Algoritmo de Resfriamento</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item bold"><span>5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.1 Ensaio 1: Descoberta e Telemetria em Repouso</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.2 Ensaio 2: Séries Temporais e Visualização Gráfica</span><span class="toc-dots"></span><span>11</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.3 Ensaio 3: Teste de Carga e Saturação Crítica (>90%)</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.4 Ensaio 4: Central de Incidentes e Auto-Recovery</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.5 Ensaio 5: Rastreamento Forense no Painel do Sentry APM</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item bold"><span>6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</span><span class="toc-dots"></span><span>15</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.1 Confronto entre Objetivos Planejados e Entregas Realizadas</span><span class="toc-dots"></span><span>15</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.2 Trabalhos Futuros</span><span class="toc-dots"></span><span>16</span></div>
    <div class="toc-item bold"><span>REFERÊNCIAS</span><span class="toc-dots"></span><span>17</span></div>
  </div>

  <!-- ==================== PÁGINA 6: INTRODUÇÃO E OBJETIVOS ==================== -->
  <div class="page">
    <div class="page-number">4</div>
    <h1 class="primary-title">1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</h1>
    <p>
      O monitoramento contínuo de infraestrutura e de aplicações é um pilar estratégico na engenharia de software e na administração de ambientes computacionais corporativos. Em sistemas modernos, a degradação de recursos físicos como processamento (CPU), memória principal (RAM) ou aceleração gráfica (GPU) pode interromper serviços críticos e comprometer os acordos de nível de serviço (SLA) antes de uma intervenção manual.
    </p>
    <p>
      Na primeira etapa desta pesquisa, realizou-se um levantamento comparativo de ferramentas de APM (<em>Application Performance Monitoring</em>). Observou-se que soluções tradicionais como o Datadog impõem altos custos por host monitorado (aproximadamente US$ 46/mês combinando APM e infraestrutura) com cobrança pelo pico mensal (<em>high-water mark</em>). Por outro lado, ferramentas como o Better Stack concentram sua atuação em checagens externas sintéticas (HTTP/Ping), sem realizar a instrumentação profunda do código frontend.
    </p>
    <p>
      Para atender aos requisitos da disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas da Universidade Tuiuti do Paraná (UTP), desenvolvemos uma plataforma de observabilidade sob medida. O sistema integra telemetria direta de hardware local (sem necessidade de cadastros manuais) a uma aplicação web moderna em React e TypeScript, conectando os eventos críticos à plataforma corporativa <strong>Sentry APM</strong>.
    </p>

    <h1 class="primary-title">2 OBJETIVOS DO PROJETO</h1>
    <h2 class="secondary-title">2.1 Objetivo Geral</h2>
    <p>
      Desenvolver, documentar e validar experimentalmente uma plataforma web de observabilidade capaz de realizar a descoberta automática de ativos computacionais locais, inspecionar métricas em tempo real de hardware e integrar-se a uma solução de APM para rastreamento de falhas, métricas de transação e gestão do ciclo de vida de incidentes.
    </p>

    <h2 class="secondary-title">2.2 Objetivos Específicos</h2>
    <p>
      Conforme estabelecido na proposta original aprovada no primeiro bimestre, definiram-se quatro objetivos operacionais específicos:
    </p>
    <ol>
      <li><strong>Mapeamento de Requisitos e Arquitetura:</strong> Estruturar uma arquitetura desacoplada entre coletores locais de hardware, backend de ingestão e interface analítica em tempo real;</li>
      <li><strong>Investigação de Agentes e Telemetria de Hardware:</strong> Implementar a extração periódica de contadores do sistema operacional (CPU, RAM, Disco) e de aceleração gráfica (GPU), viabilizando descoberta automática (<em>Auto-Discovery</em>);</li>
      <li><strong>Estudo e Integração com APM Corporativo:</strong> Conectar a camada de aplicação ao Sentry APM, aproveitando sua capacidade de rastreamento de exceções e anexação de metadados enriquecidos de hardware;</li>
      <li><strong>Avaliação de Alertas e Resposta a Incidentes:</strong> Desenvolver máquina de estados finita com limiares críticos (>90%), notificações visuais flutuantes e resolução automática (<em>auto-recovery</em>).</li>
    </ol>
  </div>

  <!-- ==================== PÁGINA 7: TOPOLOGIA E ARQUITETURA (HTML DIAGRAM) ==================== -->
  <div class="page">
    <div class="page-number">5</div>
    <h1 class="primary-title">3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</h1>
    <h2 class="secondary-title">3.1 Topologia Distribuída e Auto-Discovery</h2>
    <p>
      O sistema adota uma topologia híbrida de monitoramento. Em vez de exigir cadastros manuais de endereços IP em formulários estáticos, o nó local reporta suas métricas continuamente para a interface analítica em ciclos regulares de 2000 milissegundos:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 1 – Topologia da Arquitetura Distribuída e Fluxo de Telemetria</div>
      ${figura1Html}
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>
    </div>
    <p>
      O mecanismo de <em>Auto-Discovery</em> reconhece o nó hospedeiro assim que a aplicação é iniciada. Ao consultar os endpoints de telemetria locais, o sistema detecta o hostname, o endereço IP de loopback e os recursos disponíveis, instanciando o card do host sem qualquer etapa prévia de parametrização.
    </p>
  </div>

  <!-- ==================== PÁGINA 8: PROTOCOLOS E INFRAESTRUTURA ==================== -->
  <div class="page">
    <div class="page-number">6</div>
    <h2 class="secondary-title">3.2 Protocolos e Coletores de Hardware</h2>
    <p>
      A camada de ingestão de telemetria estrutura-se a partir de três mecanismos complementares:
    </p>
    <ul>
      <li><strong>Prometheus Node Exporter:</strong> Padrão aberto de mercado na porta 9100, utilizado para extração de contadores do sistema operacional conforme convenções abertas de telemetria;</li>
      <li><strong>Módulo do Sistema Operacional (WMI/Node.js):</strong> No Windows, o coletor realiza chamadas às funções internas do sistema operacional (como <code>os.cpus()</code> e <code>os.totalmem()</code>), calculando os deltas de tempo de processamento ativo em relação ao tempo ocioso para mensurar a CPU em percentual exato;</li>
      <li><strong>Extração de Telemetria de GPU:</strong> Como a maioria das ferramentas tradicionais restringe-se ao processador central e ignora aceleradores gráficos dedicados, implementamos uma rotina de extração via binário do driver gráfico, convertendo uso de processador gráfico, alocação de memória e temperatura em JSON estruturado a cada ciclo.</li>
    </ul>

    <h2 class="secondary-title">3.3 Infraestrutura Física e Configuração do Laboratório</h2>
    <p>
      Os ensaios práticos e a validação foram conduzidos no computador de desenvolvimento, cujas especificações representam uma máquina real de trabalho:
    </p>
    <ul>
      <li><strong>Processador (CPU):</strong> AMD Ryzen 7 5700X (8 núcleos físicos, 16 threads, frequência de 3.4 GHz a 4.6 GHz);</li>
      <li><strong>Memória Principal (RAM):</strong> 16 GB DDR4 (15.9 GB endereçáveis pelo sistema operacional);</li>
      <li><strong>Armazenamento Secundário:</strong> SSD NVMe M.2 de 1.0 TB (999 GB formatados);</li>
      <li><strong>Acelerador Gráfico Dedicado (GPU):</strong> NVIDIA GeForce GTX 1060 de 6 GB VRAM GDDR5;</li>
      <li><strong>Sistema Operacional:</strong> Microsoft Windows 11 Pro 64 bits (Build 26100);</li>
      <li><strong>Pilha Tecnológica:</strong> Node.js 24 LTS, Vite 6, React 18, Sentry React SDK v8.</li>
    </ul>
  </div>

  <!-- ==================== PÁGINA 9: JUSTIFICATIVA APM E QUADRO 1 ==================== -->
  <div class="page">
    <div class="page-number">7</div>
    <h1 class="primary-title">4 JUSTIFICATIVA DA ESCOLHA DA APM</h1>
    <h2 class="secondary-title">4.1 Estudo Comparativo de Mercado</h2>
    <p>
      Para fundamentar a escolha da plataforma de APM com rigor acadêmico, confrontamos as três alternativas analisadas no 1º bimestre: <strong>Sentry</strong>, <strong>Datadog</strong> e <strong>Better Stack</strong>:
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
          <td>Cobrança em dólar por host/mês ($31 APM + $15 Infra = $46/mês).</td>
          <td>Plano gratuito voltado a checagens de Uptime/Ping simples.</td>
        </tr>
        <tr>
          <td><strong>Rastreamento Forense de Erros</strong></td>
          <td>Pioneiro de mercado, com agregação de stack traces e metadados.</td>
          <td>Excelente, porém complexo e voltado a nuvens empresariais.</td>
          <td>Básico, focado em logs brutos sem análise profunda de código.</td>
        </tr>
        <tr>
          <td><strong>Tracing Distribuído no Frontend</strong></td>
          <td>Nativo via <code>@sentry/react</code> e monitoramento de transações.</td>
          <td>Requer instrumentação detalhada de agentes RUM adicionais.</td>
          <td>Indisponível no tier gratuito.</td>
        </tr>
        <tr>
          <td><strong>Metadados e Tags Customizadas</strong></td>
          <td>Permite anexar métricas de GPU, memória e contexto de hardware.</td>
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
      A decisão pelo Sentry fundamentou-se em três pilares técnicos: aderência total à pilha frontend (React/TypeScript), capacidade de enriquecer cada incidente com metadados detalhados de hardware (tags de nó, percentuais de uso e status) e ausência de restrições financeiras ou exigência de cartões internacionais, permitindo foco exclusivo no desenvolvimento do sistema.
    </p>
  </div>

  <!-- ==================== PÁGINA 10: MÁQUINA DE ESTADOS (HTML DIAGRAM) ==================== -->
  <div class="page">
    <div class="page-number">8</div>
    <h2 class="secondary-title">4.3 Engenharia de Alertas, Cooldown e Máquina de Estados</h2>
    <p>
      Um obstáculo prático identificado durante os primeiros ensaios foi o risco de saturação da API do Sentry. Como o coletor consulta o nó a cada 2000 milissegundos, caso a máquina sofresse uma sobrecarga sustentada de 5 minutos, seriam enviados 150 chamados sucessivos, gerando bloqueio por taxa de requisição (<em>rate-limit</em>) e esgotamento da cota gratuita da conta.
    </p>
    <p>
      Para solucionar esse problema, projetamos uma <strong>Máquina de Estados Finita com Trava de Resfriamento (*Cooldown*) de 45 segundos</strong> no módulo <code>deviceService.ts</code>:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 2 – Máquina de Estados Finita do Motor de Alertas e Auto-Recovery</div>
      ${figura2Html}
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>
    </div>
    <p>
      Caso os valores permaneçam acima do teto de 90%, o estado do host na tela segue destacado em vermelho como <code>CRITICAL</code>, mantendo o operador ciente do perigo. Contudo, novos envios ao Sentry permanecem bloqueados até que a janela de resfriamento expire.
    </p>
  </div>

  <!-- ==================== PÁGINA 11: IMPLEMENTAÇÃO DO CÓDIGO ==================== -->
  <div class="page">
    <div class="page-number">9</div>
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

  <!-- ==================== PÁGINA 12: ENSAIO 1 (ONLINE) ==================== -->
  <div class="page">
    <div class="page-number">10</div>
    <h1 class="primary-title">5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</h1>
    <p>
      Apresentam-se a seguir os registros empíricos obtidos diretamente na execução prática do sistema no computador do laboratório, cobrindo todos os módulos da plataforma.
    </p>

    <h2 class="secondary-title">5.1 Ensaio 1: Descoberta e Telemetria em Repouso</h2>
    <p>
      Ao iniciar os serviços, o nó <code>srv-local-pc</code> (127.0.0.1, Windows 11 x86_64) foi detectado automaticamente, apresentando os contadores de CPU, RAM, Disco e GPU em condição nominal de operação:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 3 – Painel de Dispositivos Monitorados em Condição Nominal (Status ONLINE)</div>
      <img src="${img1}" alt="Dispositivos Monitorados Status ONLINE" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface de Dispositivos (/devices).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O host registrou consumo equilibrado: CPU em 10%, memória RAM em 73%, disco em 79% e acelerador gráfico GPU em 37%. O sistema manteve o distintivo verde <code>ONLINE</code>, sem emissão de alertas indevidos.
    </p>
  </div>

  <!-- ==================== PÁGINA 13: ENSAIO 2 (MÉTRICAS) ==================== -->
  <div class="page">
    <div class="page-number">11</div>
    <h2 class="secondary-title">5.2 Ensaio 2: Séries Temporais e Visualização Gráfica</h2>
    <p>
      No módulo analítico de Métricas (<code>/metrics</code>), o sistema oferece gráficos contínuos de séries temporais desenvolvidos com a biblioteca Recharts, exibindo os dados históricos de desempenho do host selecionado:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 4 – Módulo de Métricas Detalhadas com Gráfico Temporal de Oscilação</div>
      <img src="${img2}" alt="Métricas Detalhadas Séries Temporais" style="max-height: 110mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface de Métricas (/metrics).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O painel exibe a alocação de memória física (12 GB em uso de 15.9 GB totais), uso de disco (786 GB de 999 GB), tráfego de rede ativo (1.1 MB/s download e 0.6 MB/s upload) e a curva de oscilação temporal com janela deslizante de registros sucessivos.
    </p>
  </div>

  <!-- ==================== PÁGINA 14: ENSAIO 3 (SOBRECARGA CRÍTICA) ==================== -->
  <div class="page">
    <div class="page-number">12</div>
    <h2 class="secondary-title">5.3 Ensaio 3: Teste de Carga e Saturação Crítica (>90%)</h2>
    <p>
      Para avaliar o comportamento da plataforma sob estresse severo de hardware, acionou-se a rotina de sobrecarga operacional, elevando a demanda sobre a memória RAM e a placa de vídeo:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 5 – Detecção de Sobrecarga Crítica (>90%) e Comutação para Estado CRITICAL</div>
      <img src="${img3}" alt="Dispositivos em Sobrecarga Status CRITICAL" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface durante teste de saturação.</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> Ao atingir <strong>94%</strong> de memória física RAM e <strong>96%</strong> de utilização do acelerador gráfico GPU, o sistema identificou imediatamente a violação do limiar de 90%, comutando o distintivo do host para <strong><code>CRITICAL</code></strong> em vermelho e disparando a barra de GPU em destaque de alerta.
    </p>
  </div>

  <!-- ==================== PÁGINA 15: ENSAIO 4 (CENTRAL DE ALERTAS) ==================== -->
  <div class="page">
    <div class="page-number">13</div>
    <h2 class="secondary-title">5.4 Ensaio 4: Central de Incidentes e Auto-Recovery</h2>
    <p>
      No módulo de Alertas (<code>/alerts</code>), a aplicação gerencia os chamados operacionais gerados pelas violações de limiares de segurança:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 6 – Central de Incidentes com Fila de Alertas Ativos e Resolvidos (Auto-Recovery)</div>
      <img src="${img4}" alt="Central de Incidentes e Alertas" style="max-height: 110mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface de Incidentes (/alerts).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> A Central de Incidentes registrou as ocorrências de <em>Sobrecarga Crítica de GPU (94% e 96%)</em> e <em>Esgotamento Crítico de Memória RAM (91% e 99%)</em>. O operador dispõe de botões para Reconhecer e Resolver os chamados, enquanto o motor de <em>Auto-Recovery</em> automaticamente contabilizou os incidentes normalizados no painel verde de histórico.
    </p>
  </div>

  <!-- ==================== PÁGINA 16: ENSAIO 5 (SENTRY APM) ==================== -->
  <div class="page">
    <div class="page-number">14</div>
    <h2 class="secondary-title">5.5 Ensaio 5: Rastreamento Forense no Painel do Sentry APM</h2>
    <p>
      Para certificar a entrega ponta a ponta da telemetria de incidentes para a nuvem, inspecionou-se o painel oficial do projeto no Sentry (<code>watchflow.sentry.io/issues</code>):
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 7 – Rastreamento Forense no Painel Corporativo do Sentry APM</div>
      <img src="${img5}" alt="Painel Oficial do Sentry APM" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura real do dashboard corporativo em watchflow.sentry.io.</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O dashboard do Sentry comprova o recebimento estruturado das seguintes ocorrências:
    </p>
    <ul>
      <li><code>[WatchFlow Alert] Sobrecarga Crítica de GPU (94%)</code>: Identificador <code>WATCHFLOW-APP-8</code>, com 30 eventos capturados e agrupados por amostragem de tags;</li>
      <li><code>[WatchFlow Alert] Esgotamento Crítico de Memória RAM (91%)</code>: Identificador <code>WATCHFLOW-APP-9</code>, com 27 eventos registrados;</li>
      <li><code>[WatchFlow Lifecycle] Dispositivo Conectado com Sucesso: srv-local-pc</code>: Identificador <code>WATCHFLOW-APP-D</code>, comprovando o registro do ciclo de vida dos nós.</li>
    </ul>
  </div>

  <!-- ==================== PÁGINA 17: CONCLUSÃO E CONFRONTO DE OBJETIVOS ==================== -->
  <div class="page">
    <div class="page-number">15</div>
    <h1 class="primary-title">6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</h1>
    <h2 class="secondary-title">6.1 Confronto entre Objetivos Planejados e Entregas Realizadas</h2>
    <p>
      O Quadro 2 apresenta o confronto direto entre as metas propostas no documento do primeiro bimestre e os resultados validados no produto final:
    </p>

    <div class="figure-caption-top">QUADRO 2 – Matriz de Rastreabilidade e Cumprimento dos Objetivos do 1º Bimestre</div>
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
          <td>1. Mapeamento de Requisitos e Arquitetura</td>
          <td><strong>Cumprido</strong></td>
          <td>Arquitetura modular desacoplada entre coletores locais e frontend analítico (Figura 1).</td>
        </tr>
        <tr>
          <td>2. Investigação de Telemetria e Hardware</td>
          <td><strong>Cumprido</strong></td>
          <td>Leitura de CPU, RAM, Disco e GPU com auto-discovery e séries temporais (Figuras 3 e 4).</td>
        </tr>
        <tr>
          <td>3. Estudo Comparativo e Integração APM</td>
          <td><strong>Cumprido</strong></td>
          <td>Matriz comparativa fundamentada e integração ponta a ponta com Sentry APM (Quadro 1 e Figura 7).</td>
        </tr>
        <tr>
          <td>4. Avaliação de Alertas e Resposta a Incidentes</td>
          <td><strong>Cumprido</strong></td>
          <td>Central de Incidentes com fila de eventos, limiares >90%, cooldown de 45s e auto-recovery (Figuras 5 e 6).</td>
        </tr>
      </tbody>
    </table>
    <div class="figure-source-bottom">FONTE: os próprios autores, 2026.</div>

    <p>
      Dessa forma, a equipe transformou a pesquisa bibliográfica do primeiro bimestre em um sistema funcional, documentado e validado empiricamente, superando as deficiências apontadas pelo orientador nas entregas anteriores.
    </p>
  </div>

  <!-- ==================== PÁGINA 18: TRABALHOS FUTUROS ==================== -->
  <div class="page">
    <div class="page-number">16</div>
    <h2 class="secondary-title">6.2 Trabalhos Futuros</h2>
    <p>
      Como propostas de expansão e evolução em etapas futuras do curso de Análise e Desenvolvimento de Sistemas, sugerem-se as seguintes frentes de pesquisa:
    </p>
    <ul>
      <li><strong>Suporte a Múltiplos Nós em Clusters:</strong> Empacotar os coletores locais em contêineres Docker para facilitar a distribuição e o monitoramento centralizado de múltiplos computadores na rede acadêmica;</li>
      <li><strong>Ações Automatizadas de Remediação (*Self-Healing*):</strong> Integrar webhooks do Sentry para acionar rotinas automáticas de encerramento de processos travados ou liberação de memória em caso de esgotamento de recursos;</li>
      <li><strong>Compatibilidade Universal com Fabricantes de Hardware:</strong> Expandir o módulo de GPU para leitura padronizada através de bibliotecas abertas como OpenCL e Vulkan, cobrindo aceleradores de múltiplos fabricantes.</li>
    </ul>
    <p>
      O desenvolvimento do projeto proporcionou aos integrantes a vivência prática de observabilidade de software, padrões abertos de telemetria e governança de projetos segundo o Guia PMBOK 7ª Edição, resultando em uma solução robusta e aderente aos padrões da indústria de tecnologia.
    </p>
  </div>

  <!-- ==================== PÁGINA 19: REFERÊNCIAS ==================== -->
  <div class="page">
    <div class="page-number">17</div>
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
      BETTER STACK. <strong>Better Stack Documentation and Infrastructure Guides</strong>. Praga: Better Stack Inc., 2026. Disponível em: &lt;https://betterstack.com/docs&gt;. Acesso em: 10 nov. 2026.
    </div>

    <div class="reference-item">
      DATADOG. <strong>Datadog Documentation: Agent, APM & Distributed Tracing</strong>. Nova York: Datadog Inc., 2026. Disponível em: &lt;https://docs.datadoghq.com&gt;. Acesso em: 10 nov. 2026.
    </div>

    <div class="reference-item">
      ERINLE, Bayo. <strong>Performance Testing with JMeter 2.9</strong>. 1. ed. Birmingham: Packt Publishing, 2013.
    </div>

    <div class="reference-item">
      FILHO, João Eriberto Mota. <strong>Análise de Tráfego em Redes TCP/IP</strong>. São Paulo: Novatec, 2013.
    </div>

    <div class="reference-item">
      MAJORS, Charity; FONG-JONES, Liz; MIRANDA, George. <strong>Observability Engineering: Achieving Production Excellence</strong>. 1. ed. Sebastopol: O'Reilly Media, 2022.
    </div>

    <div class="reference-item">
      PAULA, André Luiz de Souza. <strong>Plano de Ensino e Plano de Aulas da Disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas</strong>. Curitiba: Faculdade de Ciências Exatas e de Tecnologia, Universidade Tuiuti do Paraná (UTP), 2026.
    </div>

    <div class="reference-item">
      PEREIRA, Marco; SOUSA, Pedro. Plataforma para Análise de Tráfego e Optimização de Infraestruturas de Comunicação. In: <strong>CONFERÊNCIA IBÉRICA DE SISTEMAS E TECNOLOGIAS DE INFORMAÇÃO (CISTI)</strong>, 13., 2018. Anais... Caceres: AISTI, 2018. p. 1-6.
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
