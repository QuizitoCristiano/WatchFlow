# Viabilidade técnica e financeira da ingestão

> **Status:** análise histórica anterior à implementação da API Vercel no workspace. As recomendações de implementação e as afirmações de ausência de backend abaixo não descrevem o código atual; consulte [monitoring-collector.md](monitoring-collector.md). As observações de plano/quotas continuam não verificadas independentemente.

## 1. Resumo executivo

A primeira versão pode **ser tecnicamente compatível** com uma Vercel Node.js Function recebendo HTTPS do coletor local e gravando no Firestore, mas o repositório, por si só, não prova que a conta/plano Vercel atual ofereça o runtime, limites, gestão de secrets ou custo adequados. Também não prova o plano/quotas do Firebase nem o custo atual do projeto.

A Vercel Function é a alternativa provisoriamente preferida por reaproveitar a hospedagem existente, não por ser comprovadamente gratuita. A implementação fica bloqueada até a equipe verificar no painel Vercel e Firebase Console os itens deste documento e confirmar que o uso projetado cabe nas franquias disponíveis ou em orçamento aprovado. Não assumir cobrança zero.

Até lá, a alternativa mais segura sem custo de infraestrutura novo é manter o coletor manual e local, apresentando resultados no terminal como hoje, sem persistir nem enviar métricas. Não usar credenciais administrativas no coletor e não expor a porta 9100.

## Observações dos painéis fornecidas pelo desenvolvedor

As informações abaixo foram fornecidas pelo desenvolvedor após consulta aos painéis. Não foram verificadas independentemente contra os termos oficiais atuais, e não provam que o deployment deste workspace esteja ligado à mesma conta/projeto:

| Serviço | Observação fornecida | Limite desta informação |
|---|---|---|
| Vercel | Hobby, conta pessoal, sem cobrança ativa observada; região `iad1`; limite de 100.000 invocações relatado. | Dados informados pelo desenvolvedor, não verificados independentemente. Confirmar no painel o período, escopo, uso atual, duração, transferência, franquias e condições oficiais. “Sem cobrança ativa” não garante que o uso futuro permaneça sem custo. |
| Firebase/Firestore | Spark, Firestore em `nam5`, coleção `users` existente; quota de 20.000 gravações/dia relatada. | Dados informados pelo desenvolvedor, não verificados independentemente. Confirmar quota/período, uso atual, projeto, Rules publicadas e condições oficiais. O rótulo Spark não prova que todos os recursos futuros estejam disponíveis sem faturamento. |

Use estes dados como observações de ambiente, não como afirmações de preço/limite garantidas. Confirmar conta, projeto, plano, região, quotas e consumo atuais antes de assumir operação sem custo.

## 2. Estado real encontrado no repositório

| Área | Evidência local | Conclusão |
|---|---|---|
| Frontend/build | `package.json` tem `dev: vite`, `build: tsc -b && vite build`, `preview: vite preview`. `vite.config.ts` configura Vite, React e Tailwind. | Pipeline de build do frontend Vite; não declara build de servidor/API. |
| Deploy | `vercel.json` contém apenas rewrite `/(.*) -> /index.html`. | Configuração versionada de SPA; não declara Function, runtime, região, secret ou rota `/api`. O desenvolvedor relata Hobby pessoal, sem cobrança ativa e região observada `iad1`; isso não foi verificado no painel nesta análise. |
| Estrutura | `src/` contém páginas, serviços, auth, contexts e tipos; não foi encontrado diretório `api/`, `server/` ou Functions. | API de ingestão não existe no código consultado. |
| Firebase | `package.json` declara `firebase` `^12.17.1`; `src/services/config.tsx` inicializa Firebase App, Auth, Firestore, Storage e Analytics no cliente. | SDK cliente confirmado. |
| Admin SDK | Busca por `firebase-admin`, funções Firebase e servidores não encontrou uso/dependência. | Firebase Admin SDK não está instalado/declarado no manifesto inspecionado e não há código servidor correspondente. |
| Variáveis | `src/services/config.tsx` referencia nomes `VITE_FIREBASE_*`. | São referências do bundle de cliente; não provam que valores existam em qualquer ambiente. Seus valores não foram lidos. `.env.local` existe, mas foi deliberadamente ignorado. |
| Firestore | Serviços cliente leem/escrevem perfis, integrações e alguns documentos em caminhos de usuário; não há serviço de ingestão. | Firestore está integrado ao frontend; não há persistência das métricas do coletor. O desenvolvedor relata Spark, localização `nam5` e coleção `users` existente; plano, quotas e projeto não foram verificados independentemente. |
| Regras/índices | Busca de arquivos não encontrou `firestore.rules`, `firebase.json` ou `firestore.indexes.json`. | Não versionados neste repositório. Regras implantadas são desconhecidas. |
| Coletor | `collector/src/` consulta Node Exporter localmente, calcula CPU/RAM e imprime no terminal. | Processo independente one-shot; sem upload, credencial de máquina ou gravação Firebase. |
| Contratos | `metrics-data-contract.md` e `metrics-ingestion-architecture.md` são propostas. `src/types/index.ts` prevê campos/pasta que divergem do coletor e parte dos caminhos de leitura. | Contrato e ownership ainda precisam de aprovação/alinhamento antes de persistência. |

