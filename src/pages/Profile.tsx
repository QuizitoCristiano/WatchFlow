import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Camera,
  KeyRound,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { UserProfile } from '@/types';
import { profileService } from '@/lib/profile.service';
import { useAuth } from '@/contexts/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [profileState, setProfileState] = useState<{
    userId: string;
    profile: UserProfile | null;
    error: string | null;
  } | null>(null);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProfileState = user && profileState?.userId === user.uid
    ? profileState
    : null;
  const profile = currentProfileState?.profile ?? null;
  const profileLoading = authLoading || (!!user && !currentProfileState);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;

    void profileService.getProfile(user.uid)
      .then((storedProfile) => {
        if (!active) return;

        const nextProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || storedProfile?.name || user.email || '',
          email: user.email || storedProfile?.email || '',
          photoURL: user.photoURL || storedProfile?.photoURL || '',
          role: storedProfile?.role ?? 'viewer',
          status: storedProfile?.status ?? 'active',
          createdAt: storedProfile?.createdAt || user.metadata.creationTime || '',
        };
        setProfileState({ userId: user.uid, profile: nextProfile, error: null });
        setName(nextProfile.name);
        setFeedback(null);
      })
      .catch((error: unknown) => {
        if (!active) return;

        console.error('Erro ao carregar perfil do usuário autenticado:', error);
        setProfileState({
          userId: user.uid,
          profile: null,
          error: error instanceof Error ? error.message : 'Erro ao carregar perfil.',
        });
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || profile.uid !== user.uid) {
      setFeedback({ type: 'error', message: 'É necessário estar autenticado para salvar o perfil.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await profileService.updateProfileData(user.uid, { name });
      setProfileState(prev => prev?.userId === user.uid && prev.profile
        ? { ...prev, profile: { ...prev.profile, name } }
        : prev);
      setFeedback({ type: 'success', message: 'Nome atualizado com sucesso!' });
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao atualizar perfil.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user || !profile || profile.uid !== user.uid) {
      setFeedback({ type: 'error', message: 'É necessário estar autenticado para alterar a foto do perfil.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const newPhotoURL = await profileService.uploadAvatar(user.uid, file);
      setProfileState(prev => prev?.userId === user.uid && prev.profile
        ? { ...prev, profile: { ...prev.profile, photoURL: newPhotoURL } }
        : prev);
      setFeedback({ type: 'success', message: 'Foto de perfil atualizada com sucesso!' });
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar imagem.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetPassword = async () => {
    setFeedback(null);
    try {
      if (!profile?.email) {
        throw new Error('A conta autenticada não possui um e-mail cadastrado.');
      }
      await profileService.sendPasswordReset(profile.email);
      setFeedback({
        type: 'success',
        message: `E-mail de redefinição de senha enviado para ${profile.email}`
      });
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao solicitar troca de senha.',
      });
    }
  };

  const createdAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR')
    : '—';

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-[var(--color-text-muted)]">
        <Loader2 size={20} className="animate-spin" />
        Carregando perfil...
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-sm text-rose-400" role="alert">
        {currentProfileState?.error ?? feedback?.message ?? 'É necessário autenticar-se para acessar o perfil.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-body)] p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="border-b border-[var(--color-border-subtle)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-heading)]">Meu Perfil</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Gerencie suas informações pessoais e credenciais de acesso ao WatchFlow.
        </p>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Card 1: Avatar e Identidade Visual */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-bg-app)] border-2 border-[var(--color-border-strong)] flex items-center justify-center">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-[var(--color-text-muted)]" />
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !user}
            className="absolute bottom-0 right-0 p-2 bg-[var(--color-brand-primary)] text-white rounded-full hover:bg-[var(--color-brand-hover)] transition-colors shadow-lg disabled:opacity-50"
            title="Alterar foto"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">{profile.name}</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
              {profile.status}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">{profile.email}</p>
          <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center sm:justify-start gap-1 pt-1">
            <ShieldCheck size={14} className="text-[var(--color-brand-primary)]" />
            Permissão: <strong className="capitalize text-[var(--color-text-heading)]">{profile.role}</strong>
          </p>
        </div>
      </div>

      {/* Card 2: Formulário de Dados Pessoais */}
      <form onSubmit={handleSaveName} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
        <h3 className="text-md font-semibold text-[var(--color-text-heading)] border-b border-[var(--color-border-subtle)] pb-2">
          Informações Cadastrais
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">
              Nome Completo
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-[var(--color-bg-app)]/50 border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] rounded-lg pl-10 pr-3 py-2 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">
              Cargo
            </label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={profile.role === 'developer' ? 'Desenvolvedor Full Stack' : profile.role}
                disabled
                className="w-full bg-[var(--color-bg-app)]/50 border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] rounded-lg pl-10 pr-3 py-2 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">
              Membro desde
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={createdAt}
                disabled
                className="w-full bg-[var(--color-bg-app)]/50 border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] rounded-lg pl-10 pr-3 py-2 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || !user || name === profile.name}
            className="inline-flex items-center gap-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-md disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Nome
          </button>
        </div>
      </form>

      {/* Card 3: Segurança da Conta */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-6 space-y-4">
        <h3 className="text-md font-semibold text-[var(--color-text-heading)] border-b border-[var(--color-border-subtle)] pb-2 flex items-center gap-2">
          <KeyRound size={18} className="text-[var(--color-brand-primary)]" />
          Segurança da Conta (RN-PERFIL-03)
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] rounded-lg">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-heading)]">Senha de Acesso</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Enviaremos um link de redefinição para o seu e-mail cadastrado.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetPassword}
            className="px-4 py-2 text-xs font-semibold bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg hover:border-[var(--color-brand-primary)] transition-colors whitespace-nowrap"
          >
            Alterar Senha
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;