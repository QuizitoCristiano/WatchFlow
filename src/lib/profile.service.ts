import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, storage, isFirebaseConfigured } from '@/services/config';
import type { UserProfile } from '@/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const LOCAL_STORAGE_KEY = 'wf_local_profile';

const DEFAULT_LOCAL_PROFILE: UserProfile = {
  uid: 'usr_local_dev_001',
  name: 'Administrador WatchFlow',
  email: 'admin@watchflow.local',
  role: 'admin',
  status: 'active',
  createdAt: '2026-08-18T14:00:00.000Z',
};

const getAuthenticatedUser = (uid: string) => {
  if (!isFirebaseConfigured || !auth) return null;
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Nenhum usuário autenticado.');
  }
  if (user.uid !== uid) {
    throw new Error('Não é permitido acessar o perfil de outro usuário.');
  }

  return user;
};

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        getAuthenticatedUser(uid);
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt instanceof Date
              ? data.createdAt.toISOString()
              : typeof data.createdAt === 'string'
                ? data.createdAt
                : '';

          return { ...data, uid, createdAt } as UserProfile;
        }
      } catch (err) {
        console.warn('Erro ao carregar perfil do Firestore:', err);
      }
    }

    // Modo Local
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_LOCAL_PROFILE;
  },

  async updateProfileData(uid: string, data: { name: string }): Promise<void> {
    if (isFirebaseConfigured && db) {
      const user = getAuthenticatedUser(uid);
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        name: data.name,
        updatedAt: serverTimestamp(),
      });

      if (user) {
        await updateProfile(user, { displayName: data.name });
      }
      return;
    }

    const current = await this.getProfile(uid) || DEFAULT_LOCAL_PROFILE;
    const updated = { ...current, name: data.name, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  },

  async uploadAvatar(uid: string, file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WEBP.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('O tamanho máximo do arquivo é de 2MB.');
    }

    if (isFirebaseConfigured && storage && db) {
      const user = getAuthenticatedUser(uid);
      const storageRef = ref(storage, `profile-images/${uid}/avatar`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { photoURL, updatedAt: serverTimestamp() });

      if (user) {
        await updateProfile(user, { photoURL });
      }
      return photoURL;
    }

    // Modo Local - cria data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoURL = e.target?.result as string;
        const current = await this.getProfile(uid) || DEFAULT_LOCAL_PROFILE;
        const updated = { ...current, photoURL };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        resolve(photoURL);
      };
      reader.readAsDataURL(file);
    });
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`[Modo Local] E-mail de redefinição de senha enviado para: ${email}`);
    }
  },
};
