# WF-MON-001.3B — Arquitetura de ingestão e persistência

> **Status:** documento histórico de análise. A opção Vercel Functions foi implementada no workspace em `api/collector/`, com autenticação por token de dispositivo e persistência no caminho existente do Dashboard. Não foi feito deploy nem teste com Firebase real; ver [monitoring-collector.md](monitoring-collector.md) para o estado atual.

## 1. Objetivo e escopo

Definir um caminho seguro para levar amostras produzidas pelo coletor local ao armazenamento e, futuramente, ao Dashboard. Esta etapa é documental. Não altera código, dependências, autenticação existente, Firebase, regras, índices, Vercel ou infraestrutura.

O resultado é uma preferência provisória condicionada a verificações de plataforma e aprovação. Não equivale a uma decisão formal da equipe nem a uma integração já implantada.

## 2. Estado atual confirmado

| Área | Evidência atual | Estado |
|---|---|---|
| Frontend | `package.json` declara React, TypeScript, Vite e Firebase SDK. `src/services/config.tsx` inicializa Auth, Firestore, Storage e Analytics no cliente. | Implementado no frontend. |
| Deploy web | `vercel.json` contém apenas rewrite geral para `/index.html`; não define rotas de API, runtime, variáveis de função ou limites. | Configuração SPA presente. O projeto/conta e plano Vercel não foram inspecionados remotamente. |
| Coletor | `collector/src/config.ts`, `http.ts`, `parser.ts`, `metrics.ts`, `collect.ts` e `cli.ts` executam coleta manual one-shot e exibem CPU/memória. | Implementado localmente; sem envio, credencial de máquina, agendamento ou persistência. |
| Firestore | Os serviços cliente usam documentos de perfil, `users/{uid}/integrations`, `users/{uid}/devices` e a coleção raiz `alerts`. | Leituras/escritas cliente existentes em algumas áreas; não são ingestão de métricas. |
| Backend | Não foram encontrados `firebase-admin`, Functions, Fastify/Express, API server, Cloud Run, worker ou arquivos `api/` no repositório. | Não encontrado no código/configuração versionados. |
| Regras e índices | A busca no workspace não encontrou `firestore.rules`, `firebase.json` ou `firestore.indexes.json`. | Não versionados aqui; as regras implantadas e o projeto Firebase real são desconhecidos. |
| Validação runtime | Zod está em `package.json` e é usado em schemas de autenticação em `src/auth/LogSchema.tsx`. Não foi encontrado schema Zod para métricas. | Biblioteca disponível; validação de ingestão ausente. |
| Dashboard | Consulta dispositivos em `users/{uid}/devices`, métricas em `users/{uid}/devices/{deviceId}/metrics` e alertas em `alerts` filtrados por `userId`. Há seed manual e idempotente de demonstração; o coletor não persiste nesse fluxo. | Consome documentos Firestore existentes; sem ingestão automática do coletor. |
| Contrato | `docs/architecture/metrics-data-contract.md` propõe envelope e caminhos; `src/types/index.ts` tem `MetricPayload` com campos/units distintos e comentário de caminho diferente do serviço. | Proposta e tipo atual não estão alinhados; requer aprovação antes de persistir. |

O contexto fornecido informa frontend hospedado na Vercel, Debian local e endpoint `http://192.168.1.2:9100/metrics`; o repositório não contém prova de implantação ativa nem validação de conectividade realizada nesta etapa. O desenvolvedor relata ter observado Vercel Hobby em conta pessoal, sem cobrança ativa e região `iad1`; Firebase Spark, Firestore `nam5`, coleção `users` existente e quotas no painel. São observações fornecidas, não verificadas independentemente contra os termos atuais. Os números exatos de invocações/duração/transferência e quotas Firebase não foram incluídos. Não fiz chamadas ao endpoint, à Vercel ou ao Firebase.

## 3. Identidades e princípios de segurança

Há quatro identidades diferentes, que não devem ser confundidas:

| Identidade | Uso | Fonte confiável proposta |
|---|---|---|
| Usuário do WatchFlow | Entrar no frontend, cadastrar/administrar máquinas e consultar métricas próprias/autorizadas. | Firebase Auth ID token validado pelo backend nas operações de cadastro; para leitura direta do cliente, Firebase Auth mais regras Firestore efetivas. |
| Máquina monitorada | Identificar qual host produziu a amostra. | Registro de máquina criado/autorizado previamente; `machineId` sozinho não é credencial. |
| Coletor | Processo local que lê Node Exporter e envia uma amostra. | Credencial individual vinculada no servidor a exatamente uma máquina. |
| Serviço de ingestão | Receber, autenticar, autorizar, validar e persistir. | Identidade de runtime/IAM do serviço para acesso ao Firestore; não vem do corpo HTTP. |

