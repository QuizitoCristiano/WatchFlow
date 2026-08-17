import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
    Bird,
    Lock,
    Mail,
    AlertCircle,
    Eye,
    EyeOff,
} from "lucide-react";

import { toast } from "sonner";

import { loginSchema } from "./LogSchema";
import { useAuth } from "@/contexts/useAuth";
import { HeroVisual } from "./HeroVisual";


export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Efeito Typewriter



    const navigate = useNavigate();
    const {
        loginWithEmail,
        loginWithGoogle,
        loginWithGithub,
    } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validation = loginSchema.safeParse({
            email: email.trim(),
            password,
        });

        if (!validation.success) {
            const firstIssue = validation.error.issues[0];
            const errorMessage = firstIssue?.message ?? "Preencha os campos corretamente.";
            setError(errorMessage);
            toast.error(errorMessage);
            return;
        }

        setIsLoading(true);

        try {
            await loginWithEmail(
                validation.data.email,
                validation.data.password
            );

            // Direto para o dashboard sem travar por e-mail não verificado
            toast.success("Login realizado com sucesso!");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Erro de login:", err);

            switch (err.code) {
                case "auth/invalid-credential":
                case "auth/user-not-found":
                case "auth/wrong-password":
                    setError("E-mail ou senha incorretos.");
                    toast.error("E-mail ou senha incorretos.");
                    break;
                case "auth/too-many-requests":
                    setError("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
                    toast.error("Muitas tentativas. Aguarde alguns minutos.");
                    break;
                case "auth/user-disabled":
                    setError("Esta conta foi desativada.");
                    toast.error("Esta conta foi desativada.");
                    break;
                default:
                    setError("Erro ao realizar login. Tente novamente mais tarde.");
                    toast.error("Erro ao realizar login.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    const handleGoogleAuth = async () => {
        setError("");
        setIsLoading(true);
        try {
            await loginWithGoogle();
            toast.success("Autenticado com o Google!");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Erro de autenticação Google:", err);
            toast.error("Não foi possível autenticar com o Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubAuth = async () => {
        setError("");
        setIsLoading(true);
        try {
            await loginWithGithub();
            toast.success("Autenticado com o GitHub!");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Erro de autenticação GitHub:", err);
            toast.error("Não foi possível autenticar com o GitHub.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-app flex text-text-heading font-sans antialiased">
            {/* Lado Esquerdo - Formulário */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-bg-card text-brand-primary p-2 rounded-xl border border-border-subtle">
                            <Bird className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            Watch<span className="text-brand-primary">Flow</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted">
                        <span>Não tem uma conta?</span>
                        <Link
                            to="/register"
                            className="px-3 py-1.5 bg-bg-card hover:bg-bg-hover text-text-heading font-medium rounded-lg transition-colors border border-border-subtle"
                        >
                            Criar conta
                        </Link>
                    </div>
                </div>

                <div className="max-w-sm w-full mx-auto my-auto py-6">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-heading">
                            Bem-vindo ao Watch<span className="text-brand-primary">Flow</span>!
                        </h1>
                        <p className="text-xs text-text-subtle mt-1.5 leading-relaxed">
                            Gerencie e monitore a saúde da sua infraestrutura em tempo real.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-card hover:bg-bg-hover border border-border-subtle hover:border-border-strong rounded-xl text-xs font-semibold text-text-body transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                            </svg>
                            <span>Google</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleGithubAuth}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-bg-card hover:bg-bg-hover border border-border-subtle hover:border-border-strong rounded-xl text-xs font-semibold text-text-body transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span>GitHub</span>
                        </button>
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-subtle"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-bg-app px-2 text-text-subtle">ou com e-mail</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs md:text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-text-muted">E-mail</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-subtle rounded-xl text-text-heading text-sm placeholder-text-subtle/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-text-muted">Senha</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 bg-bg-card border border-border-subtle rounded-xl text-text-heading text-sm placeholder-text-subtle/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-heading transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                to="/auth/forgot-password"
                                className="text-xs text-text-muted hover:text-brand-primary transition-colors"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>

                <div className="text-center text-xs text-text-subtle">
                    Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                </div>
            </div>

            {/* Lado Direito - Painel Visual */}
            <HeroVisual />
        </div>
    );
};