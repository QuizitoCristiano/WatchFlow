import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const requireAuth = () => {
  if (!auth) throw new Error('Firebase Authentication não está configurado.');
  return auth;
};

const requireDb = () => {
  if (!db) throw new Error('Firestore não está configurado.');
  return db;
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({ allow_signup: 'true' });

const ensureUserDocument = async (user: User): Promise<void> => {
  await setDoc(doc(requireDb(), 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    role: 'user',
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  return credential.user;
};

export const registerWithEmail = async (email: string, password: string): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
  const user = credential.user;
  await setDoc(doc(requireDb(), 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    role: 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return user;
};

export const loginWithGoogle = async (): Promise<User> => {
  const credential = await signInWithPopup(requireAuth(), googleProvider);
  await ensureUserDocument(credential.user);
  return credential.user;
};

export const loginWithGithub = async (): Promise<User> => {
  const credential = await signInWithPopup(requireAuth(), githubProvider);
  await ensureUserDocument(credential.user);
  return credential.user;
};

export const sendVerificationEmail = async (): Promise<void> => {
  const user = requireAuth().currentUser;
  if (!user) throw new Error('Nenhum usuário autenticado.');
  if (!user.emailVerified) await sendEmailVerification(user);
};

export const reloadCurrentUser = async (): Promise<User> => {
  const user = requireAuth().currentUser;
  if (!user) throw new Error('Nenhum usuário autenticado.');
  await reload(user);
  return user;
};

export const isEmailVerified = (): boolean => requireAuth().currentUser?.emailVerified ?? false;

export const logoutUser = async (): Promise<void> => {
  await signOut(requireAuth());
};
