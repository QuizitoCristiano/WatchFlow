# Sentry APM — configuração e validação

## Escopo desta etapa

Esta entrega instrumenta o frontend React do WatchFlow:
- captura de exceções JavaScript;
- Error Boundary para falhas de renderização React;
- Browser Tracing para navegação e performance;
- filtragem básica de dados sensíveis antes do envio;
- ambientes e versão configuráveis por variáveis de ambiente.

A integração **não** transforma o Sentry em agente de monitoramento de hosts. Node Exporter continua responsável por métricas de infraestrutura.

## Criar o projeto Sentry

1. Acesse https://sentry.io/ e entre na organização.
2. Crie um projeto com plataforma **React** e nome sugerido `watchflow-frontend`.
3. Copie o DSN do projeto (Client Key/DSN). O DSN é uma chave pública de ingestão, não é um token administrativo.
4. Configure no ambiente local e na hospedagem:
   - `VITE_SENTRY_DSN`: DSN do projeto React.
   - `VITE_APP_RELEASE`: versão/release, por exemplo `watchflow@1.0.0`.
   - `VITE_SENTRY_DEBUG=false` em produção.
   - `VITE_SENTRY_ALLOW_TEST_ERRORS=false` em produção.
5. Faça um novo deploy depois de configurar as variáveis. Variáveis `VITE_*` são incorporadas ao bundle durante o build.

Não coloque tokens de autenticação do Sentry, chaves administrativas ou service accounts em variáveis `VITE_*`.

## O que já está conectado

- `src/main.tsx` chama `initSentry()` antes de montar o React.
- `src/lib/sentry.ts` inicializa o SDK, Browser Tracing e sanitização.
- `src/App.tsx` usa `Sentry.ErrorBoundary` para capturar falhas de renderização.
- Sem DSN, o SDK fica desabilitado e a aplicação continua funcionando.

## Validação manual

1. Configure o DSN no ambiente de preview/desenvolvimento.
2. Faça build e deploy.
3. Acesse o WatchFlow e navegue por algumas páginas.
4. Em ambiente de desenvolvimento, invoque `triggerTestErrorForAPM()` temporariamente a partir de um botão de teste ou console de desenvolvimento.
5. No Sentry, confirme o evento com ambiente e release esperados.
6. Remova o gatilho de teste antes de produção e confirme que erros reais continuam sendo recebidos.

A ausência de eventos normalmente significa DSN incorreto, variável ausente no build ou bloqueio de rede/adblock.

## Privacidade

- `sendDefaultPii` permanece desativado.
- E-mail, IP e identificadores diretos de usuário são removidos do evento.
- Corpo da requisição, cookies e cabeçalhos sensíveis são filtrados.
- Não adicione tokens, payloads de autenticação, dados pessoais ou conteúdo de clientes em tags/extras.
- Revise a política de retenção e os controles de acesso do projeto Sentry.

## Próximas etapas — não incluídas nesta entrega

O backend serverless e o processo Node do Collector ainda precisam de projetos/DSNs próprios e SDK `@sentry/node`, inicialização no bootstrap correto, captura de exceções e tracing. A configuração de tracing distribuído entre navegador, API e Collector também exige propagação de trace headers e configuração CORS compatível.

A instrumentação de aplicações de clientes é outro recurso: cada aplicação monitorada precisa de SDK/agente ou uma integração que encaminhe seus eventos. O Sentry do próprio WatchFlow monitora o WatchFlow, não descobre automaticamente aplicações instaladas nos computadores.

## Referências

- https://docs.sentry.io/platforms/javascript/guides/react/
- https://docs.sentry.io/platforms/javascript/guides/node/
