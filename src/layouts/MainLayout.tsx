import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Plug,
    Server,
    Activity,
    Bell,
    FileSpreadsheet,
    Settings, // Ícone ideal para Configurações
    Users,    // Para "Sobre Nós"
    LogOut,
    ActivityIcon,
    Bird,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

export const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
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
        { label: 'Configurações', path: '/settings', icon: Settings, hideMobile: true },
        { label: 'Sobre o Nos', path: '/about', icon: Users, hideMobile: true },
    ];

    const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

    return (
        <div className="flex h-screen bg-bg-app text-text-body overflow-hidden antialiased">

            {/* 💻 Sidebar Lateral Desktop */}
            <aside className="hidden md:flex w-64 bg-bg-card border-r border-border-subtle flex-col justify-between shrink-0">
                <div>
                    {/* Brand / Logo com Altura Fixa Alinhada ao Header (h-16) */}
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
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
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

                {/* Perfil do Usuário e Logout */}
                <div className="p-4 border-t border-border-subtle">
                    <div className="flex items-center justify-between gap-3 px-2 py-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                                {userInitial.toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-text-heading truncate">
                                    {user?.displayName || 'Usuário'}
                                </p>
                                <p className="text-xs text-text-muted truncate">{user?.email}</p>
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

            {/* 🚀 Área de Conteúdo */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
                {/* Header Superior com Altura Fixa (h-16) */}
                <header className="h-16 bg-bg-card/80 border-b border-border-subtle px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="bg-brand-primary/10 text-brand-primary p-1.5 rounded-lg border border-brand-primary/20">
                            <ActivityIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-base text-text-heading">
                            Watch<span className="text-brand-primary">Flow</span>
                        </span>
                    </div>

                    <h2 className="hidden md:block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Plataforma Centralizada de Monitoramento
                    </h2>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/alerts')}
                            className="p-2 text-text-muted hover:text-text-heading rounded-lg hover:bg-bg-hover transition-colors relative cursor-pointer"
                        >
                            <Bell className="w-5 h-5 md:w-4 md:h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
                        </button>
                    </div>
                </header>

                {/* Área de Rota (Main Content) */}
                <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* 📱 Bottom Navigation (Mobile) */}
            <nav className="md:hidden fixed bottom-0 w-full bg-bg-card/95 border-t border-border-subtle backdrop-blur-md z-50 px-2 py-2 flex items-center justify-around">
                {menuItems.filter(item => !item.hideMobile).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] transition-all cursor-pointer ${isActive ? 'text-brand-primary' : 'text-text-muted'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};