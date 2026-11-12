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

    /* Padrão UTP 3ª Edição (p. 47-49): Papel A4, Fonte Arial 12, Entrelinhas 1.5 */
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
    }

    /* Margens oficiais UTP (p. 48): Superior 3cm, Esquerda 3cm, Direita 2cm, Inferior 2cm */
    .page {
      width: 210mm;
      height: 297mm;
      padding: 30mm 20mm 20mm 30mm;
      position: relative;
      page-break-after: always;
      background: #ffffff;
    }

    /* Paginação oficial UTP (p. 48-49): Canto superior direito, a 2cm da borda superior e 2cm da borda lateral direita, Arial 10 */
    .page-number {
      position: absolute;
      top: 20mm;
      right: 20mm;
      font-size: 10pt;
      color: #000000;
      font-family: Arial, sans-serif;
    }

    p {
      margin: 0 0 10pt 0;
      text-align: justify;
      text-indent: 1.25cm; /* Recuo padrão ABNT / UTP */
    }

    p.no-indent {
      text-indent: 0;
    }

    /* Títulos oficiais UTP (p. 47-48): 
       Nível 1: 1 TÍTULO (MAIÚSCULAS, negrito, Arial 12)
       Nível 2: 1.1 SUBTÍTULO (MAIÚSCULAS, sem negrito, Arial 12)
       Nível 3: 1.1.1 Subtítulo (só inicial maiúscula, sem negrito, Arial 12)
       Pular 1 linha para separar títulos dos textos que antecedem ou sucedem.
    */
    h1, h2, h3, h4 {
      color: #000000;
      font-family: Arial, sans-serif;
      page-break-after: avoid;
    }

    h1.primary-title {
      font-size: 12pt;
      text-transform: uppercase;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 12pt;
    }

    h2.secondary-title {
      font-size: 12pt;
      text-transform: uppercase;
      font-weight: normal;
      margin-top: 14pt;
      margin-bottom: 10pt;
    }

    h3.tertiary-title {
      font-size: 12pt;
      text-transform: none;
      font-weight: normal;
      margin-top: 12pt;
      margin-bottom: 8pt;
    }

    /* CAPA oficial UTP (p. 59-61): Arial 14, maiúsculas, negrito, centralizado, entrelinhas 1.5 */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 247mm;
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.5;
    }

    .cover-institution {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }

    .cover-author {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
      margin-top: 20mm;
    }

    .cover-title-box {
      margin-top: 25mm;
    }

    .cover-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.35;
    }

    .cover-footer {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
    }

    /* FOLHA DE ROSTO oficial UTP (p. 62-63): 
       Nota explicativa afastada 8cm da margem esquerda, fonte tamanho 10, espaçamento simples, sem negrito.
    */
    .title-page-note-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20mm;
      margin-bottom: 20mm;
    }

    .title-page-note {
      width: 90mm; /* Afastada 8cm da margem esquerda na folha A4 com margem 3cm */
      font-size: 10pt;
      line-height: 1.25;
      text-align: justify;
      color: #000000;
    }

    /* Quadros oficiais UTP (p. 54-55): traços contornam toda a ilustração */
    table.abnt-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      font-size: 9.5pt;
      line-height: 1.3;
    }

    table.abnt-table th, table.abnt-table td {
      border: 1px solid #000000;
      padding: 5pt 7pt;
      text-align: left;
    }

    table.abnt-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    /* Ilustrações oficiais UTP (p. 52-53): 
       Identificação no topo, centralizada. 
       Fonte na parte inferior em letra menor (Arial 10). 
       Trabalho em equipe: "FONTE: os próprios autores, [ano]."
    */
    .figure-box {
      margin: 10pt 0;
      text-align: center;
    }

    .figure-caption-top {
      font-size: 10pt;
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
      font-size: 10pt;
      color: #000000;
      margin-top: 4pt;
      text-align: center;
    }

    pre, code {
      font-family: "Courier New", Courier, monospace;
      font-size: 8.5pt;
    }

    pre {
      background-color: #f8f9fa;
      border: 1px solid #cccccc;
      padding: 8pt 10pt;
      line-height: 1.3;
      margin: 8pt 0;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    ul, ol {
      margin: 0 0 10pt 20pt;
      padding: 0;
    }

    li {
      margin-bottom: 4pt;
      text-align: justify;
    }

    /* Sumário e Listas oficiais UTP (p. 68-73): espaçamento 1,5, linha pontilhada */
    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3.5pt;
      font-size: 9.5pt;
      line-height: 1.35;
    }

    .toc-item.bold {
      font-weight: bold;
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #444444;
      margin: 0 4pt 3pt 4pt;
    }

    /* Referências oficiais UTP (p. 86-87): alinhadas à esquerda, sem recuo, espaçamento simples, 1 linha em branco entre elas */
    .reference-item {
      font-size: 9.5pt;
      line-height: 1.25;
      margin-bottom: 6pt;
      text-align: justify;
    }
  </style>
