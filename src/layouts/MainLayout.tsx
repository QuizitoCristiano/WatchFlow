import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Plug,
    Server,
    Activity,
    Bell,
    FileSpreadsheet,
    Settings,
    Users,
    LogOut,
    Bird,
    User,
    Menu,
    X,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const menuItems = [
        // --- MÓDULO PRINCIPAL ---
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Integrações', path: '/integrations', icon: Plug },
        { label: 'Dispositivos', path: '/devices', icon: Server },
        { label: 'Métricas', path: '/metrics', icon: Activity },

        // --- GESTÃO & ALERTAS ---
        { label: 'Alertas', path: '/alerts', icon: Bell },
        { label: 'Relatórios', path: '/reports', icon: FileSpreadsheet },

        // --- CONFIGURAÇÃO & ACADÊMICO ---
        { label: 'Configurações', path: '/settings', icon: Settings },
        { label: 'Perfil', path: '/profile', icon: User },
        { label: 'Sobre Nós', path: '/about', icon: Users },
    ];

    // Obtém até duas iniciais (ex: "JB" para João Batista)
    const getInitials = (name?: string | null, email?: string | null) => {
        if (name) {
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return name.slice(0, 2).toUpperCase();
        }
        if (email) {
            return email.slice(0, 2).toUpperCase();
        }
        return 'JB';
    };

    const userInitials = getInitials(user?.displayName, user?.email);

    return (
        <div className="flex h-screen bg-bg-app text-text-body overflow-hidden antialiased">

            {/* 💻 Sidebar Lateral Desktop */}
            <aside className="hidden md:flex w-64 bg-bg-card border-r border-border-subtle flex-col justify-between shrink-0">
                <div>
                    {/* Brand / Logo */}
                    <div className="h-16 px-6 border-b border-border-subtle flex items-center gap-3">
                        <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-xl border border-brand-primary/20 flex items-center justify-center shrink-0">
                            <Bird className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-text-heading">
                            Watch<span className="text-brand-primary">Flow</span>
                        </span>
                    </div>

                    {/* Navegação Principal */}
                    <nav className="p-4 space-y-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? 'bg-brand-primary/15 text-brand-primary font-semibold border border-brand-primary/30 shadow-lg shadow-brand-primary/5'
                                            : 'text-text-muted hover:bg-bg-hover hover:text-text-heading'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Perfil do Usuário e Logout Alinhados na Mesma Linha */}
                <div className="p-4 border-t border-border-subtle">
                    <div className="flex items-center justify-between gap-3 px-1 py-1">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Iniciais JB alinhadas e com tamanho proporcional */}
                            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-bold text-xs shrink-0 leading-none">
                                {userInitials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-text-heading truncate leading-snug">
                                    {user?.displayName || 'Quizito cristiano'}
                                </p>
                                <p className="text-xs text-text-muted truncate leading-tight">
                                    {user?.email || 'quizitocristiano10@...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sair"
                            className="p-2 text-text-muted hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* 🚀 Área Central (Header + Main + Rodapé) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app relative">
                
                {/* Header Superior */}
                <header className="h-16 bg-bg-card/80 border-b border-border-subtle px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="bg-brand-primary/10 text-brand-primary p-1.5 rounded-lg border border-brand-primary/20">
                            <Bird className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-base text-text-heading">
                            Watch<span className="text-brand-primary">Flow</span>
                        </span>
                    </div>

                    <h2 className="hidden md:block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Plataforma Centralizada de Monitoramento
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleNavigation('/alerts')}
                            className="p-2 text-text-muted hover:text-text-heading rounded-lg hover:bg-bg-hover transition-colors relative cursor-pointer"
                        >
                            <Bell className="w-5 h-5 md:w-4 md:h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
                        </button>

                        {/* Botão Hamburguer Mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-text-muted hover:text-text-heading rounded-lg hover:bg-bg-hover transition-colors md:hidden cursor-pointer"
                            aria-label="Abrir Menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </header>

                {/* 📱 Menu Hambúrguer Suspenso Mobile */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-bg-card border-b border-border-subtle shadow-2xl z-50 transition-all duration-300 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <nav className="p-4 space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigation(item.path)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                                            isActive
                                                ? 'bg-brand-primary/15 text-brand-primary font-semibold border border-brand-primary/30'
                                                : 'text-text-muted hover:bg-bg-hover hover:text-text-heading'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-border-subtle bg-bg-app/50 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-bold text-xs shrink-0 leading-none">
                                    {userInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-text-heading truncate">
                                        {user?.displayName || 'Quizito cristiano'}
                                    </p>
                                    <p className="text-xs text-text-muted truncate">{user?.email || 'quizitocristiano10@...'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-status-danger bg-status-danger/10 rounded-lg hover:bg-status-danger/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    </div>
                )}

                {/* 📜 Container de Rolar (Conteúdo Principal + Rodapé) */}
                <div className="flex-1 overflow-y-auto flex flex-col justify-between">
                    {/* Área de Conteúdo das Páginas */}
                    <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
                        <Outlet />
                    </main>

                    {/* 🦶 Rodapé Fixo / Flexível */}
                    <footer className="border-t border-border-subtle bg-bg-card/40 py-4 px-6 mt-auto text-xs text-text-muted">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-heading">WatchFlow</span>
                                <span>&copy; {new Date().getFullYear()} — Todos os direitos reservados.</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => handleNavigation('/about')} 
                                    className="hover:text-text-heading transition-colors cursor-pointer"
                                >
                                    Sobre Nós
                                </button>
                                <span>•</span>
                                <span className="font-mono bg-bg-app px-2 py-0.5 rounded border border-border-subtle">
                                    v1.0.0
                                </span>
                            </div>
                        </div>
                    </footer>
                </div>

            </div>
        </div>
    );
};