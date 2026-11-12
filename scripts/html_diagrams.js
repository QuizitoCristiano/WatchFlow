// Helper to generate HTML visual diagram for FIGURA 1
export const figura1Html = `
<div style="border: 1px solid #999; border-radius: 6px; padding: 10px; background: #fafafa; font-size: 8.5pt; text-align: left; margin: 8pt auto; max-width: 98%;">
  <div style="font-weight: bold; text-align: center; color: #111; margin-bottom: 6px; font-size: 9pt;">CAMADA DE COLETA LOCAL (HOST FÍSICO MONITORADO)</div>
  <div style="display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px;">
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Sistema Operacional</strong><br />Windows 11 (os.cpus / WMI)
    </div>
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Acelerador Gráfico</strong><br />Driver GPU / nvidia-smi
    </div>
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Prometheus Exporter</strong><br />Métricas de SO (:9100)
    </div>
  </div>

  <div style="text-align: center; color: #555; margin: 4px 0; font-weight: bold;">▼ (Ingestão em Tempo Real)</div>

  <div style="border: 1px solid #d97706; background: #fffbeb; border-radius: 4px; padding: 6px; text-align: center; margin-bottom: 8px;">
    <strong>Motor de Telemetria Local (Vite Dev API)</strong><br />
    Endpoints Locais: <code>/api/system-metrics</code> • <code>/__local/collector-metrics</code>
  </div>

  <div style="text-align: center; color: #555; margin: 4px 0; font-weight: bold;">▼ HTTP GET (Varredura Contínua a cada 2000 ms)</div>

  <div style="font-weight: bold; text-align: center; color: #111; margin: 8px 0 6px 0; font-size: 9pt;">CAMADA ANALÍTICA (APLICAÇÃO FRONTEND WEB)</div>
  <div style="display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px;">
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Descoberta e Telemetria</strong><br />Séries Temporais (Recharts)
    </div>
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Máquina de Estados</strong><br />Trava de Cooldown (45s)
    </div>
    <div style="flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 6px; background: #fff; text-align: center;">
      <strong>Central de Alertas</strong><br />Notificações Visuais (Toasts)
    </div>
  </div>

  <div style="text-align: center; color: #555; margin: 4px 0; font-weight: bold;">▼ HTTPS (Disparo Estruturado de Eventos e Traces)</div>

  <div style="border: 1px solid #7c3aed; background: #f5f3ff; border-radius: 4px; padding: 6px; text-align: center;">
    <strong>SENTRY CLOUD APM (Plataforma Corporativa em Nuvem)</strong><br />
    Painel de Issues Forenses (watchflow.sentry.io) • Metadados de Hardware • Rastreamento de Erros
  </div>
</div>
`;

// Helper to generate HTML visual diagram for FIGURA 2
export const figura2Html = `
<div style="border: 1px solid #999; border-radius: 6px; padding: 10px; background: #fafafa; font-size: 8.5pt; text-align: center; margin: 8pt auto; max-width: 98%;">
  <div style="display: inline-block; width: 85%; border: 1.5px solid #059669; border-radius: 6px; padding: 8px; background: #ecfdf5; margin-bottom: 6px;">
    <strong style="color: #065f46; font-size: 9.5pt;">ESTADO: ONLINE</strong><br />
    <span style="color: #047857;">Métricas em regime nominal de repouso (CPU, RAM, Disco, GPU <= 90%)</span>
  </div>

  <div style="color: #b91c1c; font-weight: bold; margin: 5px 0;">
    ▼ Evento de Saturação: Algum recurso ultrapassa o limiar crítico de 90%
  </div>

  <div style="display: inline-block; width: 85%; border: 1.5px solid #dc2626; border-radius: 6px; padding: 8px; background: #fef2f2; margin-bottom: 8px;">
    <strong style="color: #991b1b; font-size: 9.5pt;">ESTADO: CRITICAL (SOBRECARGA DETECTADA)</strong><br />
    <span style="color: #b91c1c;">Emite Toast Vermelho na UI • Dispara Issue Fatal no Sentry • Inicia Cooldown de 45s</span>
  </div>

  <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; text-align: left;">
    <div style="flex: 1; border: 1px solid #d97706; border-radius: 4px; padding: 7px; background: #fffbeb;">
      <strong style="color: #92400e;">PROTEÇÃO ANTI-SPAM (COOLDOWN)</strong><br />
      Se o hardware permanecer acima de 90% dentro da janela de 45 segundos:<br />
      • Mantém distintivo vermelho <code>CRITICAL</code> na tela<br />
      • <strong>Bloqueia novos envios ao Sentry</strong> para preservar cotas da API
    </div>
    <div style="flex: 1; border: 1px solid #059669; border-radius: 4px; padding: 7px; background: #ecfdf5;">
      <strong style="color: #065f46;">MECANISMO DE AUTO-RECOVERY</strong><br />
      Quando todos os recursos retornam para valores <= 90%:<br />
      • Emite aviso visual flutuante (toast) verde de normalização<br />
      • Marca incidente como resolvido na Central de Alertas<br />
      • Transita automaticamente de volta para <code>ONLINE</code>
    </div>
  </div>
</div>
`;