O backend determina o proprietário consultando o registro confiável da credencial/máquina. Não aceita `userId`, email, IP, hostname ou `machineId` do corpo como autorização. A credencial do serviço Firebase/Admin nunca fica no frontend ou no coletor.

### Registro, associação e ciclo de credenciais

Fluxo proposto para aprovação:

1. Usuário autenticado solicita cadastrar uma máquina por uma operação protegida; o backend verifica o Firebase ID token e cria o vínculo `ownerUid` + ID interno da máquina.
2. O servidor emite uma credencial exclusiva para aquela máquina por um fluxo de enrollment controlado. A associação não é escolhida pelo coletor durante o envio.
3. O coletor mantém a credencial fora do Git e de arquivos versionados, preferencialmente no armazenamento protegido do sistema operacional. Tokens não são impressos em logs nem enviados em query string.
4. Cada envio usa HTTPS e a credencial de máquina. O backend identifica a credencial, resolve a máquina e o proprietário e compara qualquer `machineId` do payload com o vínculo registrado.
5. Rotação revoga a credencial antiga e cria outra para a mesma máquina. Comprometimento permite revogar apenas a credencial/máquina afetada; não há chave compartilhada entre hosts.

Para o coletor manual atual, uma credencial aleatória por máquina, armazenando no servidor somente seu hash e com escopo de ingestão para aquela máquina, é a opção simples a avaliar. Sua emissão, validade, armazenamento local, algoritmo de hash, comparação segura e rotação precisam de desenho/implementação revisados. Token de curta duração é desejável se houver enrollment/renovação seguros; caso contrário, um segredo longo individual e revogável pode ser mais operável que uma renovação insegura. mTLS ou credenciais de workload são alternativas se a infraestrutura escolhida suportar provisionamento e renovação sem distribuir segredos privilegiados.

Firebase ID token identifica usuário, não uma máquina sempre ativa. Firebase Admin/service account identifica o serviço perante Google Cloud, não o coletor. São autenticações distintas.

## 4. Alternativas de ingestão

| Alternativa | Compatibilidade e segurança | Operação, testes e limites | Avaliação para o estado atual |
|---|---|---|---|
| **A. Vercel Node.js Function** | A Vercel já hospeda o frontend segundo o contexto do projeto, mas `vercel.json` só contém rewrite SPA. Uma função HTTPS pode receber conexão iniciada pelo coletor local; não precisa alcançar o IP privado da VM. A função deve autenticar a credencial exclusiva da máquina e resolver ownership no registro confiável. Firebase Admin só pode rodar no ambiente servidor. Preferir identidade federada/workload se disponível; se não, credencial de service account apenas em variável/secret server-side protegida, nunca `VITE_*`, com permissões mínimas e rotação. Admin SDK ignora Firestore Rules. | Reaproveita a hospedagem existente e evita introduzir outro serviço de execução. Porém o rewrite geral pode afetar roteamento `/api`; precedência deve ser testada. Runtime Node, duração, request size, região, concorrência, variáveis secretas, rate limiting, quotas e custo dependem da configuração/plano atual, não verificados no repositório. | **Preferência provisória da primeira versão**, por menor infraestrutura adicional. Só confirmar se o plano disponível inclui funções e segredos adequados, os limites cobrem o fluxo síncrono e o custo incremental total cabe no orçamento aprovado. Não há evidência de que seja gratuita ou esteja configurada. |
| **B. Serviço dedicado Node.js/Fastify** | Fronteira de API explícita e controle de autenticação, validação e regras de negócio. Precisa implementar autorização de máquina/proprietário; acesso administrativo ao Firestore também ignora Rules. | Boa testabilidade por handlers/adapters, mas adiciona runtime/deploy, domínio/TLS, disponibilidade, logs/alertas, patches, scaling e gestão de segredos. Custos dependem do host e do modo always-on/scale-to-zero. | Alternativa futura, não dependência inicial. Justifica-se se houver requisitos concretos de runtime persistente, controle de rede, múltiplas APIs ou limites incompatíveis com functions. Fastify pode ser hospedado em Cloud Run, portanto framework e plataforma são eixos diferentes. |
| **C. Firebase Cloud Functions / Google Cloud Run** | HTTPS pode receber envio externo e identidade de runtime GCP pode acessar Firestore sem distribuir chave privada ao coletor/frontend. Identidade e revogação da máquina continuam sendo responsabilidade da aplicação. IAM e Secret Manager devem ser mínimos; Admin SDK não é limitado por Firestore Rules. | Exigem projeto, billing/configuração, IAM, região, acesso de deploy e operação GCP que não aparecem no repositório. Functions pode atender handler curto; Cloud Run oferece controle de container e pode hospedar Fastify, com maior configuração. Quotas, duração, request size, concurrency e custo dependem da opção/plano/uso. | **Alternativas futuras; não são dependências da primeira versão.** Reavaliar apenas se Vercel não atender runtime, segurança, limites ou orçamento. Não habilitar nem configurar por esta decisão documental. |

