# Deprecated: este agente gravava diretamente no Firestore com um usuário compartilhado e métricas simuladas.
# Use Windows Exporter (porta 9182) + o Collector autenticado do WatchFlow.
Write-Error "Este script foi descontinuado. Configure uma integração Windows Exporter na aplicação e execute o Collector autenticado (npm run collector:start)."
exit 1
