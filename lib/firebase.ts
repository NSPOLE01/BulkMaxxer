import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// AsyncStorage-backed persistence for React Native (Firebase v11 removed getReactNativePersistence)
const asyncStoragePersistence = {
  ...inMemoryPersistence,
  type: 'LOCAL' as Persistence['type'],
  // Firebase internally calls these underscore methods
  _isAvailable: async () => true,
  _set: async (key: string, value: object) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  _get: async <T>(key: string): Promise<T | null> => {
    const item = await AsyncStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  },
  _remove: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
  _addListener: (_key: string, _listener: () => void) => {},
  _removeListener: (_key: string, _listener: () => void) => {},
} as unknown as Persistence;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws on hot-reload; fall back to getAuth
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: asyncStoragePersistence });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
