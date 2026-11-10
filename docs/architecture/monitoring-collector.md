# Coletor Node Exporter

## Escopo implementado

O coletor Node.js opera em modo one-shot sem credenciais de ingestão ou modo contínuo autenticado. Consulta o Node Exporter da rede local, calcula CPU, memória, filesystems e rede e, no modo contínuo, envia amostras à API serverless da Vercel. A API grava em `users/{uid}/devices/{deviceId}/metrics/{sampleId}`, caminho lido pelo Dashboard. A execução real da API contra Firebase ainda depende da configuração server-side e não foi validada ponta a ponta neste workspace.

No ambiente de desenvolvimento registrado, a VM executa Debian GNU/Linux 13, com Node Exporter 1.9.0 observado em `http://192.168.1.2:9100/metrics`. A conectividade do Windows a esse endpoint foi validada. O IP é específico do ambiente local e pode mudar; não deve ser copiado como endereço fixo para outros ambientes. A porta 9100 não deve ser exposta publicamente.

## Fluxo de execução

1. `src/config.ts` valida `NODE_EXPORTER_URL`, o protocolo e os tempos configuráveis.
2. `src/collect.ts` solicita uma primeira amostra, espera o intervalo e solicita a segunda.
3. `src/http.ts` faz HTTP GET com timeout, rejeita redirecionamentos e limita a resposta.
4. `src/parser.ts` interpreta as linhas das métricas suportadas.
5. `src/metrics.ts` calcula CPU por deltas e memória pela amostra mais recente.
6. `src/ingest.ts` envia cada amostra com `sampleId` idempotente, até três tentativas e backoff de 500/1000 ms.
7. `src/cli.ts` repete a coleta no intervalo configurado e reporta falhas operacionais sem credenciais.
8. A API verifica o usuário no provisionamento, vincula token do coletor a uma integração/dispositivo, valida o envelope e persiste amostra + status em transação.

## Módulos reais

- `collector/src/config.ts`: valida URL, credenciais, timeout e intervalos.
- `collector/src/http.ts`: `fetchMetricsText`; usa `AbortSignal.timeout`, `redirect: 'error'`, valida status HTTP, decodifica UTF-8 estrito e limita o corpo a 5 MiB.
- `collector/src/parser.ts`: `MetricSample` e `parsePrometheusText`; interpreta CPU, memória, filesystem e contadores de rede Node Exporter.
- `collector/src/metrics.ts`: calcula CPU por delta, memória, filesystem válido sem duplicar dispositivos e taxas de rede por delta.
- `collector/src/collect.ts`: `collectMetrics`; coordena as duas amostras e permite injetar `fetcher` e espera entre amostras.
- `collector/src/ingest.ts`: timeout, bearer token, retry limitado e backoff.
- `collector/src/cli.ts`: one-shot sem token e modo contínuo com token.
- `api/collector/provision.ts`: endpoint com Firebase ID token, validação de propriedade, emissão/rotação de token de coletor.
- `api/collector/ingest.ts`: endpoint de ingestão com schema estrito, limite de 64 KiB e autenticação por dispositivo.
- `api/collector/_lib/firestoreRepository.ts`: transações de persistência no caminho atual do Dashboard e atualização de estado.
- `api/test/collector-api.test.ts` e `collector/test/collector.test.ts`: testes unitários com armazenamento em memória/fetch controlado; não usam Firebase Emulator.
- `collector/tsconfig.json`: configuração estrita de TypeScript para o coletor.
- `api/tsconfig.json`: verificação estrita dos endpoints Node/Vercel.

## Métricas e cálculos

### CPU

`node_cpu_seconds_total` é um contador cumulativo, não um percentual. O parser identifica os rótulos `cpu` e `mode` independentemente da ordem em que aparecem. O cálculo compara os contadores por CPU/modo em duas amostras, soma os deltas de tempo de todos os modos e subtrai o delta `idle`:

```text
CPU utilizada (%) = ((delta total - delta idle) / delta total) × 100
```

Os contadores `guest` e `guest_nice` são excluídos da soma porque são contabilizados também em `user` e `nice` no Linux. Ausência ou mudança de séries, falta de `idle`, contador reiniciado, delta inválido ou total sem progresso resultam em falha da coleta, não em percentual inventado.

### Memória

O cálculo usa exatamente uma amostra de cada métrica:

- `node_memory_MemTotal_bytes`: total de memória.
- `node_memory_MemAvailable_bytes`: memória disponível estimada pelo sistema.

