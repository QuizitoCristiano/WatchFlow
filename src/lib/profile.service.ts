import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, sendPasswordResetEmail, type UserProfile } from 'firebase/auth';
import { auth, db, storage } from '@/services/config';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  async updateProfileData(uid: string, data: { name: string }): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      name: data.name,
      updatedAt: serverTimestamp(),
    });

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.name });
    }
  },

  async uploadAvatar(uid: string, file: File): Promise<string> {
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

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL });
    }

    return photoURL;
  },

  async sendPasswordReset(email: string): Promise<void> {
    // RN-PERFIL-03
    await sendPasswordResetEmail(auth, email);
  }
};