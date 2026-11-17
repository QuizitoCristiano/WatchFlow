# WatchFlow — roteiro de testes de segurança e isolamento

Execute em Preview/homologação com duas contas Firebase distintas (A e B). Não use contas ou máquinas de produção.

## 1. Isolamento entre clientes

1. Entre como conta A e crie uma integração Node Exporter.
2. Provisione o Collector e envie pelo menos uma amostra real para criar um dispositivo.
3. Anote o UID de A e os IDs da integração e do dispositivo.
4. Saia da conta A e entre como conta B no mesmo navegador.
5. Confirme que B não vê integrações, dispositivos, métricas ou alertas de A.
6. Tente ler pelo SDK Firestore os caminhos de integração, dispositivo, métricas e alertas de A. A leitura deve falhar por `permission-denied`.
7. Tente criar uma integração no caminho de A usando a sessão B. A gravação deve falhar.
8. Tente atualizar o papel/role de B para `admin`. A gravação deve falhar.

## 2. Login em outro computador

1. Cadastre dois dispositivos distintos na conta A, cada um com sua integração/Collector.
2. Faça login como A em um segundo computador que ainda não foi cadastrado.
3. Confirme que os dispositivos já vinculados a A aparecem.
4. Confirme que o segundo computador não é cadastrado automaticamente e que suas métricas locais não aparecem no Dashboard.
5. Faça logout e login como B. Nenhum dispositivo de A deve permanecer visível, mesmo que o navegador seja o mesmo.

## 3. Fail Fast e limites

1. Envie um payload maior que 64 KiB. A API deve rejeitar com HTTP 413.
2. Envie JSON inválido ou métricas fora do intervalo 0–100. A API deve rejeitar sem persistir amostra.
3. Envie duas requisições seguidas usando a mesma credencial em menos de 15 segundos. A segunda deve receber HTTP 429.
4. Tente provisionar novamente antes de 60 segundos. A API deve rejeitar com HTTP 429.
5. Tente exceder cinco provisionamentos em uma hora para a mesma integração. O limite deve ser aplicado.
6. Configure endpoint com porta 80, 8080, caminho diferente de `/metrics`, query string ou destino de metadata cloud. O provisionamento deve falhar.

## 4. Porta do Node Exporter

1. Confirme que o Node Exporter escuta na porta TCP 9100.
2. Confirme que a porta não está publicada para a Internet.
3. Confirme que somente o host/rede do Collector consegue alcançar TCP 9100.
4. Repita a conexão a partir de uma origem não autorizada. Deve falhar no firewall.

## 5. Alertas e integridade

1. Envie métricas abaixo de 80%: nenhum alerta deve ser aberto.
2. Envie métrica em 80%: deve surgir alerta `warning`.
3. Envie métrica em 90% ou mais: deve surgir alerta `critical`.
4. Reconheça e resolva um alerta; atualize a página e confirme persistência.
5. Reduza a métrica abaixo de 80% e confirme a resolução automática.

## Critério de aprovação

Não aprovar o merge enquanto qualquer teste de isolamento falhar. Registre os resultados por conta, dispositivo, endpoint e horário; não inclua tokens ou segredos nos prints/logs.