### Recomendação e critérios para confirmação

Considerando a restrição de não depender de custos que o desenvolvedor não possa assumir, a preferência de planejamento para a primeira versão passa a ser **uma Vercel Node.js Function HTTPS**, pois a Vercel já é a hospedagem existente segundo o contexto e isso evita introduzir outro serviço de hospedagem. A função não alcança o Node Exporter privado: o coletor local inicia uma conexão de saída para o endpoint HTTPS. O endpoint deve exigir autenticação de máquina e autorização antes de qualquer escrita.

Esta preferência é **provisória, não aprovada, e não presume operação gratuita**. Confirmar todos os itens abaixo antes de implementação:

1. A conta/projeto Vercel efetivamente usado permite Node.js Functions e disponibiliza HTTPS público para o coletor.
2. O runtime e o mecanismo de deploy aceitam a versão do Node e o uso server-side de Firebase Admin SDK necessários, sem bundling de credenciais no frontend.
3. O rewrite geral em `vercel.json` não captura ou substitui a rota `/api`; provar a precedência com uma implantação de teste quando autorizada.
4. Verificar no plano atual duração máxima da função, cold start, request body size, região, concorrência, limites de execução/invocações, tráfego e rate limiting. O tempo de autenticação, validação e gravação deve caber no limite com margem.
5. Confirmar se variáveis secretas server-side estão disponíveis e protegidas no plano e em todos os ambientes; verificar rotação. Nunca colocar service account, private key ou credencial de máquina em variável `VITE_*`, arquivo versionado ou resposta de build.
6. Confirmar como a função obterá identidade para Firestore: preferir identidade federada suportada pela plataforma; se não existir, avaliar chave de service account exclusivamente em secret store, com papel mínimo que permita a operação e rotação. Não assumir que Vercel fornece identidade GCP sem chave.
7. Calcular o custo/quotas do plano Vercel e do Firestore para número de máquinas, frequência, amostras, retenção, leituras e índices esperados. A opção só é viável se o uso couber nas franquias verificadas ou em orçamento explicitamente aprovado, com margem para abuso e crescimento.
8. Definir proteção contra abuso (rate limit por identidade de máquina, limites de corpo e quotas). Se o plano não oferecer mecanismo suficiente, selecionar alternativa antes de expor a rota.

Se qualquer pré-requisito falhar, não ativar a ingestão nessa plataforma. Cloud Functions/Cloud Run ou serviço Fastify continuam opções futuras a comparar sob o mesmo teto de custo, mas não são dependências da primeira versão nem devem ser habilitadas por esta decisão. Nenhuma alternativa permite declarar custo zero com a informação atual. Jira não está disponível nesta sessão; nenhuma tarefa foi criada ou consultada.

## 5. Fluxo proposto ponta a ponta

O Node Exporter continua servindo `/metrics` apenas na rede local apropriada ao coletor. No cenário proposto, o agente coleta uma amostra local por máquina a cada 60 segundos, calcula CPU/RAM, mantém o `sampleId` por amostra e envia, a cada cinco minutos, um lote por máquina com cinco amostras daquela máquina. O formato definitivo do envelope de lote continua pendente; cada amostra mantém identidade/idempotência própria. Essa coleta contínua, buffer e envio são futuros; o coletor atual é one-shot e não tem upload.

