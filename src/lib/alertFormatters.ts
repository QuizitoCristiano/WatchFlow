import type { AlertSeverity, AlertStatus, AlertType } from "@/types";

// Mapeamento visual para os tipos de alerta
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  CPU_HIGH: 'Uso de CPU Elevado',
  RAM_HIGH: 'Consumo de Memória Elevado',
  DISK_HIGH: 'Capacidade de Disco Crítica',
  DEVICE_OFFLINE: 'Dispositivo Inacessível',
  INTEGRATION_DOWN: 'Coletor / Integração Offline',
};

// Mapeamento visual para status
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  active: 'Ativo',
  acknowledged: 'Reconhecido',
  resolved: 'Resolvido',
};

// Mapeamento visual para severidades
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informação',
};

// Classes utilitárias do Tailwind para os Badges de Severidade (compatível com as variáveis do CSS)
export const ALERT_SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-[var(--color-status-danger)]/10',
    text: 'text-[var(--color-status-danger)]',
    badge: 'bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)] border-[var(--color-status-danger)]/20',
  },
  warning: {
    bg: 'bg-[var(--color-status-warning)]/10',
    text: 'text-[var(--color-status-warning)]',
    badge: 'bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/20',
  },
  info: {
    bg: 'bg-[var(--color-status-info)]/10',
    text: 'text-[var(--color-status-info)]',
    badge: 'bg-[var(--color-status-info)]/10 text-[var(--color-status-info)] border-[var(--color-status-info)]/20',
  },
};