</head>
<body>

  <!-- ==================== CAPA (p. 59-61 do Manual UTP) ==================== -->
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
          OBSERVABILIDADE E MONITORAMENTO DE DESEMPENHO DE APLICAÇÕES (APM):<br />
          ARQUITETURA TÉCNICA E VALIDAÇÃO EXPERIMENTAL
        </div>
      </div>

      <div class="cover-footer">
        CURITIBA<br />
        2026
      </div>
    </div>
  </div>

  <!-- ==================== FOLHA DE ROSTO (p. 62-63 do Manual UTP) ==================== -->
  <!-- Folha contada (Folha 1), numeração visível não exibida em pré-textuais -->
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
          OBSERVABILIDADE E MONITORAMENTO DE DESEMPENHO DE APLICAÇÕES (APM):<br />
          ARQUITETURA TÉCNICA E VALIDAÇÃO EXPERIMENTAL
        </div>
      </div>

      <div class="title-page-note-container">
        <div class="title-page-note">
          Relatório técnico-científico apresentado à Faculdade de Ciências Exatas e de Tecnologia da Universidade Tuiuti do Paraná, como requisito avaliativo do 2º bimestre na disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas.
          <br /><br />
          <strong>Professor:</strong> Prof. Me. André Luiz de Souza Paula
        </div>
      </div>

      <div class="cover-footer">
        CURITIBA<br />
        2026
      </div>
    </div>
  </div>

  <!-- ==================== RESUMO (Folha 2 contada, p. 66-67 do Manual UTP) ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center; margin-bottom: 24pt;">RESUMO</h1>
    <p class="no-indent">
      O presente relatório técnico-científico expõe a especificação da arquitetura, as diretrizes de engenharia e a validação experimental de uma plataforma autoral de observabilidade voltada à telemetria contínua de hardware e monitoramento de desempenho de aplicações (APM – <em>Application Performance Monitoring</em>). A indisponibilidade de serviços computacionais críticos e a detecção tardia de saturações de hardware motivaram o desenvolvimento de uma topologia híbrida e distribuída. O sistema integra coletores locais baseados no padrão aberto Prometheus Node Exporter, WMI (<em>Windows Management Instrumentation</em>) e utilitário de leitura direta de aceleradores gráficos dedicados com a plataforma corporativa em nuvem Sentry APM. Para comprovar a eficácia prática da solução em ambiente controlado de laboratório, foram conduzidos ensaios empíricos no computador de desenvolvimento, validando o comportamento do sistema sob regime nominal de repouso (CPU 10%, RAM 73%, Disco 79%, GPU 37%) e sob estresse operacional severo (>90% de ocupação de GPU e RAM). Os ensaios comprovaram a sensibilidade das métricas temporais em React com Recharts, a eficácia da máquina de estados finita dotada de trava de resfriamento (<em>cooldown</em> de 45 segundos) e o registro forense das ocorrências no painel da APM corporativa, atestando o cumprimento pleno de todos os objetivos estabelecidos na proposta pedagógica do curso.
    </p>
    <p class="no-indent" style="margin-top: 28pt;">
      <strong>Palavras-chave:</strong> Observabilidade. Telemetria de Hardware. Application Performance Monitoring (APM). Sentry. Auto-Discovery. Projeto Interdisciplinar.
    </p>
  </div>

  <!-- ==================== LISTAS (Folha 3 contada, p. 68-71 do Manual UTP) ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center; margin-top: 0; margin-bottom: 6pt;">LISTA DE ILUSTRAÇÕES</h1>
    <div class="toc-item"><span>FIGURA 1 – TOPOLOGIA DA ARQUITETURA DISTRIBUÍDA E FLUXO DE TELEMETRIA</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item"><span>FIGURA 2 – MÁQUINA DE ESTADOS FINITA DO MOTOR DE ALERTAS E AUTO-RECOVERY</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item"><span>FIGURA 3 – PAINEL DE DISPOSITIVOS MONITORADOS EM CONDIÇÃO NOMINAL (STATUS ONLINE)</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item"><span>FIGURA 4 – MÓDULO DE MÉTRICAS DETALHADAS COM GRÁFICO TEMPORAL DE OSCILAÇÃO</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item"><span>FIGURA 5 – DETECÇÃO DE SOBRECARGA CRÍTICA (>90%) E COMUTAÇÃO PARA ESTADO CRITICAL</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item"><span>FIGURA 6 – CENTRAL DE INCIDENTES COM FILA DE ALERTAS ATIVOS E RESOLVIDOS (AUTO-RECOVERY)</span><span class="toc-dots"></span><span>15</span></div>
    <div class="toc-item"><span>FIGURA 7 – RASTREAMENTO FORENSE NO PAINEL CORPORATIVO DO SENTRY APM</span><span class="toc-dots"></span><span>16</span></div>

    <h1 class="primary-title" style="text-align: center; margin-top: 10pt; margin-bottom: 6pt;">LISTA DE QUADROS</h1>
    <div class="toc-item"><span>QUADRO 1 – MATRIZ COMPARATIVA DE SOLUÇÕES APM DE MERCADO</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item"><span>QUADRO 2 – MATRIZ DE RASTREABILIDADE E CUMPRIMENTO DOS OBJETIVOS DO 1º BIMESTRE</span><span class="toc-dots"></span><span>17</span></div>

    <h1 class="primary-title" style="text-align: center; margin-top: 10pt; margin-bottom: 6pt;">LISTA DE ABREVIATURAS E SIGLAS</h1>
    <div class="toc-item"><span>APM – Application Performance Monitoring (Monitoramento de Desempenho de Aplicações)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>ABNT – Associação Brasileira de Normas Técnicas</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>CPU – Central Processing Unit (Unidade Central de Processamento)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>GPU – Graphics Processing Unit (Unidade de Processamento Gráfico)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>HTTP – Hypertext Transfer Protocol</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>JSON – JavaScript Object Notation</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>RAM – Random Access Memory (Memória de Acesso Aleatório)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>REST – Representational State Transfer</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>SDK – Software Development Kit</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>SLA – Service Level Agreement (Acordo de Nível de Serviço)</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>UTP – Universidade Tuiuti do Paraná</span><span class="toc-dots"></span></div>
    <div class="toc-item"><span>WMI – Windows Management Instrumentation</span><span class="toc-dots"></span></div>
  </div>

  <!-- ==================== SUMÁRIO (Folha 4 contada, p. 72-73 do Manual UTP) ==================== -->
  <div class="page">
    <h1 class="primary-title" style="text-align: center;">SUMÁRIO</h1>
    <br />
    <div class="toc-item bold"><span>1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</span><span class="toc-dots"></span><span>5</span></div>
    <div class="toc-item bold"><span>2 OBJETIVOS DO PROJETO</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.1 OBJETIVO GERAL</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.2 OBJETIVOS ESPECÍFICOS</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>2.3 DELIMITAÇÃO E METODOLOGIA CIENTÍFICA</span><span class="toc-dots"></span><span>6</span></div>
    <div class="toc-item bold"><span>3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.1 TOPOLOGIA DISTRIBUÍDA E AUTO-DISCOVERY</span><span class="toc-dots"></span><span>7</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.2 PROTOCOLOS E COLETORES DE HARDWARE</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>3.3 INFRAESTRUTURA FÍSICA E CONFIGURAÇÃO DO LABORATÓRIO</span><span class="toc-dots"></span><span>8</span></div>
    <div class="toc-item bold"><span>4 JUSTIFICATIVA DA ESCOLHA DA APM</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.1 ESTUDO COMPARATIVO DE MERCADO</span><span class="toc-dots"></span><span>9</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.2 DECISÃO TÉCNICA PELO SENTRY APM</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.3 ENGENHARIA DE ALERTAS, COOLDOWN E MÁQUINA DE ESTADOS</span><span class="toc-dots"></span><span>10</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>4.4 IMPLEMENTAÇÃO DO ALGORITMO DE RESFRIAMENTO</span><span class="toc-dots"></span><span>11</span></div>
    <div class="toc-item bold"><span>5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.1 ENSAIO 1: DESCOBERTA E TELEMETRIA EM REPOUSO</span><span class="toc-dots"></span><span>12</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.2 ENSAIO 2: SÉRIES TEMPORAIS E VISUALIZAÇÃO GRÁFICA</span><span class="toc-dots"></span><span>13</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.3 ENSAIO 3: TESTE DE CARGA E SATURAÇÃO CRÍTICA (>90%)</span><span class="toc-dots"></span><span>14</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.4 ENSAIO 4: CENTRAL DE INCIDENTES E AUTO-RECOVERY</span><span class="toc-dots"></span><span>15</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>5.5 ENSAIO 5: RASTREAMENTO FORENSE NO PAINEL DO SENTRY APM</span><span class="toc-dots"></span><span>16</span></div>
    <div class="toc-item bold"><span>6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</span><span class="toc-dots"></span><span>17</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.1 CONFRONTO ENTRE OBJETIVOS PLANEJADOS E ENTREGAS REALIZADAS</span><span class="toc-dots"></span><span>17</span></div>
    <div class="toc-item" style="padding-left: 12pt;"><span>6.2 TRABALHOS FUTUROS E CONCLUSÃO</span><span class="toc-dots"></span><span>18</span></div>
    <div class="toc-item bold"><span>REFERÊNCIAS</span><span class="toc-dots"></span><span>19</span></div>
  </div>

  <!-- ==================== ELEMENTOS TEXTUAIS: PÁGINA 5 (Início da numeração visível p. 48-49) ==================== -->
  <!-- 1 INTRODUÇÃO E CONTEXTUALIZAÇÃO -->
  <div class="page">
    <div class="page-number">5</div>
    <h1 class="primary-title">1 INTRODUÇÃO E CONTEXTUALIZAÇÃO</h1>
    <p>
      O monitoramento contínuo de infraestrutura computacional e de sistemas de software tornou-se um pilar estratégico imprescindível na governança de tecnologia da informação. Em ecossistemas modernos de alta concorrência e processamento intensivo, a degradação silenciosa de recursos físicos fundamentais — tais como sobrecarga na Unidade Central de Processamento (CPU), esgotamento de Memória Principal (RAM) ou saturação em Unidades de Processamento Gráfico (GPU) — pode acarretar indisponibilidades severas e comprometer os Acordos de Nível de Serviço (SLA) antes que qualquer equipe operacional detecte o incidente.
    </p>
    <p>
      No primeiro bimestre letivo desta pesquisa, conduziu-se um diagnóstico aprofundado a respeito das principais ferramentas comerciais de monitoramento de desempenho de aplicações (APM – <em>Application Performance Monitoring</em>). Esse estudo inicial evidenciou que soluções consagradas de grande porte, a exemplo do Datadog, impõem modelos de licenciamento com custos proibitivos para projetos acadêmicos e pequenas infraestruturas, cobrando tarifas em moeda estrangeira por nó monitorado e penalizando picos momentâneos de utilização. Por outro lado, plataformas simplificadas como o Better Stack concentram suas análises em testes sintéticos externos de disponibilidade (Uptime e checagens HTTP), carecendo de recursos nativos para instrumentação forense e inspeção minuciosa de hardware local.
    </p>
    <p>
      Diante dessa lacuna técnica e atendendo às exigências pedagógicas da disciplina de Projeto Interdisciplinar: Monitoramento de Sistemas da Universidade Tuiuti do Paraná (UTP), a equipe concebeu a plataforma <strong>WatchFlow</strong>. A solução unifica a extração periódica de dados de hardware local sem necessidade de parametrização manual complexa, apresentando-os em uma interface web analítica construída com padrões modernos da indústria e integrada de ponta a ponta à infraestrutura do <strong>Sentry APM</strong>.
    </p>
    <p>
      O presente relatório técnico-científico tem por finalidade detalhar a arquitetura da solução desenvolvida, fundamentar a seleção da APM adotada frente ao mercado, comprovar a eficácia dos mecanismos de controle de eventos e apresentar as evidências empíricas colhidas em ensaios laboratoriais reais, atestando a conformidade plena com os objetivos curriculares estabelecidos para o curso de Tecnologia em Análise e Desenvolvimento de Sistemas.
    </p>
  </div>

  <!-- ==================== PÁGINA 6: OBJETIVOS ==================== -->
  <div class="page">
    <div class="page-number">6</div>
    <h1 class="primary-title">2 OBJETIVOS DO PROJETO</h1>
    <h2 class="secondary-title">2.1 OBJETIVO GERAL</h2>
    <p>
      Desenvolver, documentar e validar experimentalmente uma plataforma web de observabilidade capaz de realizar a descoberta automática de ativos computacionais locais, inspecionar métricas de hardware em tempo real e integrar-se a uma solução corporativa de APM para rastreamento forense de falhas, análise de transações e gestão do ciclo de vida de incidentes.
    </p>

    <h2 class="secondary-title">2.2 OBJETIVOS ESPECÍFICOS</h2>
    <p>
      Em conformidade com o plano de ensino da disciplina e a proposta formal pactuada no primeiro bimestre, foram estabelecidos quatro objetivos operacionais essenciais:
    </p>
    <ol>
      <li><strong>Mapeamento de Requisitos e Arquitetura:</strong> Projetar uma arquitetura modular desacoplada entre a camada de extração de telemetria local, a camada de ingestão e o painel analítico de visualização;</li>
      <li><strong>Investigação de Agentes e Telemetria de Hardware:</strong> Desenvolver rotinas periódicas de extração direta de contadores de sistema (CPU, RAM, Disco) e de aceleração gráfica (GPU), viabilizando o reconhecimento instantâneo (<em>Auto-Discovery</em>);</li>
      <li><strong>Estudo Comparativo e Integração com APM Corporativo:</strong> Conectar a camada de aplicação ao Sentry APM, viabilizando o encaminhamento de falhas com contexto enriquecido por tags personalizadas de hardware e estado operacional;</li>
      <li><strong>Avaliação de Alertas e Resposta a Incidentes:</strong> Construir uma máquina de estados finita com limiares críticos (>90%), trava de resfriamento (<em>cooldown</em> de 45 segundos), notificações visuais para o operador e mecanismo de normalização automática (<em>auto-recovery</em>).</li>
    </ol>

    <h2 class="secondary-title">2.3 DELIMITAÇÃO E METODOLOGIA CIENTÍFICA</h2>
    <p>
      O estudo orienta-se pela metodologia de pesquisa tecnológica aplicada, fundamentada em ensaios práticos controlados no laboratório de desenvolvimento. A validação das rotinas de telemetria baseou-se no confronto sistemático entre as medições da plataforma e os monitores nativos do sistema operacional, avaliando o comportamento sob condições nominais de repouso e sob rotinas induzidas de estresse de hardware.
    </p>
  </div>

  <!-- ==================== PÁGINA 7: ARQUITETURA E TOPOLOGIA ==================== -->
  <div class="page">
    <div class="page-number">7</div>
    <h1 class="primary-title">3 ARQUITETURA TÉCNICA E FLUXO DE MONITORAMENTO</h1>
    <h2 class="secondary-title">3.1 TOPOLOGIA DISTRIBUÍDA E AUTO-DISCOVERY</h2>
    <p>
      O sistema adota uma topologia híbrida de monitoramento. Em vez de exigir cadastros manuais de endereços IP em formulários estáticos, o nó local reporta suas métricas continuamente para a interface analítica em ciclos regulares de 2000 milissegundos:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 1 – TOPOLOGIA DA ARQUITETURA DISTRIBUÍDA E FLUXO DE TELEMETRIA</div>
      ${figura1Html}
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Diagrama conceitual da arquitetura de telemetria e ingestão em nuvem.</div>
    </div>
    <p>
      O mecanismo de <em>Auto-Discovery</em> reconhece o nó hospedeiro assim que a aplicação é iniciada. Ao consultar os endpoints de telemetria locais, o sistema detecta o hostname, o endereço IP de loopback e os recursos disponíveis, instanciando o card do host sem qualquer etapa prévia de parametrização.
    </p>
  </div>

  <!-- ==================== PÁGINA 8: PROTOCOLOS E INFRAESTRUTURA ==================== -->
  <div class="page">
    <div class="page-number">8</div>
    <h2 class="secondary-title">3.2 PROTOCOLOS E COLETORES DE HARDWARE</h2>
    <p>
      A camada de ingestão de telemetria estrutura-se a partir de três mecanismos complementares:
    </p>
    <ul>
      <li><strong>Prometheus Node Exporter:</strong> Padrão aberto de mercado na porta 9100, utilizado para extração de contadores do sistema operacional conforme convenções abertas de telemetria;</li>
      <li><strong>Módulo do Sistema Operacional (WMI/Node.js):</strong> No Windows, o coletor realiza chamadas às funções internas do sistema operacional (como <code>os.cpus()</code> e <code>os.totalmem()</code>), calculando os deltas de tempo de processamento ativo em relação ao tempo ocioso para mensurar a CPU em percentual exato;</li>
      <li><strong>Extração de Telemetria de GPU:</strong> Como a maioria das ferramentas tradicionais restringe-se ao processador central e ignora aceleradores gráficos dedicados, implementamos uma rotina de extração via binário do driver gráfico, convertendo uso de processador gráfico, alocação de memória e temperatura em JSON estruturado a cada ciclo.</li>
    </ul>

    <h2 class="secondary-title">3.3 INFRAESTRUTURA FÍSICA E CONFIGURAÇÃO DO LABORATÓRIO</h2>
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
    <div class="page-number">9</div>
    <h1 class="primary-title">4 JUSTIFICATIVA DA ESCOLHA DA APM</h1>
    <h2 class="secondary-title">4.1 ESTUDO COMPARATIVO DE MERCADO</h2>
    <p>
      Para fundamentar a escolha da plataforma de APM com rigor acadêmico, confrontamos as três alternativas analisadas no 1º bimestre: <strong>Sentry</strong>, <strong>Datadog</strong> e <strong>Better Stack</strong>:
    </p>

    <div class="figure-caption-top">QUADRO 1 – MATRIZ COMPARATIVA DE SOLUÇÕES APM DE MERCADO</div>
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
    <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Matriz comparativa baseada na documentação técnica oficial das plataformas.</div>
  </div>

  <!-- ==================== PÁGINA 10: MÁQUINA DE ESTADOS E COOLDOWN ==================== -->
  <div class="page">
    <div class="page-number">10</div>
    <h2 class="secondary-title">4.2 DECISÃO TÉCNICA PELO SENTRY APM</h2>
    <p>
      A decisão pelo Sentry fundamentou-se em três pilares técnicos: aderência total à pilha frontend (React/TypeScript), capacidade de enriquecer cada incidente com metadados detalhados de hardware (tags de nó, percentuais de uso e status) e ausência de restrições financeiras ou exigência de cartões internacionais, permitindo foco exclusivo no desenvolvimento do sistema.
    </p>

    <h2 class="secondary-title">4.3 ENGENHARIA DE ALERTAS, COOLDOWN E MÁQUINA DE ESTADOS</h2>
    <p>
      Um obstáculo prático identificado durante os primeiros ensaios foi o risco de saturação da API do Sentry. Como o coletor consulta o nó a cada 2000 milissegundos, caso a máquina sofresse uma sobrecarga sustentada de 5 minutos, seriam enviados 150 chamados sucessivos, gerando bloqueio por taxa de requisição (<em>rate-limit</em>) e esgotamento da cota gratuita da conta.
    </p>
    <p>
      Para solucionar esse problema, projetamos uma <strong>Máquina de Estados Finita com Trava de Resfriamento (*Cooldown*) de 45 segundos</strong> no módulo <code>deviceService.ts</code>:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 2 – MÁQUINA DE ESTADOS FINITA DO MOTOR DE ALERTAS E AUTO-RECOVERY</div>
      ${figura2Html}
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Fluxograma da máquina de estados finita e ciclo de resfriamento.</div>
    </div>
    <p>
      Caso os valores permaneçam acima do teto de 90%, o estado do host na tela segue destacado em vermelho como <code>CRITICAL</code>, mantendo o operador ciente do perigo. Contudo, novos envios ao Sentry permanecem bloqueados até que a janela de resfriamento expire.
    </p>
  </div>

  <!-- ==================== PÁGINA 11: IMPLEMENTAÇÃO DO CÓDIGO COMPLETO ==================== -->
  <div class="page">
    <div class="page-number">11</div>
    <h2 class="secondary-title">4.4 IMPLEMENTAÇÃO DO ALGORITMO DE RESFRIAMENTO</h2>
    <p>
      A listagem a seguir apresenta a implementação em TypeScript do módulo <code>src/services/deviceService.ts</code>, evidenciando o controle de concorrência, o respeito à janela de resfriamento e o envio estruturado de métricas ao Sentry:
    </p>

    <pre>