A ausência de configuração versionada não prova que Functions, Firestore Rules ou variáveis não existam na conta implantada. As observações de painel acima são contexto fornecido pelo desenvolvedor; esta análise não acessou os painéis, Firebase, endpoint de produção ou conteúdo de variáveis.

## 3. Fatos, inferências e desconhecidos

### Confirmado no repositório

- Vite gera o frontend; o script `build` não invoca explicitamente compilador ou bundler de API Node.
- `vercel.json` encaminha todas as rotas correspondentes para `index.html` e não contém configuração explícita de Function.
- Firebase Client SDK está instalado e usado. `firebase-admin` não aparece no manifesto/código pesquisado.
- Não há API/Function, Rules ou índices Firestore versionados na estrutura inspecionada.
- Zod está instalado e é usado em validação da autenticação; não há schema Zod para payload de ingestão.
- O contrato atual é planejamento. Não há endpoint HTTPS para o coletor.

### Inferência técnica, ainda não validada por deployment

- É plausível adicionar uma Vercel Function Node.js ao mesmo repositório por meio da convenção de API da plataforma, sem transformar o frontend Vite em servidor. A estrutura e o roteamento exatos dependem da versão/configuração da Vercel e devem ser demonstrados com uma função mínima em preview antes de implementar ingestão.
- O rewrite catch-all pode interferir na rota pretendida, conforme a ordem de resolução de rotas no deployment. O arquivo local não demonstra essa precedência; `/api` precisa ser testado em preview autorizado antes de concluir compatibilidade.
- A função pode iniciar conexão de saída para Firestore e receber HTTPS do coletor sem precisar acessar `192.168.1.2`. Isso não concede à Vercel acesso ao IP privado da VM e não requer expor a porta 9100.
- O uso do Firebase Admin em runtime Vercel é possível em princípio com pacote e credencial server-side, mas essa dependência, autenticação GCP, configuração de secrets e menor papel IAM não existem hoje e precisam de verificação técnica/financeira.

## 4. Avaliação da Vercel

### O que é verificável localmente

- Há um `vercel.json`, mas somente com rewrite da SPA.
- Build, preview e desenvolvimento são scripts Vite; não existe script local de API.
- Não há fonte para determinar plano, versão Node configurada na conta, região, limites de duração/memória, payload, concorrência, invocações, tráfego, preço, observabilidade ou recursos de rate limiting.
- Não inspecionei valores nem presença de variáveis no painel Vercel. Referências `VITE_FIREBASE_*` no código dizem respeito à configuração de cliente, não a secrets de Function.

### Verificação manual no painel Vercel

Caminhos abaixo são aproximados e podem mudar conforme a interface/plano:

1. **Team/Account Settings → Billing/Plans/Usage:** confirmar a observação de plano Hobby pessoal e ausência de cobrança ativa; registrar inclusões, franquias, excedentes, faturamento habilitado e teto de custo aceito pelo desenvolvedor.
2. **Project → Settings → Functions:** verificar suporte a Node.js Functions no plano, runtimes/versões Node disponíveis, região (inclusive a observada `iad1`), duração máxima, memória, tamanho de request/response, concorrência e quotas de invocação/compute. Registrar os números que não foram fornecidos nesta solicitação.
3. **Project → Settings → Environment Variables:** verificar somente nomes, ambientes associados (Development/Preview/Production) e disponibilidade de armazenamento seguro de secrets. Não imprimir/copiar valores para logs, Git ou documentação.
4. **Project → Deployments/Build Settings:** confirmar root directory, build command, output directory, versão Node efetiva e como arquivos de função coexistem com o build Vite.
5. **Project → Usage/Functions/Logs/Observability:** consultar consumo e limites de invocações, duração, compute e tráfego; verificar alertas/limites de uso e custo. Confirmar se rate limiting/WAF está incluído ou tem preço adicional.
6. Após autorização futura para teste, implantar apenas uma rota não sensível em preview e confirmar que `/api/...` chega à Function, não ao `index.html`; observar logs e limites. Não enviar credenciais nem métricas reais nesse teste inicial.

