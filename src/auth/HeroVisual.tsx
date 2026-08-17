import { useState, useEffect } from "react";
import {
    Cpu,
    Terminal,
    Activity,
    Server,
    Database,
    HardDrive,
} from "lucide-react";

interface TypewriterItem {
    text: string;
    colorClass: string;
}

const TYPEWRITER_ITEMS: TypewriterItem[] = [
    {
        text: "Centralize métricas de servidores, bancos e APIs.",
        colorClass: "text-brand-primary",
    },
    {
        text: "Acompanhe o consumo de CPU, RAM e Disco em tempo real.",
        colorClass: "text-status-info",
    },
    {
        text: "Receba alertas de incidentes antes que afetem a operação.",
        colorClass: "text-status-danger",
    },
    {
        text: "Monitore sua infraestrutura de TI com o WatchFlow.",
        colorClass: "text-status-success",
    },
];

export const HeroVisual = () => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const currentItem = TYPEWRITER_ITEMS[currentTextIndex];

    useEffect(() => {
        const fullText = currentItem.text;
        const typingSpeed = isDeleting ? 30 : 60;

        const handleType = () => {
            if (!isDeleting) {
                setDisplayedText(fullText.substring(0, displayedText.length + 1));
                if (displayedText === fullText) {
                    setTimeout(() => setIsDeleting(true), 2500);
                }
            } else {
                setDisplayedText(fullText.substring(0, displayedText.length - 1));
                if (displayedText === "") {
                    setIsDeleting(false);
                    setCurrentTextIndex((prev) => (prev + 1) % TYPEWRITER_ITEMS.length);
                }
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentTextIndex, currentItem]);

    return (
        <div className="hidden lg:flex w-1/2 bg-bg-card border-l border-border-subtle relative overflow-hidden flex-col justify-center items-center p-8 xl:p-12">
            {/* Ambient Background Glow */}
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-lg text-center space-y-6 relative z-10">
                {/* Título Ajustado */}
                <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-text-heading leading-tight">
                    Monitoramento inteligente de infraestrutura
                </h2>

                {/* Container Typewriter */}
                <div className="h-10 flex items-center justify-center">
                    <p className={`text-xs xl:text-sm font-medium leading-relaxed transition-colors duration-300 ${currentItem.colorClass}`}>
                        {displayedText}
                        <span className="inline-block w-0.5 h-4 ml-1 bg-current animate-pulse align-middle" />
                    </p>
                </div>

                {/* Grid dos Cards com Glow Neon no Hover e Textos em 1 Linha */}
               {/* Grid dos Cards com maior altura (py-5) e preservando Glow e Textos alinhados */}
                <div className="pt-4 grid grid-cols-3 gap-3 text-[10px] xl:text-xs font-semibold tracking-wider uppercase">
                    
                    {/* Node Exporter */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-brand-primary/60 text-text-muted hover:text-brand-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(255,87,51,0.35)] cursor-default whitespace-nowrap">
                        <Cpu className="w-4 h-4 text-brand-primary shrink-0" />
                        <span>NODE EXPORTER</span>
                    </div>

                    {/* Telegraf */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-status-info/60 text-text-muted hover:text-status-info transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(0,198,255,0.35)] cursor-default whitespace-nowrap">
                        <Terminal className="w-4 h-4 text-status-info shrink-0" />
                        <span>TELEGRAF</span>
                    </div>

                    {/* Zabbix Agent */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-status-danger/60 text-text-muted hover:text-status-danger transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(236,0,0,0.35)] cursor-default whitespace-nowrap">
                        <Activity className="w-4 h-4 text-status-danger shrink-0" />
                        <span>ZABBIX AGENT</span>
                    </div>

                    {/* Servidores */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-status-success/60 text-text-muted hover:text-status-success transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(0,210,106,0.35)] cursor-default whitespace-nowrap">
                        <Server className="w-4 h-4 text-status-success shrink-0" />
                        <span>SERVIDORES</span>
                    </div>

                    {/* Bancos de Dados */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-status-warning/60 text-text-muted hover:text-status-warning transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(245,158,11,0.35)] cursor-default whitespace-nowrap">
                        <Database className="w-4 h-4 text-status-warning shrink-0" />
                        <span>BANCOS DE DADOS</span>
                    </div>

                    {/* APIs & Serviços */}
                    <div className="group relative flex items-center justify-center gap-1.5 px-3 py-5 bg-bg-hover/40 hover:bg-bg-hover rounded-xl border border-border-subtle hover:border-brand-primary/60 text-text-muted hover:text-brand-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(255,87,51,0.35)] cursor-default whitespace-nowrap">
                        <HardDrive className="w-4 h-4 text-brand-primary shrink-0" />
                        <span>APIS & SERVIÇOS</span>
                    </div>

                </div>
            </div>
        </div>
    );
};