```mermaid
sequenceDiagram
  autonumber
  participant VM as VM Debian / Node Exporter
  participant C as Coletor local
  participant API as Vercel Function candidata (planejada)
  participant REG as Registro de credenciais/máquinas
  participant APP as Caso de uso de ingestão
  participant FS as Firestore
  participant U as Usuário autenticado
  participant UI as Frontend / Dashboard

  rect rgb(232, 246, 236)
    Note over VM,C: Atual: scrape local e cálculo; sem upload
    C->>VM: GET /metrics (duas amostras para CPU)
    VM-->>C: Exposição Prometheus
    C->>C: Parse + cálculo CPU/RAM
    C-->>C: Exibe indicadores no terminal
  end

  rect rgb(255, 246, 220)
    Note over C,FS: Planejado: toda a ingestão abaixo ainda não existe
    C->>API: HTTPS + credencial individual + lote de cinco amostras
    API->>API: Limite de corpo e autenticação da máquina
    API->>REG: Resolver credencial, machineId e ownerUid
    REG-->>API: Vínculo ativo autorizado
    API->>API: Validar máquina, schema, métricas e timestamp de cada amostra
    API->>APP: Amostra normalizada + identidade confiável
    APP->>APP: Regras de domínio e chave idempotente
    APP->>FS: Criar amostra + persistedAt do servidor
    FS-->>APP: Resultado da gravação/duplicata
    APP-->>API: Resultado sem detalhes internos
    API-->>C: 2xx/erro operacional sem segredo
  end

  rect rgb(235, 241, 252)
    Note over U,FS: Leitura futura: exigir Rules efetivas ou API autorizada
    U->>UI: Firebase Auth
    UI->>FS: Consulta por máquina e intervalo
    FS-->>UI: Somente dados permitidos por regras testadas
  end
```

Se o backend usar Firebase Admin/SDK administrativo, as regras Firestore não validam a escrita dessa função: a autorização de máquina/proprietário precisa ocorrer no caso de uso antes de chamar o repositório. Para leitura direta do frontend, as regras Firestore são uma fronteira independente, obrigatória e ainda não verificada. Alertas críticos podem usar uma via de envio imediata separada do lote de cinco minutos, desde que também autenticada, idempotente e dimensionada; essa via acrescenta invocações e gravações.

## 6. Modelo de persistência Firestore

As duas estruturas seguintes são conceituais; nenhuma foi implementada. Ambas devem usar o envelope aprovado, timestamp `collectedAt`, `persistedAt` gerado pelo servidor e a chave idempotente.

### A — Métricas como subcoleção do dispositivo

```text
users/{uid}/devices/{deviceId}
users/{uid}/devices/{deviceId}/metrics/{sampleId}
```

Mantém `users` como raiz existente e aninha amostras ao documento de dispositivo. **Consultas:** intervalo de um dispositivo é direto; consultas de todas as máquinas podem exigir várias consultas ou `collectionGroup`, índice e estratégia de ownership testados.

**Autorização:** o caminho ajuda a expressar ownership do usuário, mas não autentica o coletor. Rules precisam cobrir explicitamente o caminho das métricas e conferir `request.auth.uid == uid`; elas não são herdadas automaticamente pelo fato de existir uma regra para `users/{uid}/devices/{deviceId}`. Alternativamente, um wildcard recursivo deliberado deve ser revisado/testado. Backend continua obrigado a validar associação antes de Admin write. Firestore não remove automaticamente subcoleções ao excluir documento pai.

**Compatibilidade e consequências:** reaproveita o caminho confirmado `users/{uid}/devices` e evita criar um registro paralelo `machines`. Exige decidir se `deviceId` é a identidade estável da máquina e alinhar o comentário divergente de `MetricPayload` antes de persistir.

### B — Coleção `metrics` por usuário, com referência ao dispositivo

```text
users/{uid}/devices/{deviceId}
users/{uid}/metrics/{sampleId}  // documento inclui deviceId
```

Mantém os dispositivos atuais e coloca as amostras diretamente sob `users/{uid}/metrics`, referenciando `deviceId`. **Consultas:** histórico do usuário pode usar uma consulta paginada; filtro de `deviceId` + intervalo de `collectedAt` pode exigir índice composto. Consultas globais entre usuários continuam exigindo caminho/serviço administrativo separado.

**Autorização:** Rules podem ser escopadas diretamente a `users/{uid}/metrics`, mas devem validar que `deviceId` pertence ao mesmo UID. O backend também valida o vínculo antes de escrever. O dado de usuário/dispositivo não vem como autoridade do corpo.

**Compatibilidade e consequências:** preserva a coleção raiz `users` e evita subcoleção profunda por dispositivo, mas duplica a associação ao dispositivo em cada amostra e pode criar inconsistência se dispositivo mudar/excluir. Requer índice, paginação e comportamento de exclusão/retention definidos.

### Alternativas e decisão pendente

