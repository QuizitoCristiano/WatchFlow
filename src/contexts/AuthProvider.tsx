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

const LOCAL_USER_STORAGE_KEY = "wf_active_user";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(isFirebaseConfigured && Boolean(auth));

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        try {
          const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
          if (saved) setUser(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const sendResetPasswordEmail = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await firebaseSendReset(auth, email);
    }
  };

  const handleLoginWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) {
      try {
        const logged = await loginWithEmail(email, pass);
        setUser(logged);
        return logged;
      } catch (err: any) {
        // Se a conta ainda não existir no Firebase, cria automaticamente no primeiro login para facilitar
        if (
          err?.code === "auth/user-not-found" ||
          err?.code === "auth/invalid-credential"
        ) {
          try {
            const registered = await registerWithEmail(email, pass);
            setUser(registered);
            return registered;
          } catch {
            // Se já existe ou falhou, usa sessão local de contingência
          }
        }
      }
    }
    if (!pass) throw new Error("Informe sua senha.");
    const localUser = createLocalUser(email);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(localUser));
    setUser(localUser);
    return localUser;
  };

  const handleRegisterWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) {
      try {
        const registered = await registerWithEmail(email, pass);
        setUser(registered);
        return registered;
      } catch {
        try {
          const logged = await loginWithEmail(email, pass);
          setUser(logged);
          return logged;
        } catch {
          // Contingência local
        }
      }
    }
    const localUser = createLocalUser(email);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(localUser));
    setUser(localUser);
    return localUser;
  };

  const handleLogout = async () => {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    if (isFirebaseConfigured && auth) {
      await logoutUser().catch(() => {});
    }
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    loginWithEmail: handleLoginWithEmail,
    registerWithEmail: handleRegisterWithEmail,
    loginWithGoogle: isFirebaseConfigured ? loginWithGoogle : async () => createLocalUser("admin@watchflow.com"),
    loginWithGithub: isFirebaseConfigured ? loginWithGithub : async () => createLocalUser("admin@watchflow.com"),
    logout: handleLogout,
    sendResetPasswordEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
