import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, ArrowLeft, LayoutDashboard, Bird, AlertTriangle } from 'lucide-react';

export const NotFound: React.FC = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        // Se houver histórico, volta para a página anterior. Caso contrário, vai ao Dashboard.
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-bg-app text-text-body flex flex-col justify-between items-center p-6 select-none relative overflow-hidden antialiased">
            
            {/* Efeito Glow / Iluminação Neon no Fundo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Mínimo / Brand */}
            <header className="w-full max-w-7xl flex items-center justify-between z-10 py-2">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-xl border border-brand-primary/20 flex items-center justify-center">
                        <Bird className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-text-heading">
                        Watch<span className="text-brand-primary">Flow</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-mono font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>STATUS: 404</span>
                </div>
            </header>

            {/* Conteúdo Central da Tela */}
            <main className="flex flex-col items-center text-center max-w-md my-auto z-10 space-y-6">
                
                {/* Ícone Ilustrativo de Monitoramento Desconectado */}
                <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-bg-card border border-border-subtle flex items-center justify-center shadow-2xl relative">
                        <WifiOff className="w-10 h-10 text-status-danger animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-status-danger text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg">
                        Offline
                    </div>
                </div>

                {/* Bloco de Mensagens */}
                <div className="space-y-2">
                    <div className="inline-block px-3 py-1 rounded-md bg-bg-card border border-border-subtle text-xs font-mono text-text-muted mb-2">
                        ERR_HTTP_NOT_FOUND • 404
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-text-heading tracking-tight">
                        404 — Sinal perdido
                    </h1>
                    <p className="text-sm text-text-muted leading-relaxed">
                        Parece que perdemos a conexão com esta página. O endereço que você tentou acessar não existe ou foi movido no <span className="text-text-heading font-medium">WatchFlow</span>.
                    </p>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                    <button
                        onClick={handleGoBack}
                        className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle hover:bg-bg-hover text-text-heading text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 text-sm font-semibold transition-all duration-200 shadow-lg shadow-brand-primary/20 cursor-pointer active:scale-95"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </main>

            {/* Rodapé Simples */}
            <footer className="w-full max-w-7xl text-center py-2 text-xs text-text-muted z-10">
                WatchFlow &copy; {new Date().getFullYear()} — Plataforma Centralizada de Monitoramento
            </footer>
        </div>
    );
};