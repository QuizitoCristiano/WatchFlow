import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, type UserProfile } from 'firebase/auth';
import { auth, db, storage, isFirebaseConfigured } from '@/services/config';

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

export const profileService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Erro ao carregar perfil do Firestore:', err);
      }
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_LOCAL_PROFILE;
  },

  async updateProfileData(uid: string, data: { name: string }): Promise<void> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        name: data.name,
        updatedAt: serverTimestamp(),
      });

      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name });
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
      const storageRef = ref(storage, `profile-images/${uid}/avatar`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { photoURL, updatedAt: serverTimestamp() });

      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
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
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`[Modo Local] E-mail de redefinição de senha enviado para: ${email}`);
    }
  },
};
