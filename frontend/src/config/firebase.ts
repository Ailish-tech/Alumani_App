import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore: React Native persistence is not included in the default web types
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Firebase Configuration ────────────────────────────────────────────────────
// Replace these with your Firebase Console project credentials.
// Go to: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyDFoxj2MFHQGiPiN5MTzaSMkZey2TZnAtw",
  authDomain: "alumni-afd3b.firebaseapp.com",
  projectId: "alumni-afd3b",
  storageBucket: "alumni-afd3b.firebasestorage.app",
  messagingSenderId: "312515178750",
  appId: "1:312515178750:web:efc6583a0390bbc47f35af",
  measurementId: "G-13L7GVPRY6"
};

// ─── Initialise (idempotent — safe to call multiple times) ──────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Persist Firebase auth state across app restarts via AsyncStorage.
// Use the default (legacy) AsyncStorage instance which works in Expo Go
// without requiring a custom dev client or TurboModules.
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialised (hot reload)
  auth = getAuth(app);
}

export { app, auth };
