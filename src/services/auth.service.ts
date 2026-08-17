import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendEmailVerification,
  reload,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import type { User } from "firebase/auth";

import { auth, db } from "./config";

// ============================================================
// PROVIDERS
// ============================================================

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

const githubProvider = new GithubAuthProvider();

githubProvider.setCustomParameters({
  allow_signup: "true",
});

// ============================================================
// USUÁRIO NO FIRESTORE
// ============================================================

const ensureUserDocument = async (
  user: User
): Promise<void> => {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      role: "user",
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
};

// ============================================================
// LOGIN COM E-MAIL E SENHA
// ============================================================

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
};

// ============================================================
// CADASTRO COM E-MAIL E SENHA
// ============================================================

export const registerWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  const user = credential.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      role: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return user;
};

// ============================================================
// LOGIN / CADASTRO COM GOOGLE
// ============================================================

export const loginWithGoogle = async (): Promise<User> => {
  const credential = await signInWithPopup(
    auth,
    googleProvider
  );

  const user = credential.user;

  await ensureUserDocument(user);

  return user;
};

// ============================================================
// LOGIN / CADASTRO COM GITHUB
// ============================================================

export const loginWithGithub = async (): Promise<User> => {
  const credential = await signInWithPopup(
    auth,
    githubProvider
  );

  const user = credential.user;

  await ensureUserDocument(user);

  return user;
};

// ============================================================
// ENVIAR E-MAIL DE VERIFICAÇÃO
// ============================================================

export const sendVerificationEmail =
  async (): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "Nenhum usuário autenticado."
      );
    }

    if (user.emailVerified) {
      return;
    }

    await sendEmailVerification(user);
  };

// ============================================================
// RECARREGA O USUÁRIO
// ============================================================

export const reloadCurrentUser =
  async (): Promise<User> => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "Nenhum usuário autenticado."
      );
    }

    await reload(user);

    return user;
  };

// ============================================================
// E-MAIL VERIFICADO?
// ============================================================

export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified ?? false;
};

// ============================================================
// LOGOUT
// ============================================================

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};