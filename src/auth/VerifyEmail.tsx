import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle, Bird } from "lucide-react";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { sendVerificationEmail, logoutUser } from "@/services/auth.service";
import { HeroVisual } from "./HeroVisual";

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Contagem regressiva de segurança para o botão de reenviar (evita spam)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await sendVerificationEmail();

      // Notification com Sonner bem explicativa para o usuário
      toast.success("E-mail de verificação reenviado!", {
        description: "Confira sua caixa de entrada e a pasta de Spam/Lixo eletrônico.",
        duration: 5000,
      });

      // Ativa 60s de cooldown para travar o botão contra cliques repetidos
      setCooldown(60);
    } catch (error: unknown) {
      console.error("Erro ao reenviar e-mail de verificação:", error);

      if (error instanceof FirebaseError && error.code === "auth/too-many-requests") {
        toast.error("Muitas tentativas de reenvio.", {
          description: "Aguarde alguns minutos antes de solicitar um novo e-mail.",
        });
        setCooldown(120);
      } else {
        toast.error("Não foi possível reenviar o e-mail.", {
          description: "Sua sessão pode ter expirado. Tente fazer login novamente.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignora caso já esteja desconectado
    } finally {
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex text-text-heading font-sans antialiased">
      {/* Lado Esquerdo - Painel de Verificação */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16">
        {/* Header com Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-bg-card text-brand-primary p-2 rounded-xl border border-border-subtle">
              <Bird className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Watch<span className="text-brand-primary">Flow</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-xs md:text-sm text-text-muted hover:text-text-heading transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-2">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-heading">
              Verifique seu e-mail
            </h1>

            <p className="text-sm text-text-body leading-relaxed max-w-sm mx-auto">
              Enviamos um link de ativação para
              {emailFromState ? (
                <strong className="block mt-1 text-brand-primary font-semibold">
                  {emailFromState}
                </strong>
              ) : (
                " o seu endereço de e-mail cadastrado"
              )}
              .
            </p>

            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle text-left space-y-3 my-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">
                  Abra sua caixa de e-mail e clique no link de confirmação para liberar seu acesso ao painel.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">
                  Não encontrou a mensagem? Confira a pasta de <strong>Spam</strong> ou Lixo Eletrônico.
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={cooldown > 0 || isResending}
                className="w-full py-3 px-4 bg-bg-card hover:bg-bg-hover disabled:opacity-50 text-text-heading font-medium text-sm rounded-xl border border-border-subtle transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
                {cooldown > 0
                  ? `Reenviar e-mail em (${cooldown}s)`
                  : isResending
                  ? "Reenviando..."
                  : "Reenviar e-mail de verificação"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
              >
                Já verifiquei meu e-mail e quero entrar
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé de Segurança */}
        <div className="text-center text-xs text-text-subtle">
          Proteção de Conta WatchFlow • Security by Design
        </div>
      </div>

      {/* Lado Direito - Hero Visual */}
      <HeroVisual />
    </div>
  );
};