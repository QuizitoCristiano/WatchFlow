# Sentry APM — WatchFlow

## Escopo

Esta etapa instrumenta o frontend React do WatchFlow: exceções JavaScript, falhas de renderização React, Browser Tracing, sanitização de dados e eventos de conectividade do navegador.

O Sentry monitora a aplicação WatchFlow executada em cada navegador. Ele não instala agentes em hosts, não coleta CPU/RAM/disco/GPU físicos e não substitui o coletor de infraestrutura.

## Configuração

Crie um projeto Sentry para React e configure:
- `VITE_SENTRY_DSN`: DSN público de ingestão do projeto React.
- `VITE_APP_RELEASE`: versão do frontend.
- `VITE_SENTRY_DEBUG=false` em produção.
- `VITE_SENTRY_ALLOW_TEST_ERRORS=false` em produção.

As variáveis `VITE_*` são incorporadas no build. Configure localmente e na Vercel e faça um novo deploy. Nunca coloque auth tokens, chaves administrativas ou service accounts em variáveis `VITE_*`.

## Instrumentação

- `src/main.tsx` inicializa o SDK antes de montar React.
- `src/lib/sentry.ts` inicializa SDK, Browser Tracing e sanitização.
- `src/App.tsx` envolve as rotas com `Sentry.ErrorBoundary`.
- `captureAppException` registra exceções com tags limitadas, sem anexar payloads.
- `captureLocalDeviceConnected` registra metadados básicos de conectividade do navegador; não são métricas físicas.
- `captureOverloadSimulation` envia métricas fictícias marcadas como `simulated: true`.
- `triggerTestErrorForAPM` bloqueia erros sintéticos em produção por padrão.

Sem DSN, o SDK fica desativado e o aplicativo continua funcionando.

## Privacidade

- `sendDefaultPii` permanece desativado.
- E-mail, IP, username e ID do usuário são removidos.
- Cookies, corpo da requisição e campos de ambiente são removidos.
- Cabeçalhos com authorization, cookie, token, secret, password e api-key são filtrados.
- Query string e fragmento das URLs são removidos.
- Não inclua dados pessoais, tokens ou payloads de clientes em tags/extras.

## Validação manual

1. Configure o DSN em preview/desenvolvimento.
2. Faça build e deploy.
3. Navegue pelas telas e provoque uma exceção controlada somente em desenvolvimento.
4. Confirme evento, ambiente e release no Sentry.
5. Revise o evento para garantir que não contenha dados pessoais ou segredos.

## Etapas futuras

Backend serverless e Collector Node ainda não usam o SDK Node. Exigem `@sentry/node`, DSN server-side, inicialização no bootstrap e testes próprios. Instrumentar aplicações dos clientes também é um produto separado: cada aplicação precisa de SDK/agente ou integração. O Sentry do WatchFlow não descobre automaticamente processos em máquinas remotas.
