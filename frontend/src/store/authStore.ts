import { create } from 'zustand';
import { User, Role } from '../types';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ─── Secure Storage Keys ───────────────────────────────────────────────────────

const TOKEN_KEY = 'alumniconnect_token';
const USER_KEY = 'alumniconnect_user';

// ─── Auth State Interface ──────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  /** Firebase email/password login */
  login: (email: string, password: string) => Promise<void>;
  /** Firebase email/password signup → backend register */
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    domain?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  /** Rehydrate session from SecureStore on app launch */
  hydrate: () => Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Get a fresh Firebase ID token and persist it */
async function persistFirebaseToken(credential: UserCredential): Promise<string> {
  const idToken = await credential.user.getIdToken();
  await SecureStore.setItemAsync(TOKEN_KEY, idToken);
  return idToken;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  // ── Login ──────────────────────────────────────────────────────────────────

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await persistFirebaseToken(credential);

      set({ accessToken: idToken });

      // Fetch profile from backend
      const res = await api.get('/auth/me');
      const user: User = res.data.data;

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Signup ─────────────────────────────────────────────────────────────────

  signup: async ({ email, password, fullName, role, domain }) => {
    set({ isLoading: true });
    try {
      // 1. Create Firebase account
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await persistFirebaseToken(credential);

      set({ accessToken: idToken });

      // 2. Register profile in backend (DynamoDB)
      const res = await api.post('/auth/register', {
        fullName,
        email,
        role,
        domain,
      });
      const user: User = res.data.data;

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout: async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore Firebase signout errors
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  // ── Fetch Profile ──────────────────────────────────────────────────────────

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Hydrate ────────────────────────────────────────────────────────────────

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        const user: User = JSON.parse(userJson);

        // Refresh token if Firebase user is still signed in
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true);
          await SecureStore.setItemAsync(TOKEN_KEY, freshToken);
          set({ accessToken: freshToken, user, isAuthenticated: true, isHydrated: true });
        } else {
          // Firebase session expired — use cached token (may still work)
          set({ accessToken: token, user, isAuthenticated: true, isHydrated: true });
        }
        return;
      }
    } catch (err) {
      console.warn('[Auth] Hydration failed:', err);
    }
    set({ isHydrated: true });
  },
}));