Ambas as opções preservam a coleção `users` existente, segundo observação do desenvolvedor, mas nenhuma está implementada ou aprovada. Não escolher o modelo definitivo nesta etapa. A Opção A favorece a leitura de histórico por máquina; a Opção B pode facilitar uma lista paginada de métricas por usuário, com `deviceId` em cada amostra. Antes da escolha, confirmar que o documento de dispositivo é o registro de máquina confiável, padrões de consulta do Dashboard, Rules, índices, retenção e custo.

Ambas exigem Rules aplicáveis a cada caminho. Firestore Rules não são herdadas automaticamente pelas subcoleções: cada subcoleção precisa de uma regra `match` que cubra seu caminho ou de uma regra recursiva intencional e testada. Regras não filtram resultados de consultas; as queries devem obedecer às regras. Se a função usar Firebase Admin SDK, esse SDK pode ignorar as Rules do cliente: autenticação do agente, associação máquina-proprietário e autorização devem acontecer na API antes da escrita. Índices, paginação por `collectedAt` e retenção precisam ser definidos após validar consultas reais. Custos dependem de gravações, leituras, índices, região e retenção; não há estimativa final sem volume e quotas atuais.

## 7. Contrato e validação de entrada

Usar como base o envelope `schemaVersion`, `sampleId`, `machineId`, `collectedAt` e `metrics.cpu/memory` de [metrics-data-contract.md](metrics-data-contract.md), após aprovar os nomes e alinhar o tipo frontend. O envelope do coletor e o documento persistido não são idênticos: servidor acrescenta `ownerUid` resolvido e `persistedAt`; estes campos não são aceitos de remetente.

Antes de qualquer gravação, validar na ordem:

1. Limite de bytes do body antes do parse JSON; conteúdo JSON válido e número máximo de amostras (proposta para este cenário: até cinco amostras de uma máquina por lote, ainda a validar contra o limite real da Function).
2. Autenticação de máquina e estado ativo da credencial antes de confiar em identidade do payload.
3. `machineId` permitido, ativo, associado à credencial e ao owner do registro; se também vier no corpo, igualdade exata.
4. `schemaVersion` reconhecida, formato estrito e política explícita para propriedades extras (proposta: rejeitar extras para essa versão).
5. `sampleId` no formato aprovado; timestamp `collectedAt` parseável em UTC e dentro da janela aprovada contra relógio do servidor.
6. CPU número finito em `[0,100]`; memória com bytes inteiros finitos/seguros, `totalBytes > 0`, `availableBytes` em `[0,totalBytes]`, percentual recalculado no servidor e arredondamento/tolerância aprovados.
7. Apenas então construir registro normalizado e chamar persistência. Qualquer falha rejeita a amostra inteira; não converter ausentes em zero nem gravar parcialmente.

Não aceitar campos pessoais, tokens, URLs de endpoint, dados de processo ou detalhes de host que não tenham finalidade aprovada. Erros externos não devem devolver token, corpo, stack ou dados internos. Zod já está instalado e é usado em `src/auth/LogSchema.tsx`; recomendação é reutilizar a mesma biblioteca na borda HTTP se compatível com o runtime escolhido, em modo estrito. Isso não significa que o payload de métricas já esteja validado.

`collectedAt` vem do coletor e sofre política de tolerância de clock; `persistedAt` deve ser criado pelo servidor/Firestore no commit e nunca aceito do cliente. Um eventual `receivedAt` só é necessário se processamento assíncrono futuro exigir distinguir recebimento de gravação.

## 8. Idempotência, erros e retries

O coletor deve gerar `sampleId` uma vez ao formar a amostra lógica e reutilizá-lo no retry. A chave é `(machineId autenticado, sampleId)`, não apenas o ID declarado. O caso de uso valida e normaliza antes de escrever; gravação condicional/transação cria somente se não existir.

- Mesmo ID e conteúdo normalizado igual: resposta idempotente de sucesso, sem segundo documento.
- Mesmo ID e conteúdo diferente: conflito, sem sobrescrita silenciosa.
- Credencial/owner inválido, versão/campos/dados inválidos: erro permanente; não repetir até corrigir configuração/payload.
- Timeout, indisponibilidade temporária ou erro transitório de serviço: retry limitado no coletor, com backoff exponencial, jitter e respeito a `Retry-After` quando fornecido.
- Evitar retry ilimitado e execução concorrente da mesma amostra. O coletor atual é manual e não implementa envio/retry; não exige fila para o MVP.

Status HTTP exatos, limites de tentativas, tempo máximo total e comportamento idempotente precisam de acordo no desenho da API. Logs registram resultado, latência e classe de falha sem token/payload; métricas operacionais mínimas incluem requests aceitos/rejeitados, duplicatas, latência e falhas de persistência.