**Critério de custo Vercel:** aprovar somente após calcular uso projetado e excedentes possíveis para a conta real. Se não houver margem clara, não ativar a Function.

## 5. Avaliação do Firebase e Firestore

### O que está confirmado

- A aplicação cliente usa Firebase `^12.17.1` em `src/services/config.tsx`, com `getAuth`, `getFirestore`, `getStorage` e Analytics condicional.
- A configuração de cliente lê chaves `VITE_FIREBASE_*`. Nenhum valor foi mostrado nem precisa ser registrado neste documento.
- Não há dependência `firebase-admin`, configuração `firebase.json`, Rules ou índices versionados nesta cópia.
- Não existe serviço de gravação de métricas.
- Não é possível identificar com segurança o projeto Firebase realmente usado sem consultar configuração implantada; não li `.env.local` e não reproduzo IDs.

### Client SDK versus Admin SDK

- **Firebase Client SDK:** executado no navegador, autenticado como usuário final. As operações são avaliadas pelas Firestore Security Rules publicadas. Chaves/configuração web identificam o projeto, mas não devem ser tratadas como credenciais administrativas; autorização efetiva depende de Auth e Rules.
- **Firebase Admin SDK:** executado apenas em ambiente confiável de servidor e autenticado como serviço. Acesso privilegiado contorna Firestore Security Rules; a função precisa autenticar a máquina, resolver owner e autorizar cada operação antes da escrita. Credenciais nunca vão para `VITE_*`, frontend, coletor local, Git ou logs.

Se escolhido, a Function precisará de uma versão compatível do pacote `firebase-admin` (hoje ausente) e identidade de servidor. Não adicionar pacote/credencial nesta verificação. Workload identity/federação Vercel-GCP não está demonstrada; se não for suportada, chave de service account apenas em secret store é uma alternativa a avaliar, com escopo mínimo permitido, rotação e custo/risco documentados.

### Verificação manual no Firebase Console/Google Cloud

1. **Firebase Console → Project settings → General:** confirmar o projeto alvo do deployment e a localização `nam5` observada, sem copiar IDs para o documento.
2. **Firebase Console → Usage and billing / Project billing:** confirmar Spark e suas condições atuais para este projeto; conferir faturamento associado, mudança de plano exigida pelos recursos escolhidos e quem autoriza cobrança. Não inferir disponibilidade futura apenas pelo rótulo do plano.
3. **Firestore Database → Usage:** confirmar que `users` existe e observar leituras, gravações, exclusões, armazenamento, tráfego/egress e tendência atual; comparar com máquinas, frequência, amostras, consultas e retenção esperadas.
4. **Firestore quotas/limits e Billing reports:** registrar os valores exatos de quotas relatadas pelo painel (não incluídos nesta solicitação), franquias e eventuais cobranças por armazenamento, operações, índices, backup/retention, rede e recursos opcionais. Conferir documentação oficial de preço atual.
5. **Authentication → Usage:** verificar quotas/limites e impacto do fluxo de cadastro/autenticação de usuários e máquinas. A autenticação de máquina não é fornecida pelo Firebase Auth automaticamente.
6. **Google Cloud Console → Billing → Budgets & alerts:** confirmar se existe orçamento/alerta e quem pode aprovar eventual cobrança. Orçamento/alerta monitora gasto; não necessariamente bloqueia consumo.
7. **IAM & Admin → Service Accounts / IAM:** apenas revisar identidades existentes e papéis com responsáveis; não criar chave nem alterar papel durante esta etapa. Confirmar se a Function pode usar identidade sem chave e qual papel mínimo permite gravar no Firestore.
8. Confirmar se APIs/billing exigidos por algum plano futuro estão habilitados. Esta tarefa não habilita API, plano, billing ou serviço.

**Critério de custo Firestore:** calcular writes (uma amostra por máquina/frequência), leituras paginadas do Dashboard, índices, retenção e armazenamento. Confirmar que o total fica dentro de quota/franquia verificada ou de orçamento explicitamente aceito. O documento não declara Firestore gratuito ou pago em todos os cenários.

