import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, storage, isFirebaseConfigured } from '@/services/config';
import type { UserProfile } from '@/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const localProfileKey = (uid: string) => `wf_local_profile:${uid}`;

const getAuthenticatedUser = (uid: string) => {
  if (!isFirebaseConfigured || !auth) return null;
  const user = auth.currentUser;
  if (!user) throw new Error('Nenhum usuário autenticado.');
  if (user.uid !== uid) throw new Error('Não é permitido acessar o perfil de outro usuário.');
  return user;
};

function getLocalProfile(uid: string): UserProfile {
  const raw = localStorage.getItem(localProfileKey(uid));
  if (raw) {
    try {
      const profile: unknown = JSON.parse(raw);
      if (
        typeof profile === 'object' && profile !== null &&
        'uid' in profile && profile.uid === uid
      ) return profile as UserProfile;
    } catch {
      // Invalid local profile is ignored and replaced by a safe default.
    }
  }
  return {
    uid,
    name: 'Usuário',
    email: '',
    role: 'viewer',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) throw new Error('Usuário não autenticado.');
    if (isFirebaseConfigured && db) {
      getAuthenticatedUser(uid);
      const snapshot = await getDoc(doc(db, 'users', uid));
      if (!snapshot.exists()) return null;
      const data = snapshot.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : typeof data.createdAt === 'string'
            ? data.createdAt
            : '';
      return { ...data, uid, createdAt } as UserProfile;
    }
    return getLocalProfile(uid);
  },

  async updateProfileData(uid: string, data: { name: string }): Promise<void> {
    const name = data.name.trim();
    if (!name || name.length > 100) throw new Error('Informe um nome com até 100 caracteres.');
    if (isFirebaseConfigured && db) {
      const user = getAuthenticatedUser(uid);
      await updateDoc(doc(db, 'users', uid), {
        name,
        updatedAt: serverTimestamp(),
      });
      if (user) await updateProfile(user, { displayName: name });
      return;
    }
    const updated = { ...getLocalProfile(uid), name, updatedAt: new Date().toISOString() };
    localStorage.setItem(localProfileKey(uid), JSON.stringify(updated));
  },

  async uploadAvatar(uid: string, file: File): Promise<string> {
    if (!uid) throw new Error('Usuário não autenticado.');
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WEBP.');
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error('A imagem deve ter até 2MB.');

    if (isFirebaseConfigured && storage && db) {
      const user = getAuthenticatedUser(uid);
      const storageRef = ref(storage, `profile-images/${uid}/avatar`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const photoURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });
      if (user) await updateProfile(user, { photoURL });
      return photoURL;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Formato de imagem local inválido.'));
          return;
        }
        const updated = { ...getLocalProfile(uid), photoURL: reader.result };
        localStorage.setItem(localProfileKey(uid), JSON.stringify(updated));
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Recuperação de senha exige Firebase configurado.');
    }
    await sendPasswordResetEmail(auth, email);
  },
};