```text
Memória utilizada (%) = ((MemTotal - MemAvailable) / MemTotal) × 100
```

`MemTotal` deve ser maior que zero e `MemAvailable` deve estar entre zero e o total. O resultado deve ser finito e estar entre 0 e 100.

### Sistemas de arquivos

O coletor associa `node_filesystem_size_bytes` e `node_filesystem_free_bytes` por dispositivo, tipo e ponto de montagem. Descarta pseudo-filesystems (como `tmpfs`, `proc`, `sysfs`, `overlay` e `squashfs`), erros sinalizados pelo exporter, tamanhos inválidos e pontos em `/proc`, `/sys`, `/dev` e `/run`. Quando um mesmo dispositivo aparece montado mais de uma vez, conta uma vez e prefere `/` ou o ponto de montagem mais curto. O uso é `(size - free) / size`; os valores permanecem por filesystem para evitar somar filesystem duplicado.

### Rede

`node_network_receive_bytes_total` e `node_network_transmit_bytes_total` são contadores acumulados, não taxas. O coletor exclui `lo` e calcula bytes/s pelo delta entre as amostras dividido pelo intervalo configurado. Também retorna os contadores acumulados da segunda amostra para diagnóstico. Interfaces novas ou com contador reiniciado são omitidas do delta daquele intervalo.

## Parser e limitações

O parser ignora comentários e linhas vazias, aceita rótulos entre chaves, escapes `\n`, `\"` e `\\`, valor numérico e timestamp opcional. O timestamp Prometheus é validado quanto ao formato numérico, mas não utilizado no cálculo. Métricas não suportadas são ignoradas; linhas malformadas das métricas suportadas, valores não finitos/negativos e séries duplicadas são rejeitados.

Não é um parser completo da especificação Prometheus. Não processa exemplars, metadados como dados, histogramas, summaries ou métricas de aplicação; não implementa outras fontes como Telegraf ou Zabbix.

## Configuração e comandos

`NODE_EXPORTER_URL` aceita uma URL HTTP ou HTTPS válida. Sem a variável, `collector/src/config.ts` usa `http://192.168.1.2:9100/metrics`, fallback local que pode não funcionar em outra rede. URLs com credenciais, parâmetros ou fragmento são rejeitadas. Timeout e intervalo também são configuráveis:

- `NODE_EXPORTER_TIMEOUT_MS`: padrão 5000 ms.
- `COLLECTOR_SAMPLE_INTERVAL_MS`: intervalo entre os dois scrapes; padrão 1000 ms.
- `COLLECTOR_INTERVAL_MS`: intervalo contínuo; padrão 60000 ms, mínimo 15000 ms.
- `WATCHFLOW_DEVICE_ID` e `WATCHFLOW_INTEGRATION_ID`: IDs gerados no provisionamento.
- `WATCHFLOW_INGEST_URL`: endpoint HTTPS `/api/collector/ingest` da Vercel (HTTP somente em localhost).
- `WATCHFLOW_INGEST_TOKEN`: token aleatório exibido uma vez, armazenado no backend como HMAC e expirado em 90 dias.

Configure no ambiente **server-side** da Vercel, sem prefixo `VITE_`:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON da service account Firebase com permissões mínimas necessárias para Auth e Firestore.
- `COLLECTOR_TOKEN_PEPPER`: segredo aleatório com no mínimo 32 caracteres para HMAC dos tokens.

A service account é usada apenas pelo Firebase Admin nas funções. Nunca a copie para o frontend, coletor, Git ou arquivos versionados. Mantenha o mesmo pepper durante a vida dos tokens; trocá-lo invalida todos e exige reprovisionamento. O endpoint de provisionamento valida o Firebase ID token e a propriedade do documento `users/{uid}/integrations/{integrationId}`.

Provisionar grava/rotaciona `collectorCredentials/{tokenHash}` e `collectorCredentialState/{uid}_{integrationId}`. Uma amostra válida cria/atualiza `users/{uid}/devices/{deviceId}`, grava `users/{uid}/devices/{deviceId}/metrics/{sampleId}` e atualiza o estado da integração. Erros de scrape atualizam somente o estado operacional. Nenhuma dessas escritas foi executada durante esta tarefa.

Na tela Integrações, a taxa de coleta é `sucessos ÷ tentativas` dos 24 buckets horários mais recentes (aproximadamente 24 horas); sem tentativas, é indisponível. O bucket horário é mantido pelo backend e atualizado a cada tentativa autenticada.