Estimativas aritméticas para uma escrita de documento por amostra, sem retries ou gravações auxiliares:

| Intervalo de envio | Envios/gravações por máquina/dia |
|---|---:|
| 10 segundos | 8.640 |
| 1 minuto | 1.440 |
| 5 minutos | 288 |

Os valores são estimativas de volume, não quotas nem preços. Um batch pode reduzir requisições HTTP, mas não equivale automaticamente a uma única gravação faturável: cada operação de escrita de documento deve ser contabilizada conforme as regras efetivas de medição do Firestore. Estes totais não incluem documentos de dispositivo, transações, retries, leituras de autorização, índices, retenção ou consultas do Dashboard. Confirmar os critérios oficiais de cobrança e quotas para o projeto antes de escolher o intervalo.

### Cenário inicial proposto: cinco máquinas

Hipóteses de planejamento: cinco máquinas simultâneas; uma amostra local por máquina a cada 60 segundos; envio de um lote por máquina a cada cinco minutos, contendo cinco amostras daquela máquina; um documento de amostra por amostra; retenção histórica pretendida de sete dias. São propostas de dimensionamento, não configuração implementada nem decisão aprovada.

| Métrica | Cálculo | Estimativa |
|---|---|---:|
| Amostras por máquina/dia | 86.400 s ÷ 60 s | 1.440 |
| Amostras para cinco máquinas/dia | 1.440 × 5 | 7.200 |
| Amostras/documentos criados em 30 dias | 7.200 × 30 | 216.000 |
| Documentos de amostra retidos em estado estável após sete dias | 7.200 × 7 | 50.400 |
| Requisições por máquina/dia, lote a cada cinco minutos | 1.440 min ÷ 5 min | 288 |
| Requisições para cinco máquinas/dia | 288 × 5 | 1.440 |
| Invocações em 30 dias nesse lote | 1.440 × 30 | 43.200 |
| Invocações em 30 dias se enviar cada amostra individualmente | 7.200 × 30 | 216.000 |

Se o limite relatado de 100.000 invocações for mensal e se aplicar à função planejada, envio por amostra a cada minuto chegaria a 216.000, excedendo o relato em 116.000 (2,16×). Lote por máquina a cada cinco minutos chegaria a 43.200, ou 43,2% do número relatado, antes de chamadas adicionais como alertas, enrollment, health checks ou retries. Confirmar o período e o escopo do limite no painel; esta comparação não confirma capacidade do plano.

As 7.200 gravações de amostras/dia representam 36% da quota de 20.000 gravações/dia relatada, com 12.800 gravações/dia de margem aritmética antes de outros writes. Alertas persistidos, documentos de dispositivo, atualizações de resumo, retries e outros usos da aplicação consomem operações adicionais. Quota e critério de cobrança precisam ser confirmados no projeto Firebase. Cinco documentos enviados em uma requisição continuam representando cinco gravações; o lote reduz chamadas à API, não transforma automaticamente cinco escritas em uma gravação faturável.

A retenção de sete dias não ocorre automaticamente só por constar nesta proposta. Definir e habilitar mecanismo efetivo de expiração/limpeza, verificar sua semântica, latência e custos, e planejar exclusão de subcoleções. Os 50.400 documentos são o estoque teórico após a retenção estabilizar, supondo operação contínua e uma gravação por amostra; alertas e outros documentos ficam fora do total.

Não estimar leituras, bytes armazenados ou preço sem frequência de consultas, quantidade de usuários ativos, tamanho médio real dos documentos, índices, retenção/exclusões e preços/quotas vigentes. Alertas críticos podem usar uma via de envio mais rápida que o lote periódico; essa via acrescenta invocações e gravações próprias ao dimensionamento.

## 6. Checklist consolidado de custo e limites

Antes de autorizar qualquer API, preencher com dados conferidos no painel:

