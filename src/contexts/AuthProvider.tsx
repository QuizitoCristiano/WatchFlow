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

// Usuário local para desenvolvimento/teste sem travar tela se não houver Firebase
const LOCAL_DEV_USER: any = {
  uid: "usr_local_dev_001",
  email: "admin@watchflow.local",
  displayName: "Administrador WatchFlow",
  photoURL: null,
  emailVerified: true,
};

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(() => {
    if (!isFirebaseConfigured || !auth) {
      const stored = localStorage.getItem("wf_local_user");
      return stored ? JSON.parse(stored) : LOCAL_DEV_USER;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(isFirebaseConfigured && Boolean(auth));

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const sendResetPasswordEmail = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await firebaseSendReset(auth, email);
    } else {
      console.log(`[Modo Local] E-mail de recuperação simulado para: ${email}`);
    }
  };

  const handleLoginWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) {
      return await loginWithEmail(email, pass);
    }
    const localUser = {
      ...LOCAL_DEV_USER,
      email,
      displayName: email.split("@")[0],
    };
    localStorage.setItem("wf_local_user", JSON.stringify(localUser));
    setUser(localUser);
    return localUser as User;
  };

  const handleRegisterWithEmail = async (email: string, pass: string): Promise<User> => {
    if (isFirebaseConfigured && auth) {
      return await registerWithEmail(email, pass);
    }
    const localUser = {
      ...LOCAL_DEV_USER,
      email,
      displayName: email.split("@")[0],
    };
    localStorage.setItem("wf_local_user", JSON.stringify(localUser));
    setUser(localUser);
    return localUser as User;
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await logoutUser();
    } else {
      localStorage.removeItem("wf_local_user");
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    loginWithEmail: handleLoginWithEmail,
    registerWithEmail: handleRegisterWithEmail,
    loginWithGoogle: isFirebaseConfigured ? loginWithGoogle : async () => {
      setUser(LOCAL_DEV_USER);
      return LOCAL_DEV_USER as User;
    },
    loginWithGithub: isFirebaseConfigured ? loginWithGithub : async () => {
      setUser(LOCAL_DEV_USER);
      return LOCAL_DEV_USER as User;
    },
    logout: handleLogout,
    sendResetPasswordEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
