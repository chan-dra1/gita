import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { env } from './env';

/**
 * Firebase config is PUBLIC by design — it identifies the project. The real
 * access control is done by Firebase Auth + Firestore Security Rules, not by
 * hiding these values. We still pull them through the validated `env` so any
 * misconfiguration is caught at boot.
 */
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth = getAuth(app);
if (getApps().length === 1 && Platform.OS !== 'web') {
  // initializeAuth must be called before getAuth on native; guard so HMR
  // doesn't double-initialize.
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { app, auth, db };