## 9. Regras Firestore e isolamento de contas

Não há `firestore.rules`, `firebase.json` ou índices versionados nesta cópia do repositório. Não é possível afirmar quais regras estão implantadas. Antes de implementação/leitura real, recuperar e revisar regras efetivas, colocá-las sob versionamento e cobrir com testes (por exemplo, Firebase Emulator Suite se aprovado/configurado).

- **Rules do cliente:** avaliam operações do Firebase SDK cliente conforme `request.auth`, caminhos e campos. Devem limitar usuário a máquinas/amostras autorizadas, proibir escrita direta do cliente nas amostras e impedir spoof de ownership/status.
- **Autorização no backend:** API pública autentica a máquina e consulta associação confiável. Admin SDK ignora Firestore Rules; caminho sob `users/{uid}` não substitui verificação no servidor.
- **IAM do serviço:** service account do runtime autoriza o serviço a chamar Firestore/Secret Manager. Permissões administrativas não pertencem ao usuário, frontend ou coletor. Definir identidade dedicada e menor papel que a plataforma suportar; validar escopo real porque permissões Firestore IAM podem ser mais amplas que um documento/usuário.
- **Leitura do Dashboard:** manter consulta direta cliente somente se Rules efetivas comprovarem propriedade e papéis; caso contrário, considerar API de leitura autorizada. A query filtrada no cliente não é controle de segurança.

O serviço que escreve e o usuário que consulta são principais diferentes. Testar usuário A/B, máquina revogada, owner divergente, amostra de outra máquina, usuário sem acesso, escrita direta e consultas collection group.

## 10. Operação, limites e custos

O cenário de dimensionamento proposto para avaliação é de cinco máquinas simultâneas, coleta local por máquina a cada 60 s, envio de um lote por máquina a cada cinco minutos com cinco amostras e retenção histórica pretendida de sete dias. É uma hipótese de planejamento, não configuração aprovada nem implementada. Os valores antigos de frequência de 15 s e retenção de 30 dias eram propostas anteriores e não são os parâmetros usados neste cenário.

| Volume do cenário | Cálculo | Estimativa |
|---|---|---:|
| Amostras por máquina/dia | 86.400 ÷ 60 | 1.440 |
| Amostras/documentos de amostra para cinco máquinas/dia | 1.440 × 5 | 7.200 |
| Amostras/documentos criados em 30 dias | 7.200 × 30 | 216.000 |
| Documentos de amostra após estabilizar retenção de sete dias | 7.200 × 7 | 50.400 |
| Requisições por máquina/dia com batch a cada cinco minutos | 1.440 ÷ 5 | 288 |
| Requisições para cinco máquinas/dia | 288 × 5 | 1.440 |
| Invocações em 30 dias com batch | 1.440 × 30 | 43.200 |
| Invocações em 30 dias enviando cada amostra individualmente | 7.200 × 30 | 216.000 |

O desenvolvedor relata Vercel Hobby pessoal, sem cobrança ativa, com limite de 100.000 invocações, e Firebase Spark com quota de 20.000 gravações/dia. Esses números são relatos do painel, não limites verificados independentemente; confirmar período, escopo, uso e termos oficiais. Se 100.000 for limite mensal aplicável à Function, enviar individualmente a cada minuto resultaria em 216.000 e excederia o número relatado em 116.000 (2,16×). Lote por máquina a cada cinco minutos resultaria em 43.200, 43,2% do número relatado, antes de chamadas adicionais como alertas, enrollment, health checks e retries.

As 7.200 gravações de amostras/dia seriam 36% da quota de 20.000 gravações/dia relatada, com 12.800 de margem aritmética antes de outras gravações. Alertas persistidos e outros documentos/updates consomem gravações adicionais. Cinco documentos enviados em uma requisição continuam representando cinco escritas; batching reduz chamadas à API, não transforma automaticamente cinco gravações Firestore em uma gravação faturável.

Os 50.400 documentos representam estoque teórico estável depois de sete dias, supondo operação contínua e um documento por amostra. Retenção de sete dias exige mecanismo efetivo de expiração/limpeza, ainda não confirmado; não presumir exclusão automática. Esse estoque exclui alertas e outros documentos. Não estimar leituras, bytes armazenados ou preço: faltam frequência de consultas, usuários ativos, tamanho médio real dos documentos e lotes, índices, retenção/exclusões e dados oficiais de custo.