| Verificação | Evidência necessária | Estado nesta análise |
|---|---|---|
| Plano e franquia Vercel | Plano/uso/excedentes e responsável pelo custo | Hobby pessoal e ausência de cobrança ativa relatados; termos, limites numéricos e uso não verificados independentemente |
| Runtime Node e Function | Runtime suportado e política de deploy do projeto | Não verificado |
| Duração/memória/concurrency | Limites da Function para o runtime/plano | Não verificado |
| Payload e tráfego | Limites de request/response, transferência e região | Não verificado |
| Secrets server-side | Disponibilidade por ambiente, proteção e rotação | Não verificado |
| Rate limiting/WAF | Recurso incluído, limite e eventual custo | Não verificado |
| Plano/uso Firestore | Plano, billing, operações, storage, egress e tendência | Spark, `nam5` e coleção `users` relatados; quotas/uso e condições atuais não verificados independentemente |
| Retenção/índices/backups | Custo e quotas para consulta/expiração escolhidas | Não verificado |
| Identidade servidor → Firestore | Federação sem chave ou service account protegida e papel mínimo | Não verificado |
| Teto financeiro | Limite aprovado pelo responsável e alerta/ação ao atingir | Não informado |
| Integração Vite + `/api` | Preview demonstra roteamento e runtime Node corretos | Não testado; não houve deploy |

Os números de frequência, payload e retenção existentes em `metrics-data-contract.md` são propostas de dimensionamento, não limites de produto nem decisões aprovadas.

## 7. Bloqueios técnicos e financeiros

1. **Plano e custo desconhecidos:** não há acesso ao painel/uso da Vercel, Firebase Console ou billing nesta análise. Não dá para declarar custo zero, cobertura por franquia ou ausência de cobrança excedente.
2. **Function não configurada:** repositório só contém rewrite SPA, sem `/api`, runtime declarado ou script de API.
3. **Roteamento não provado:** rewrite catch-all pode afetar rotas; precedência precisa ser testada com deploy autorizado.
4. **Admin SDK ausente e identidade não escolhida:** gravação server-side exige pacote/configuração futura e credencial segura. A Vercel não tem identidade GCP comprovada neste repo.
5. **Rules efetivas desconhecidas:** não há Rules/índices versionados; Admin SDK também as ignora. Leitura futura do Dashboard não pode depender de filtros no cliente.
6. **Proprietário/credencial de máquina ainda são proposta:** não há enrollment, registro, rotação ou revogação.
7. **Schema inconsistente:** coletor, `MetricPayload` e caminhos `devices`/`machines` não estão alinhados.
8. **Dimensionamento pendente:** sem quantidade de máquinas, frequência aprovada, retenção, consultas e limites financeiros, não há estimativa de Firestore confiável.

## 8. Recomendação provisória

Manter a preferência por Vercel Functions **apenas para investigação/primeira opção**, pois reutiliza o ambiente de hospedagem já informado e pode evitar contratar/operar outro servidor. Ela só será tecnicamente e financeiramente viável se o painel comprovar suporte às Functions, runtime e secrets; um preview confirmar o roteamento; uma identidade server-side puder gravar no Firestore com privilégio mínimo; e Vercel + Firestore ficarem dentro das quotas ou do teto de custo aprovado.

Se qualquer condição não for satisfeita, não contornar removendo autenticação ou colocando Admin credentials no coletor. Manter a coleta local no terminal enquanto se decide outra alternativa. Cloud Functions/Run e serviço dedicado continuam alternativas futuras sujeitas à mesma análise de custo, não dependências automáticas.

## 9. Critérios para autorizar implementação da API

- Conta/plano e runtime Vercel confirmados, limites documentados e custo projetado aprovado pelo desenvolvedor.
- Rota API e build Vite testados em preview autorizado, sem interferência do rewrite SPA.
- Decisão de identidade de servidor para Firebase tomada; nenhum segredo Admin no cliente/coletor/repo; rotação e menor privilégio definidos.
- Modelo Firestore, ownership, `machineId`, cadastro/revogação e contrato v1 aprovados.
- Rules efetivas recuperadas/versionadas e testadas para isolamento entre contas; responsabilidades da API com Admin SDK documentadas.
- Limites de body/frequência, timeout, concorrência, rate limiting, idempotência, paginação, retenção e alerta/cap de gasto aprovados.
- Plano de teste local/preview sem escrita de produção e runbook de revogação/erro definido.

## 10. Próxima tarefa sugerida

**Revisão manual de viabilidade em Vercel e Firebase Console**, preenchendo a tabela da seção 6 e obtendo autorização explícita de custo. Se passar, a tarefa posterior pode detalhar o desenho da Function de preview (sem persistência inicialmente); só após validar runtime, secrets, Rules, ownership e orçamento deverá começar a API de ingestão. Nenhuma API ou teste de deploy foi realizado nesta etapa.
