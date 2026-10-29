import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, storage } from '@/services/config';
import type { UserProfile } from '@/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const getAuthenticatedUser = (uid: string) => {
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
    return null;
  },

  async updateProfileData(uid: string, data: { name: string }): Promise<void> {
    const user = getAuthenticatedUser(uid);
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      name: data.name,
      updatedAt: serverTimestamp(),
    });

    await updateProfile(user, { displayName: data.name });
  },

  async uploadAvatar(uid: string, file: File): Promise<string> {
    const user = getAuthenticatedUser(uid);
    // RN-PERFIL-05
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WEBP.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('O tamanho máximo do arquivo é de 2MB.');
    }

    const storageRef = ref(storage, `profile-images/${uid}/avatar`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    // Atualiza Firestore e Auth
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { photoURL, updatedAt: serverTimestamp() });

    await updateProfile(user, { photoURL });

    return photoURL;
  },

  async sendPasswordReset(email: string): Promise<void> {
    // RN-PERFIL-03
    await sendPasswordResetEmail(auth, email);
  }
};