Alertas críticos podem usar uma via imediata mais rápida que o lote periódico de cinco minutos. Essa via requer autenticação/autorização idênticas e acrescenta invocações e gravações próprias; dimensionar separadamente. O coletor atual é one-shot manual: coleta contínua a cada minuto e buffer de cinco amostras ainda exigem mudança futura, tratamento de reinício/perda do buffer e prevenção de sobreposição. No MVP futuro, preferir uma Function síncrona se os limites confirmados permitirem; fila não é pressuposta.

Consultas do Dashboard devem ser filtradas por máquina/intervalo, ordenadas por `collectedAt`, limitadas e paginadas com cursor; evitar carregar histórico completo e consultas N+1 para muitos devices. Definir índices por query. A exclusão de um documento pai não remove automaticamente subcoleções; retention deve cobrir explicitamente esse comportamento.

## 11. Riscos e mitigações

| Risco | Mitigação necessária |
|---|---|
| Usuário ou máquina falsificados pelo corpo | Resolver owner/machine exclusivamente pela credencial autenticada e registro; comparar IDs do payload; negar por padrão. |
| Token de máquina comprometido | Credencial individual e revogável, armazenada protegida no host; hash no registro servidor; rotação por máquina e logs sem segredo. |
| Privilégio Admin excessivo | Identidade de runtime dedicada, menor papel disponível, sem credencial no cliente/coletor; revisão IAM; autorização de domínio antes de Admin writes. |
| Leitura cruzada por regras ausentes ou incorretas | Versionar regras/índices, emulador e testes negativos entre usuários antes de ativar consultas. |
| Vercel sem função/secret/limite compatível ou custo além do teto | Confirmar plano, runtime Node, rota `/api`, request/timeout/concurrency, secret store, rate limit e quotas; escolher alternativa somente após comparar custo real. Node Exporter continua privado. |
| Payload grande, relógio incorreto ou valores fabricados | Limite de body, validação runtime estrita, regras temporais e recálculo de memória; rejeitar amostra inteira. |
| Duplicidade e corrida em retry | Chave composta autenticada + `sampleId`, criação condicional/transação e conflito para conteúdo divergente. |
| Custos e retenção imprevisíveis | Dimensionar por máquina/frequência, paginar, índices mínimos, quota/alerta de custo e retenção aprovada. |
| Divergência de schema/path com frontend | Aprovar contrato e mapeamento `devices`/`machines` antes de migration; testes de integração e compatibilidade de versão. |

## 12. Decisões

### Confirmadas pelo repositório/contexto

- Coletor local manual one-shot consulta Node Exporter e imprime CPU/memória; não envia nem persiste.
- Frontend usa Firebase Auth/Firestore pelo SDK cliente e a Vercel tem configuração SPA rewrite versionada.
- Não foram encontrados Functions, Admin SDK, Fastify, API server, regras ou índices Firestore versionados.
- O tipo `MetricPayload` prevê campos e caminho diferentes dos consumidos hoje pelo serviço de dispositivos/Dashboard.

### Recomendação provisória para revisão

- Avaliar primeiro uma Vercel Node.js Function HTTPS para reaproveitar a hospedagem existente e evitar outro serviço; confirmar plano, runtime, rota, segredos, autenticação, rate limit, limites e custo total antes de aprovar. Isso não significa que a Function já exista ou seja gratuita.
- Não depender de Cloud Functions/Cloud Run na primeira versão. Mantê-los como alternativas futuras se Vercel não atender segurança, runtime, limites ou orçamento. Não criar Fastify autogerenciado para uma única rota sem necessidade adicional.
- Se usar Firebase Admin SDK, executá-lo exclusivamente no runtime servidor. Preferir credenciais federadas se comprovadamente suportadas; caso contrário, segredo server-side protegido e rotacionável, com permissões mínimas. A função autentica a máquina e determina proprietário pelo registro confiável antes de persistir; Admin SDK não é protegido por Firestore Rules.
- Separar autenticação de usuário, credencial de máquina e identidade IAM do serviço.
- Preferir ownership sob hierarquia de usuário, adaptando ao caminho existente `/devices` se `deviceId` for a identidade da máquina; manter decisão pendente de revisão.
- Validar com Zod na borda, idempotência composta e leitura cliente somente depois de Rules testadas.

### Aprovações necessárias

