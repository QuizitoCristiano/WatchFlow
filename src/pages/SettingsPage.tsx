import React, { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Monitor,
  Bell,
  Clock,
  LayoutGrid,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_PREFERENCES } from '../lib/settings.service';
import type { UserPreferences } from '@/types';

export const SettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Handlers genéricos para atualização imutável do estado
  const updateNestedPref = <K extends keyof UserPreferences>(
    category: K,
    field: keyof UserPreferences[K],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Simulação da chamada do service: await settingsService.updatePreferences(userId, preferences);
      await new Promise(res => setTimeout(res, 600));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-body)] p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-heading)]">
            Configurações da Plataforma
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Personalize a experiência, tempos de atualização e comportamento do WatchFlow.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-md disabled:opacity-50"
        >
          <Save size={18} />
          {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Feedback de salvamento */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          <CheckCircle2 size={18} />
          <span>Configurações salvas com sucesso! (RN-CONFIG-03)</span>
        </div>
      )}

      {/* Grid Principal: Menu Lateral Interno + Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navegação de Seções */}
        <nav className="space-y-1">
          {[
            { id: 'general', label: 'Geral & Região', icon: Globe },
            { id: 'appearance', label: 'Aparência', icon: Sun },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'monitoring', label: 'Monitoramento', icon: Clock },
            { id: 'dashboard', label: 'Widgets Dashboard', icon: LayoutGrid },
            { id: 'session', label: 'Sessão & Segurança', icon: Moon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-heading)]'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo das Seções */}
        <div className="md:col-span-3 space-y-6">
          
          {/* 1. GERAL */}
          {activeSection === 'general' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <Globe size={20} className="text-[var(--color-brand-primary)]" />
                Idioma e Fuso Horário
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">Idioma</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(p => ({ ...p, language: e.target.value as any }))}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">Fuso Horário</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(p => ({ ...p, timezone: e.target.value }))}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. APARÊNCIA */}
          {activeSection === 'appearance' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <Sun size={20} className="text-[var(--color-brand-primary)]" />
                Tema da Interface (RN-CONFIG-06)
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'system', label: 'Sistema', icon: Monitor },
                  { id: 'light', label: 'Claro', icon: Sun },
                  { id: 'dark', label: 'Escuro', icon: Moon },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = preferences.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setPreferences(p => ({ ...p, theme: t.id as any }))}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-bold'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. NOTIFICAÇÕES */}
          {activeSection === 'notifications' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <Bell size={20} className="text-[var(--color-brand-primary)]" />
                Preferências de Alertas (RN-CONFIG-05)
              </h2>

              <div className="space-y-3 divide-y divide-[var(--color-border-subtle)]">
                {[
                  { key: 'enabled', label: 'Ativar Notificações Globais', desc: 'Permite o envio de alertas em tempo real' },
                  { key: 'critical', label: 'Alertas Críticos', desc: 'Notificar interrupções de serviço severas' },
                  { key: 'warning', label: 'Alertas de Atenção', desc: 'Notificar oscilações de CPU, RAM e disco' },
                  { key: 'info', label: 'Alertas Informativos', desc: 'Notificações operacionais e deploys' },
                  { key: 'email', label: 'Notificações por E-mail', desc: 'Enviar resumo consolidado por e-mail' },
                ].map((item) => (
                  <div key={item.key} className="pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-heading)]">{item.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!(preferences.notifications as any)[item.key]}
                      onChange={(e) => updateNestedPref('notifications', item.key as any, e.target.checked)}
                      className="h-5 w-5 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MONITORAMENTO */}
          {activeSection === 'monitoring' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <Clock size={20} className="text-[var(--color-brand-primary)]" />
                Frequência de Coleta (RN-CONFIG-04)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">Intervalo de Atualização</label>
                  <select
                    value={preferences.monitoring.refreshInterval}
                    onChange={(e) => updateNestedPref('monitoring', 'refreshInterval', Number(e.target.value))}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value={5}>5 segundos</option>
                    <option value={15}>15 segundos</option>
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">Período Padrão do Histórico</label>
                  <select
                    value={preferences.monitoring.defaultTimeRange}
                    onChange={(e) => updateNestedPref('monitoring', 'defaultTimeRange', e.target.value)}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value="1h">Última 1 hora</option>
                    <option value="24h">Últimas 24 horas</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <LayoutGrid size={20} className="text-[var(--color-brand-primary)]" />
                Exibição de Widgets
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'cpu', label: 'Uso de CPU' },
                  { key: 'memory', label: 'Uso de Memória' },
                  { key: 'disk', label: 'Capacidade de Disco' },
                  { key: 'network', label: 'Tráfego de Rede' },
                  { key: 'availability', label: 'SLA & Uptime' },
                  { key: 'alerts', label: 'Painel de Alertas' },
                ].map((w) => (
                  <label
                    key={w.key}
                    className="flex items-center gap-3 p-3 bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] rounded-lg cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!(preferences.dashboard as any)[w.key]}
                      onChange={(e) => updateNestedPref('dashboard', w.key as any, e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-primary)]"
                    />
                    <span className="text-xs font-medium text-[var(--color-text-heading)]">{w.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 6. SESSÃO */}
          {activeSection === 'session' && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-heading)] flex items-center gap-2">
                <Moon size={20} className="text-[var(--color-status-danger)]" />
                Gerenciamento de Sessão
              </h2>

              <div className="p-4 bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-heading)]">Dispositivo Atual</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Navegador Web • Ativo agora</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)] rounded-lg hover:bg-[var(--color-status-danger)]/20 transition-colors"
                >
                  Sair da Conta
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;