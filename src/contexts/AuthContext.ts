import { createContext } from "react";
import type { User } from "firebase/auth";

// ============================================================
// TIPO DO CONTEXTO DE AUTENTICAÇÃO
// ============================================================

export interface AuthContextType {
  user: User | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  // ==========================================================
  // AUTENTICAÇÃO COM E-MAIL E SENHA
  // ==========================================================

  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<User>;

  // ==========================================================
  // CADASTRO COM E-MAIL E SENHA
  // ==========================================================

  registerWithEmail: (
    email: string,
    password: string
  ) => Promise<User>;

  // ==========================================================
  // LOGIN COM GOOGLE
  // ==========================================================

  loginWithGoogle: () => Promise<User>;

  // ==========================================================
  // LOGIN COM GITHUB
  // ==========================================================

  loginWithGithub: () => Promise<User>;



  sendResetPasswordEmail: (email: string) => Promise<void>;

  // ==========================================================
  // LOGOUT
  // ==========================================================

  logout: () => Promise<void>;

  
}

// ============================================================
// CONTEXTO
// ============================================================

export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);