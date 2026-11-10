# Roadmap de desenvolvimento

Este documento separa entregas confirmadas de etapas futuras. Uma intenção de projeto ou texto de interface não significa que a funcionalidade esteja implementada.

## Concluído

### WF-MON-001.2 — Coletor local de métricas

- Coletor Node.js com parsing Prometheus, CPU, memória, filesystem e rede.
- Modo one-shot local e modo contínuo configurável.
- Sem credenciais de serviço Firebase no coletor.

Os resultados da coleta real são específicos da execução local; consulte [a especificação do coletor](../architecture/monitoring-collector.md).

### WF-MON-001.3 — Ingestão e persistência no workspace

- Endpoints Vercel para provisionamento autenticado e ingestão por credencial de dispositivo.
- Validação de ownership, payload, timestamp, tamanho, frequência e idempotência.
- Persistência server-side em `users/{uid}/devices/{deviceId}/metrics/{sampleId}` e atualização de estado.
- Testes unitários com fakes; sem deploy ou gravação em Firebase real.

### WF-MON-001.4 — Integração do Dashboard no código

- Dashboard consulta amostras, prioriza dados reais e não mistura gráficos reais com demonstrações.
- Atualização periódica a cada 60 segundos.

### WF-MON-001.5 — Coleta periódica no coletor

- Intervalo configurável (padrão 60 s), timeout, até três tentativas e backoff.
- Amostras válidas enviadas; falhas do Node Exporter reportadas como estado operacional sem gerar métrica.

## Próximo

### WF-MON-001.6 — Validar deployment e Firestore real

Configurar segredos server-side na Vercel, confirmar runtime/limites, implantar conforme autorização operacional e executar provisionamento/coleta de teste com usuário e integração autorizados. Validar as Rules de leitura próprias, negar acesso cliente às coleções internas de credenciais e habilitar TTL. Nenhuma dessas ações foi realizada nesta etapa.

## Pendências arquiteturais

- Confirmar deploy, secrets, IAM mínimo, regras efetivas e limites/custos da plataforma.
- Habilitar TTL para `metrics`, `collectorCredentials` e `collectorCredentialState`.
- Validar ponta a ponta sem expor o Node Exporter publicamente.
- Confirmar retenção, quotas, observabilidade e política para dados stale.
- Corrigir divergências entre documentação antiga e caminhos usados atualmente no código.
- Definir geração/persistência de alertas; o código atual exibe e reconhece documentos, mas não calcula alertas a partir das métricas do coletor.
- Avaliar fontes adicionais (Telegraf, Zabbix, Sentry, Datadog ou Better Stack) somente como decisões futuras; não são integrações do coletor atual.

## Critérios de progressão

1. Código de ingestão não significa deployment ou gravação real validada.
2. Nunca aceitar `userId` do coletor como prova de ownership.
3. Não expor a porta 9100 nem permitir acesso cliente às coleções internas de credenciais.