1. Qual projeto/conta e plano Vercel são usados, qual runtime Node é suportado e quais são limites atuais de execução, request size, região, concorrência, segredo, rate limiting e invocações?
2. O custo incremental da Vercel e do Firestore cabe no limite que o desenvolvedor pode assumir, considerando frequência, número de máquinas, leituras, writes, índices e retenção? Quais franquias, alertas e teto de uso serão adotados?
3. A rota `/api` pode coexistir com o rewrite atual? Que teste de deploy pode confirmá-lo sem expor o Node Exporter?
4. Qual identidade server-side dará acesso ao Firestore: workload federation comprovadamente disponível ou chave protegida no secret store? Qual privilégio mínimo é possível?
5. Se os itens acima não forem satisfeitos, qual alternativa futura (Cloud Functions/Run, Fastify em host compatível) atende ao orçamento e quem poderá operá-la?
6. Qual processo de enrollment autoriza máquina, quem pode iniciá-lo e qual credencial é apropriada (token individual revogável, token de curta duração ou identidade de workload)?
7. `machineId` é o mesmo ID que `deviceId` atual? Manter coleção `devices` ou criar `machines`? Haverá transferência de proprietário?
8. Aprovar modelo A ou B, padrões de consulta, acesso administrativo e necessidade de `collectionGroup`?
9. Aprovar precisão, tolerância de clock, tamanho, frequência, rate limits, retries e retenção. Os números atuais são apenas propostas.
10. O frontend lerá métricas diretamente com Firestore Rules ou por API? Obter e aprovar regras efetivamente implantadas antes da decisão.
11. Qual volume esperado, número de máquinas, orçamento e período de retenção acadêmico?

## 13. Plano de implementação futura

Sem IDs de Jira atribuídos nesta especificação; os títulos seguintes são etapas propostas:

1. **Fechar decisões de arquitetura:** confirmar hosting, projeto, IAM, rede, identidade de máquina, modelo Firestore, queries e limites. Aceite: decisões registradas e regras/projeto disponíveis para ambiente de teste.
2. **Versionar autorização e schema:** alinhar `MetricPayload`/Device, definir documento de machine e regras/índices. Aceite: regras emuladas bloqueiam leitura/escrita entre usuários e contrato tem exemplos válidos/inválidos.
3. **Implementar cadastro e revogação:** fluxo autenticado de associação, emissão individual, registro hash/estado e rotação/revogação. Aceite: máquina não escolhe owner no payload; revogar uma não afeta as demais.
4. **Implementar endpoint HTTPS:** runtime escolhido, autenticação primeiro, limite de corpo, schema Zod estrito, autorização de associação e respostas seguras. Aceite: nenhum acesso ao Firestore antes de todas as validações.
5. **Persistir idempotentemente:** timestamp server-side, chave `(machineId autenticado, sampleId)`, transação/criação condicional e conflito em conteúdo diferente. Aceite: retries não duplicam nem sobrescrevem amostra distinta.
6. **Adicionar testes:** unitários de schema/domínio, integração com emulador/repositório e casos de machine revogada, owner alterado, payload inválido, timeout e duplicidade. Aceite: cobertura dos fluxos positivos/negativos e dos privilégios do serviço documentada.
7. **Conectar o coletor:** criar envelope versionado, guardar credencial fora do repo, HTTPS/retry limitado e redaction de logs. Aceite: uma amostra real passa sem expor porta 9100 ou credenciais.
8. **Conectar Dashboard:** consultas limitadas/paginadas por autorização e intervalo. Aceite: usuário A não vê dados de B; ausência, stale e zero são distintos.
9. **Agendar só depois:** escolher scheduler e impedir sobreposição, dimensionar frequência/retention. Aceite: falhas/retries/idempotência e custo observável; fila não é adicionada sem evidência.
10. **Documentar deployment e recuperação:** ambientes, secrets, IAM, rotação, backup/retention, alarmes e runbook. Aceite: deploy reproduzível e procedimento de revogação/recuperação revisado.

## 14. Critérios de aceite para implementação posterior

- Nenhuma escrita acontece sem autenticação válida, associação ativa máquina-proprietário e validação integral do envelope.
- O backend ignora `userId` declarado e deriva ownership do registro confiável.
- Nenhuma credencial Admin ou segredo compartilhado é distribuído ao frontend/coletor.
- A leitura de amostras por usuário/máquina é negada entre contas por regras testadas ou API equivalente.
- CPU/memória são persistidas com unidades, versão e timestamps sem confundir coleta e persistência.
- Retry com mesmo sample ID é idempotente; mesma identidade com conteúdo divergente é conflito.
- Timeouts, erros transitórios/permanentes, limites, paginação e retenção têm comportamento/documentação testados.
- O Node Exporter segue privado e o endpoint HTTPS de ingestão não concede acesso sem credencial de máquina válida.
- O coletor one-shot pode ser validado antes de qualquer scheduler; resultados do Dashboard vêm de dados persistidos autorizados.