# Sentry observability — WatchFlow

## Escopo

O WatchFlow usa Sentry em dois runtimes independentes:

- **Frontend React:** exceções JavaScript, falhas de renderização, Browser Tracing e eventos operacionais.
- **API serverless Node.js:** exceções inesperadas nos endpoints do Collector, com tags do endpoint e sanitização de dados.

O Sentry monitora a aplicação WatchFlow. Ele não instala agentes em hosts, não coleta CPU/RAM/disco/GPU físicos e não substitui um coletor de infraestrutura.

## Variáveis de ambiente

Frontend (incluídas no bundle do navegador):
- `VITE_SENTRY_DSN`: DSN público do projeto React.
- `VITE_APP_RELEASE`: versão do frontend.
- `VITE_SENTRY_DEBUG=true`: diagnóstico local do SDK; desative fora do desenvolvimento.
- `VITE_SENTRY_ALLOW_TEST_ERRORS=false`: erros sintéticos permanecem bloqueados em produção.

Backend (somente runtime Node; nunca use prefixo `VITE_`):
- `SENTRY_DSN`: DSN do projeto Sentry destinado ao backend Node.
- `SENTRY_ENVIRONMENT`: ambiente, por exemplo `development`, `preview` ou `production`.
- `SENTRY_RELEASE`: release do backend.

O frontend e o backend podem usar projetos Sentry separados para facilitar filtros e alertas. Configure `SENTRY_DSN` localmente para o runtime que executa as funções API e no ambiente server-side da Vercel. Nunca coloque tokens administrativos, auth tokens ou service accounts em variáveis `VITE_*`.

O arquivo `.env.local` deve ficar na raiz e permanecer fora do Git. O `.gitignore` do projeto já ignora `.env.*`.

## Frontend

- `src/main.tsx` inicializa o SDK antes de montar React.
- `src/lib/sentry.ts` inicializa SDK, Browser Tracing e sanitização.
- `src/App.tsx` envolve as rotas com `Sentry.ErrorBoundary`.
- `captureAppException` registra exceções operacionais com tags permitidas.
- `captureLocalDeviceConnected` registra metadados de conectividade do navegador; não são métricas físicas.
- `captureOverloadSimulation` envia métricas fictícias marcadas como `simulated: true`.
- `triggerTestErrorForAPM` bloqueia erros sintéticos em produção por padrão.

## API serverless

- `api/collector/_lib/sentry.ts` inicializa `@sentry/node` uma vez por instância.
- `api/collector/provision.ts` e `api/collector/ingest.ts` capturam apenas falhas inesperadas.
- Erros operacionais esperados (`HttpError`, como 400/401/405) não são enviados como exceções.
- A função aguarda `Sentry.flush` antes de concluir a resposta serverless, reduzindo perda de eventos em ambientes efêmeros.


## Teste real do backend (somente desenvolvimento local)

A rota `POST /api/observability/sentry-test` confirma o envio do runtime Node sem depender das credenciais Firebase do Collector. Ela só responde fora de produção e exige `SENTRY_TEST_TOKEN` com pelo menos 32 caracteres. Sem token ou em `NODE_ENV=production`, responde 404. Nunca configure esse token na Vercel Production.

1. Gere um token local com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
2. Adicione `SENTRY_TEST_TOKEN=<token>` ao `.env.local`, junto de `SENTRY_DSN`.
3. Inicie o runtime das funções com `npx vercel dev`. Apenas `vite dev` não executa as funções API.
4. Em outro PowerShell, defina `$env:SENTRY_TEST_TOKEN` com o mesmo valor local e execute:

   ```powershell
   Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/observability/sentry-test -Headers @{ Authorization = "Bearer $env:SENTRY_TEST_TOKEN" }
   ```

5. A resposta esperada é HTTP 202. No Sentry, procure a exceção `WatchFlow Sentry backend self-test: controlled non-production event`, com `runtime=vercel-serverless` e `endpoint=observability.self-test`.
6. Depois do teste, remova `SENTRY_TEST_TOKEN` do `.env.local`.

A rota não executa operações no Firebase nem aceita payload do cliente. Ela existe exclusivamente para o smoke test local do Sentry Node.

## Privacidade

- O SDK não habilita envio automático de PII; a configuração não ativa `sendDefaultPii`.
- E-mail, IP, username e ID do usuário são removidos.
- Cookies, corpo da requisição e campos de ambiente são removidos.
- Cabeçalhos com authorization, cookie, token, secret, password e api-key são filtrados.
- Query string e fragmento das URLs são removidos.
- Não inclua dados pessoais, tokens ou payloads de clientes em tags/extras.

## Validação local

1. Confirme que o arquivo se chama exatamente `.env.local` e está na raiz.
2. Para o frontend, configure `VITE_SENTRY_DSN`.
3. Para a API Node, configure também `SENTRY_DSN` no ambiente do runtime serverless local.
4. Instale as dependências e atualize o lockfile com `npm install`.
5. Execute lint, testes e build.
6. Provoque uma exceção controlada apenas em desenvolvimento.
7. Confirme no Sentry o evento, ambiente, release e runtime.
8. Revise os eventos recebidos para confirmar que não contêm dados pessoais ou segredos.

A execução com `vite dev` serve para validar o frontend. Para testar as funções serverless localmente, use o runtime local compatível com Vercel (`vercel dev`) e confirme que ele carrega as variáveis server-side. A disponibilidade de DSN não comprova, sozinha, o recebimento do evento.
