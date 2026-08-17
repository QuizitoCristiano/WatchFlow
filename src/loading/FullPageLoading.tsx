import { Activity } from "lucide-react";

export const FullPageLoading = () => {
  return (
    <div className="relative min-h-screen w-full bg-bg-app flex flex-col items-center justify-center overflow-hidden p-4 text-text-body">
      {/* Meteoros / Luzes de fundo de alta performance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Card Central com Efeito de Glow */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-2xl bg-bg-card/60 backdrop-blur-xl border border-border-subtle/50 shadow-2xl max-w-sm w-full text-center">
        
        {/* Ícone com pulso e anéis concentricos */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping opacity-75" />
          <div className="relative p-4 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-lg shadow-brand-primary/10">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        {/* Branding e Texto */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-text-heading">
            Watch<span className="text-brand-primary">Flow</span>
          </h1>
          <p className="text-xs text-text-muted animate-pulse">
            Sincronizando infraestrutura...
          </p>
        </div>

        {/* Barra de Progresso Animada */}
        <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden border border-border-subtle/30">
          <div className="h-full bg-gradient-to-r from-brand-primary/40 via-brand-primary to-brand-primary/40 w-full animate-meteor-right rounded-full" />
        </div>
      </div>
    </div>
  );
};