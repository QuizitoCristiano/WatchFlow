import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, sendPasswordResetEmail as firebaseSendReset } from "firebase/auth";

// ============================================================
// SERVIÇOS E CONFIGURAÇÃO
// ============================================================

import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginWithGithub,
  logoutUser,
} from "@/services/auth.service";

import { AuthContext } from "./AuthContext";
import { auth } from "@/services/config";

// ============================================================
// PROVIDER
// ============================================================

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================
  // MONITORAMENTO DO ESTADO DA AUTENTICAÇÃO
  // ==========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // ==========================================================
  // RECUPERAÇÃO DE SENHA
  // ==========================================================

  const sendResetPasswordEmail = async (email: string) => {
    await firebaseSendReset(auth, email);
  };

  // ==========================================================
  // VALORES EXPOSTOS NO CONTEXTO
  // ==========================================================

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGithub,
    logout: logoutUser,
    sendResetPasswordEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};