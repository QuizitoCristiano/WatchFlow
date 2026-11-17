# WatchFlow — hardening do host e das portas

O WatchFlow coleta métricas através de um Collector executado no host monitorado. O aplicativo web não consegue configurar o firewall do sistema operacional do cliente; essa proteção precisa ser aplicada no host/rede onde o Node Exporter está instalado.

## Regras obrigatórias para produção

1. Não exponha a porta TCP 9100 do Node Exporter diretamente à Internet.
2. Faça o Node Exporter escutar somente em uma interface privada ou loopback quando o Collector estiver no mesmo host.
3. Permita conexões TCP 9100 somente a partir do host/rede do Collector.
4. Não publique a porta 9100 no roteador, security group ou load balancer para qualquer origem pública.
5. Mantenha o sistema operacional e o Node Exporter atualizados.
6. Use TLS por proxy/reverse proxy quando a coleta atravessar redes não confiáveis.
7. Use uma credencial WatchFlow individual por integração; nunca reutilize tokens entre clientes.
8. Revogue e reprovisione a credencial em caso de suspeita de exposição.

## Exemplo Linux com UFW

Substitua 10.0.0.25 pelo IP privado fixo do Collector:

```bash
sudo ufw deny 9100/tcp
sudo ufw insert 1 allow from 10.0.0.25 to any port 9100 proto tcp
sudo ufw status numbered
```

A regra específica de permissão deve prevalecer sobre a regra geral de bloqueio conforme a ordem/configuração do firewall. Revise a saída antes de aplicar em produção.

## Exemplo Windows PowerShell (Administrador)

Substitua o endereço pelo IP privado do Collector:

```powershell
New-NetFirewallRule -DisplayName "WatchFlow Node Exporter" -Direction Inbound -Protocol TCP -LocalPort 9100 -RemoteAddress 10.0.0.25 -Action Allow
Get-NetFirewallRule -DisplayName "*Node Exporter*"
```

A política padrão de entrada deve permanecer bloqueada. Remova regras genéricas que permitam TCP 9100 a qualquer origem; uma regra explícita de bloqueio pode prevalecer sobre a permissão restrita. Verifique as regras existentes antes de aplicar em produção.

## Limites aplicados pelo aplicativo

- A API rejeita métodos HTTP não suportados, JSON inválido e payloads acima de 64 KiB.
- O Collector limita a resposta do Node Exporter a 5 MiB e usa timeout de rede.
- A API aplica limite best-effort de 300 requisições por minuto por origem em cada instância; a ingestão também persiste um intervalo mínimo de 15 segundos por credencial entre requisições, inclusive entre instâncias.
- O provisionamento limita a rotação a uma solicitação por minuto e cinco por hora por integração.
- A credencial é armazenada como HMAC/hash no backend, expira em 90 dias e é revogada quando rotacionada.

Esses limites reduzem abuso de CPU, memória e gravações, mas não substituem limites de execução e rede da plataforma de hospedagem. Configure também limites de CPU/memória, concorrência e timeout no provedor de hospedagem e monitore os custos do Firestore.