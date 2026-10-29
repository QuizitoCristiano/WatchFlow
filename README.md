# WatchFlow

WatchFlow é um projeto acadêmico para monitoramento de infraestrutura e apresentação de métricas e informações operacionais. O repositório contém uma aplicação web React, funções serverless Vercel para ingestão e um coletor local Node.js.

> O pipeline de ingestão está implementado localmente, mas não foi publicado nem validado com Firebase real. Não considere a coleta contínua ativa até configurar e executar a API e o coletor.

## Tecnologias confirmadas

- React 19, TypeScript 6 e Vite 8 para o frontend.
- Firebase Authentication e Cloud Firestore no frontend; Firebase Admin somente nas funções server-side.
- Recharts 3, Tailwind CSS 4 e React Router 7.
- Coletor Node.js independente, usando `fetch`, `node:test` e strip de tipos experimental nativo do Node.
- Node Exporter 1.9.0 observado no ambiente local de validação. Telegraf, Zabbix, Sentry, Datadog e Better Stack são opções mencionadas/consideradas, não integrações implementadas no coletor.

## Pré-requisitos

- Node.js 22.6 ou superior e npm para frontend, API e coletor.
- Para testar a coleta real, acesso de rede ao endpoint Node Exporter configurado. O endereço da VM local não é fixo.

O pacote não declara uma versão mínima de Node para o frontend. O coletor foi validado no ambiente com Node 22.17.1.

## Início rápido

Instale as dependências do projeto:

```bash
npm install
```

Configure as variáveis de cliente Firebase usadas em `src/services/config.tsx` no ambiente local, sem incluir credenciais administrativas. Inicie o frontend com o script existente:

```bash
npm run dev
```

`npm run build` também valida TypeScript da API. Scripts adicionais: `npm run api:check`, `npm run api:test`, `npm run collector:check` e `npm run collector:test`. Não há suíte de testes de interface configurada.

## Coletor local

Sem token de ingestão, o coletor executa uma coleta local e imprime JSON, sem persistir:

```powershell
$env:NODE_EXPORTER_URL = "http://IP_DA_VM:9100/metrics"
npm run collector:start
```

Para fluxo persistente, crie integração na tela Integrações, gere a credencial de coletor e execute o comando seguro apresentado uma única vez. Isso requer as variáveis server-side `FIREBASE_SERVICE_ACCOUNT_JSON` e `COLLECTOR_TOKEN_PEPPER` na Vercel e um deployment da API. A coleta configurada usa `COLLECTOR_INTERVAL_MS` (padrão 60 s), envia via HTTPS, e exige TTL Firestore habilitado conforme [documentação do coletor](docs/architecture/monitoring-collector.md). Não exponha a porta 9100.

Se `NODE_EXPORTER_URL` não for definida, o código usa `http://192.168.1.2:9100/metrics`, endereço específico do ambiente local e sujeito a mudança. Para verificações sem acessar a VM:

```bash
npm run collector:test
npm run collector:check
npm run api:test
npm run api:check
```

O Node pode exibir `ExperimentalWarning` por causa de `--experimental-strip-types`; isso indica o status experimental do recurso e não significa, por si só, falha do coletor. Testes automatizados usam fakes e não confirmam gravação no Firebase de produção.

## Limitações atuais

- O fluxo autenticado exige configurar Vercel/Firebase, habilitar TTL e validar as Rules de leitura para os caminhos do Dashboard.
- Não há configuração de Firebase Emulator nem Rules versionadas; integração ponta a ponta permanece pendente.
- A tela de métricas e outros recursos podem conter comportamentos demonstrativos, identificados separadamente.
- Uma execução anterior de `npm run lint` no repositório reportou erros em arquivos do frontend fora do coletor; não representa aprovação do lint integral.

## Documentação

- [Visão geral da arquitetura](docs/architecture/overview.md)
- [Especificação do coletor](docs/architecture/monitoring-collector.md)
- [Contrato e retenção de dados de métricas](docs/architecture/metrics-data-contract.md)
- [Análise histórica da arquitetura de ingestão](docs/architecture/metrics-ingestion-architecture.md)
- [Viabilidade técnica e financeira da ingestão](docs/architecture/ingestion-feasibility.md)
- [Roadmap e pendências](docs/development/roadmap.md)