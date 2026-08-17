import { useState } from "react";
import { Link } from "react-router-dom";
import { Bird, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { HeroVisual } from "./HeroVisual";
import { useAuth } from "@/contexts/useAuth";

export const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { sendResetPasswordEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Informe o seu e-mail.");
            toast.error("Informe o seu e-mail.");
            return;
        }

        setIsLoading(true);

        try {
            await sendResetPasswordEmail(email.trim());
            setIsSubmitted(true);
            toast.success("E-mail de recuperação enviado!");
        } catch (err: any) {
            console.error("Erro ao solicitar redefinição:", err);

            switch (err.code) {
                case "auth/user-not-found":
                case "auth/invalid-email":
                    setError("E-mail não encontrado ou inválido.");
                    toast.error("E-mail não encontrado ou inválido.");
                    break;
                case "auth/too-many-requests":
                    setError("Muitas tentativas. Aguarde alguns minutos.");
                    toast.error("Muitas tentativas. Aguarde alguns minutos.");
                    break;
                default:
                    setError("Erro ao enviar o e-mail. Tente novamente.");
                    toast.error("Erro ao enviar o e-mail.");
            }
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

                    <Link
                        to="/login"
                        className="flex items-center gap-2 text-xs md:text-sm text-text-muted hover:text-text-heading transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar ao login</span>
                    </Link>
                </div>

                <div className="max-w-sm w-full mx-auto my-auto py-6">
                    {!isSubmitted ? (
                        <>
                            <div className="text-center mb-6">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-heading">
                                    Recuperar Senha
                                </h1>
                                <p className="text-xs text-text-subtle mt-1.5 leading-relaxed">
                                    Digite o seu e-mail cadastrado e enviaremos as instruções para você redefinir sua senha.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs md:text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
                                >
                                    {isLoading ? "Enviando..." : "Enviar instrução"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-status-success/10 text-status-success rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-text-heading">E-mail enviado!</h2>
                            <p className="text-xs text-text-subtle leading-relaxed">
                                Verifique a sua caixa de entrada no e-mail <strong className="text-text-heading">{email}</strong> para prosseguir com a redefinição de senha.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block mt-4 w-full py-3 px-4 bg-bg-card hover:bg-bg-hover text-text-heading font-bold text-sm rounded-xl border border-border-subtle transition-all"
                            >
                                Ir para o Login
                            </Link>
                        </div>
                    )}
                </div>

                <div className="text-center text-xs text-text-subtle">
                    WatchFlow &copy; {new Date().getFullYear()} - Sistema de Monitoramento
                </div>
            </div>

            {/* Lado Direito - Painel Visual */}
            <HeroVisual />
        </div>
    );
};