// Implementação do controle de resfriamento e disparo no Sentry APM
const CRITICAL_THRESHOLD = 90; // Limiar percentual de alerta crítico
const ALERT_COOLDOWN_MS = 45000; // Janela de segurança de 45 segundos
const recentDispatches = new Map&lt;string, number&gt;();

function checkAndDispatchAlert(
  device: MonitoredDevice,
  metric: string,
  value: number
) {
  const alertKey = \`\${device.id}_\${metric}\`;
  const now = Date.now();
  const lastTime = recentDispatches.get(alertKey) || 0;

  if (value &gt;= CRITICAL_THRESHOLD) {
    if (now - lastTime &gt; ALERT_COOLDOWN_MS) {
      recentDispatches.set(alertKey, now);

      // 1. Notificação visual imediata para o operador
      toast.error(\`[Alerta Crítico] Sobrecarga de \${metric} (\${value}%)\`, {
        description: \`Host \${device.name} ultrapassou o limiar de segurança de 90%.\`
      });

      // 2. Registro analítico estruturado no Sentry
      Sentry.withScope((scope) =&gt; {
        scope.setLevel('fatal');
        scope.setTag('resource', metric);
        scope.setTag('hostname', device.name);
        scope.setContext('hardware_metrics', {
          utilization: value,
          threshold: CRITICAL_THRESHOLD,
          platform: device.os
        });
        Sentry.captureMessage(
          \`[WatchFlow Alert] Sobrecarga Crítica de \${metric} (\${value}%)\`
        );
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
    <div class="page-number">12</div>
    <h1 class="primary-title">5 RESULTADOS EXPERIMENTAIS E EVIDÊNCIAS DE FUNCIONAMENTO</h1>
    <p>
      Apresentam-se a seguir os registros empíricos obtidos diretamente na execução prática do sistema no computador do laboratório, cobrindo todos os módulos da plataforma.
    </p>

    <h2 class="secondary-title">5.1 ENSAIO 1: DESCOBERTA E TELEMETRIA EM REPOUSO</h2>
    <p>
      Ao iniciar os serviços, o nó <code>srv-local-pc</code> (127.0.0.1, Windows 11 x86_64) foi detectado automaticamente, apresentando os contadores de CPU, RAM, Disco e GPU em condição nominal de operação:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 3 – PAINEL DE DISPOSITIVOS MONITORADOS EM CONDIÇÃO NOMINAL (STATUS ONLINE)</div>
      <img src="${img1}" alt="Dispositivos Monitorados Status ONLINE" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface de Dispositivos (/devices).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O host registrou consumo equilibrado: CPU em 10%, memória RAM em 73%, disco em 79% e acelerador gráfico GPU em 37%. O sistema manteve o distintivo verde <code>ONLINE</code>, sem emissão de alertas indevidos.
    </p>
  </div>

  <!-- ==================== PÁGINA 13: ENSAIO 2 (MÉTRICAS) ==================== -->
  <div class="page">
    <div class="page-number">13</div>
    <h2 class="secondary-title">5.2 ENSAIO 2: SÉRIES TEMPORAIS E VISUALIZAÇÃO GRÁFICA</h2>
    <p>
      No módulo analítico de Métricas (/metrics), o sistema oferece gráficos contínuos de séries temporais desenvolvidos com a biblioteca Recharts, exibindo os dados históricos de desempenho do host selecionado:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 4 – MÓDULO DE MÉTRICAS DETALHADAS COM GRÁFICO TEMPORAL DE OSCILAÇÃO</div>
      <img src="${img2}" alt="Métricas Detalhadas Séries Temporais" style="max-height: 110mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface de Métricas (/metrics).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> O painel exibe a alocação de memória física (12 GB em uso de 15.9 GB totais), uso de disco (786 GB de 999 GB), tráfego de rede ativo (1.1 MB/s download e 0.6 MB/s upload) e a curva de oscilação temporal com janela deslizante de registros sucessivos.
    </p>
  </div>

  <!-- ==================== PÁGINA 14: ENSAIO 3 (SOBRECARGA CRÍTICA) ==================== -->
  <div class="page">
    <div class="page-number">14</div>
    <h2 class="secondary-title">5.3 ENSAIO 3: TESTE DE CARGA E SATURAÇÃO CRÍTICA (>90%)</h2>
    <p>
      Para avaliar o comportamento da plataforma sob estresse severo de hardware, acionou-se a rotina de sobrecarga operacional, elevando a demanda sobre a memória RAM e a placa de vídeo:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 5 – DETECÇÃO DE SOBRECARGA CRÍTICA (>90%) E COMUTAÇÃO PARA ESTADO CRITICAL</div>
      <img src="${img3}" alt="Dispositivos em Sobrecarga Status CRITICAL" style="max-height: 105mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da interface durante teste de saturação de hardware.</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> Ao atingir <strong>94%</strong> de memória física RAM e <strong>96%</strong> de utilização do acelerador gráfico GPU, o sistema identificou imediatamente a violação do limiar de 90%, comutando o distintivo do host para <strong><code>CRITICAL</code></strong> em vermelho e disparando a barra de GPU em destaque de alerta.
    </p>
  </div>

  <!-- ==================== PÁGINA 15: ENSAIO 4 (CENTRAL DE ALERTAS) ==================== -->
  <div class="page">
    <div class="page-number">15</div>
    <h2 class="secondary-title">5.4 ENSAIO 4: CENTRAL DE INCIDENTES E AUTO-RECOVERY</h2>
    <p>
      No módulo de Alertas (/alerts), a aplicação gerencia os chamados operacionais gerados pelas violações de limiares de segurança:
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 6 – CENTRAL DE INCIDENTES COM FILA DE ALERTAS ATIVOS E RESOLVIDOS (AUTO-RECOVERY)</div>
      <img src="${img4}" alt="Central de Incidentes e Alertas" style="max-height: 110mm;" />
      <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Captura de tela da Central de Incidentes e Alertas (/alerts).</div>
    </div>

    <p>
      <em>Análise do Ensaio:</em> A Central de Incidentes registrou as ocorrências de <em>Sobrecarga Crítica de GPU (94% e 96%)</em> e <em>Esgotamento Crítico de Memória RAM (91% e 99%)</em>. O operador dispõe de botões para Reconhecer e Resolver os chamados, enquanto o motor de <em>Auto-Recovery</em> automaticamente contabilizou os incidentes normalizados no painel verde de histórico.
    </p>
  </div>

  <!-- ==================== PÁGINA 16: ENSAIO 5 (SENTRY APM) ==================== -->
  <div class="page">
    <div class="page-number">16</div>
    <h2 class="secondary-title">5.5 ENSAIO 5: RASTREAMENTO FORENSE NO PAINEL DO SENTRY APM</h2>
    <p>
      Para certificar a entrega ponta a ponta da telemetria de incidentes para a nuvem, inspecionou-se o painel oficial do projeto no Sentry (<code>watchflow.sentry.io/issues</code>):
    </p>

    <div class="figure-box">
      <div class="figure-caption-top">FIGURA 7 – RASTREAMENTO FORENSE NO PAINEL CORPORATIVO DO SENTRY APM</div>
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

  <!-- ==================== PÁGINA 17: CONSIDERAÇÕES FINAIS E CONFRONTO ==================== -->
  <div class="page">
    <div class="page-number">17</div>
    <h1 class="primary-title">6 CONSIDERAÇÕES FINAIS E CUMPRIMENTO DOS OBJETIVOS</h1>
    <h2 class="secondary-title">6.1 CONFRONTO ENTRE OBJETIVOS PLANEJADOS E ENTREGAS REALIZADAS</h2>
    <p>
      O Quadro 2 apresenta o confronto direto entre as metas propostas no documento do primeiro bimestre e os resultados validados no produto final:
    </p>

    <div class="figure-caption-top">QUADRO 2 – MATRIZ DE RASTREABILIDADE E CUMPRIMENTO DOS OBJETIVOS DO 1º BIMESTRE</div>
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
    <div class="figure-source-bottom">FONTE: os próprios autores, 2026. Matriz de rastreabilidade entre o plano de ensino e as entregas experimentais.</div>

    <p>
      Dessa forma, a equipe transformou a pesquisa bibliográfica do primeiro bimestre em um sistema funcional, documentado e validado empiricamente, superando as deficiências apontadas pelo orientador nas entregas anteriores.
    </p>
  </div>

  <!-- ==================== PÁGINA 18: TRABALHOS FUTUROS E CONCLUSÃO ==================== -->
  <div class="page">
    <div class="page-number">18</div>
    <h2 class="secondary-title">6.2 TRABALHOS FUTUROS E CONCLUSÃO</h2>
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
    <div class="page-number">19</div>
    <h1 class="primary-title" style="text-align: center;">REFERÊNCIAS</h1>
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
const altPdfPath = path.join(docsDir, 'Observabilidade_e_Monitoramento_APM.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Rendering PDF via Microsoft Edge Headless...');
try {
  execFileSync(edgePath, [
    '--headless',
    '--print-to-pdf=' + pdfPath,
    '--no-pdf-header-footer',
    'file:///' + htmlPath.replace(/\\/g, '/')
  ]);
  fs.copyFileSync(pdfPath, altPdfPath);
  console.log('PDF generated successfully at both paths!');
} catch (err) {
  console.error('Error generating PDF with Edge:', err);
}