Cada amostra de métrica, credencial e vínculo de rotação recebe `expiresAt` em 90 dias. Habilite no Firebase Console políticas TTL com o campo `expiresAt` para os collection groups `metrics`, `collectorCredentials` e `collectorCredentialState`; sem TTL, a API não apaga esses documentos expirados. Não permita acesso direto de clientes aos collection groups de credenciais. O Dashboard separa amostras reais (`isDemoData: false`) das demonstrações e busca dados novamente a cada 60 segundos. O Admin SDK ignora Firestore Rules para escrever; as regras ainda precisam permitir ao cliente ler somente seus caminhos.

PowerShell:

```powershell
$env:NODE_EXPORTER_URL = "http://IP_DA_VM:9100/metrics"
$env:NODE_EXPORTER_TIMEOUT_MS = "5000"
$env:COLLECTOR_SAMPLE_INTERVAL_MS = "1000"
$env:WATCHFLOW_INTEGRATION_ID = "ID_EXIBIDO_NA_TELA"
$env:WATCHFLOW_DEVICE_ID = "DEVICE_ID_EXIBIDO_NA_TELA"
$env:WATCHFLOW_INGEST_URL = "https://SEU_APP.vercel.app/api/collector/ingest"
$env:WATCHFLOW_INGEST_TOKEN = "TOKEN_EXIBIDO_UMA_VEZ"
$env:COLLECTOR_INTERVAL_MS = "60000"
npm run collector:check
npm run collector:test
npm run api:check
npm run api:test
npm run collector:start
```

Execute o coletor em um host que acesse o Node Exporter pela rede privada e possa fazer saída HTTPS para a Vercel. Não exponha a porta 9100. Sem URL e token de ingestão, o comando permanece one-shot e não persiste. Para desenvolvimento da API, use Vercel CLI (`vercel dev`) com as variáveis server-side disponíveis localmente; `vite dev` sozinho não serve as rotas `/api`.

O coletor usa Node.js 22.6+ e `--experimental-strip-types`; no Node 22.17.1 isso emite `ExperimentalWarning`.

## Security by Design: controles implementados

- Validação da URL e restrição de protocolo a HTTP/HTTPS; rejeição de credenciais e fragmento.
- Timeout por requisição, rejeição de redirecionamentos e limite de resposta de 5 MiB.
- Decodificação UTF-8 estrita, validação do formato/valores e rejeição de amostras inconsistentes.
- Erros capturados como `unknown` e reduzidos a mensagens operacionais sem imprimir exceções externas ou payload integral.
- Nenhuma credencial Firebase/Admin no coletor; o token por dispositivo é revogável por rotação e expira em 90 dias.
- Idempotência por `sampleId`, limite de frequência no servidor e retries finitos.
- Payload e timestamp validados; amostras são marcadas como telemetria real e expiram após habilitar TTL.

O formulário da tela Integrações salva a configuração em `users/{uid}/integrations` como pendente; a ação de provisionamento exige Firebase ID token e verifica a propriedade antes de emitir uma credencial de dispositivo. O cadastro não verifica conectividade. Somente uma tentativa real do coletor, iniciada em host que alcança o Node Exporter local e a API HTTPS, pode atualizar o estado ou persistir métricas. O Vercel não precisa alcançar endereços privados como `192.168.1.2`. O código da API existe no workspace, mas deployment e execução contra Firebase ainda não foram validados; não exponha a porta 9100 nem copie credenciais administrativas para o frontend ou coletor.

## Riscos e decisões pendentes

A validação aceita qualquer destino HTTP(S) válido configurado localmente; não há allowlist de IP/hostname nem validação DNS. Não encaminhe endpoints definidos por usuários não confiáveis ao coletor; revise SSRF se a arquitetura mudar.

O Node Exporter entrega telemetria sem autenticação adicional por padrão. Mantenha a porta restrita à rede necessária; não a publique na Internet. O coletor inicia a conexão de saída com a API HTTPS; a Vercel não precisa alcançar o IP privado da VM.

O contrato implementado e a proposta anterior estão descritos em [metrics-data-contract.md](metrics-data-contract.md).

A comparação arquitetural anterior está em [metrics-ingestion-architecture.md](metrics-ingestion-architecture.md). Os endpoints estão no código, mas não foram publicados nem testados com Firebase real/Emulator.

## Validação reportada

Resultados anteriores em 2026-10-27 são históricos. Os testes atuais usam fakes e não demonstram uma gravação real no Firestore; consulte a entrega da etapa para os resultados efetivamente executados.