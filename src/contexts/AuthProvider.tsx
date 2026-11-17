import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, sendPasswordResetEmail as firebaseSendReset } from "firebase/auth";

import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginWithGithub,
  logoutUser,
} from "@/services/auth.service";

import { AuthContext } from "./AuthContext";
import { auth, isFirebaseConfigured } from "@/services/config";

// Local identity is only a development convenience; it is never accepted in production.
function createLocalUser(email: string): User {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }
  const encoded = btoa(normalizedEmail).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return {
    uid: `local-${encoded}`,
    email: normalizedEmail,
    displayName: normalizedEmail.split("@")[0],
    photoURL: null,
    emailVerified: true,
  } as User;
}

function requireDevelopmentFallback(): void {
  if (import.meta.env.PROD) {
    throw new Error("Autenticação indisponível: configure o Firebase antes de publicar o WatchFlow.");
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isFirebaseConfigured && Boolean(auth));

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const sendResetPasswordEmail = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await firebaseSendReset(auth, email);
      return;
    }
    requireDevelopmentFallback();
    throw new Error("Recuperação de senha exige Firebase configurado.");
  };

  const handleLoginWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) return loginWithEmail(email, pass);
    requireDevelopmentFallback();
    if (!pass) throw new Error("Informe sua senha.");
    const localUser = createLocalUser(email);
    setUser(localUser);
    return localUser;
  };

  const handleRegisterWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) return registerWithEmail(email, pass);
    requireDevelopmentFallback();
    if (pass.length < 8) throw new Error("A senha deve possuir pelo menos 8 caracteres.");
    const localUser = createLocalUser(email);
    setUser(localUser);
    return localUser;
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await logoutUser();
    } else {
      setUser(null);
    }
  };

  const unsupportedLocalProvider = async (): Promise<User> => {
    requireDevelopmentFallback();
    throw new Error("Login social exige Firebase configurado.");
  };

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    loginWithEmail: handleLoginWithEmail,
    registerWithEmail: handleRegisterWithEmail,
    loginWithGoogle: isFirebaseConfigured ? loginWithGoogle : unsupportedLocalProvider,
    loginWithGithub: isFirebaseConfigured ? loginWithGithub : unsupportedLocalProvider,
    logout: handleLogout,
    sendResetPasswordEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
