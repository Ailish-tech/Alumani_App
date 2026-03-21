import { create } from 'zustand';
import { User, Role } from '../types';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

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

  login: (accessToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  devLogin: (userId: string, role: Role) => Promise<void>;
  fetchProfile: () => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    role: Role;
    domain?: string;
    skills?: string[];
  }) => Promise<void>;
  /** Rehydrate session from SecureStore on app launch */
  hydrate: () => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: async (accessToken: string, userData: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    set({ accessToken, user: userData, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  devLogin: async (userId: string, role: Role) => {
    const devToken = `dev:${userId}:${role}`;
    set({ accessToken: devToken, isLoading: true });
    try {
      // Try to fetch existing profile
      const res = await api.get('/auth/me');
      const user = res.data.data;
      await SecureStore.setItemAsync(TOKEN_KEY, devToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Profile doesn't exist yet — auto-register in DynamoDB
      try {
        const regRes = await api.post('/auth/register', {
          fullName: userId,
          email: `${userId}@dev.local`,
          role,
        });
        const user = regRes.data.data;
        await SecureStore.setItemAsync(TOKEN_KEY, devToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (regErr) {
        // Registration also failed — use local fallback (offline mode)
        console.warn('[Auth] Dev register failed, using local fallback:', regErr);
        const fallbackUser: User = {
          id: userId,
          email: `${userId}@dev.local`,
          role,
          fullName: userId,
          profilePicUrl: '',
          skills: [],
          domain: '',
          reputationScore: 0,
          studentsGuided: 0,
          isBanned: false,
        };
        await SecureStore.setItemAsync(TOKEN_KEY, devToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(fallbackUser));
        set({ user: fallbackUser, isAuthenticated: true, isLoading: false });
      }
    }
  },

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

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      set({ user: res.data.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        set({ accessToken: token, user, isAuthenticated: true, isHydrated: true });
        return;
      }
    } catch (err) {
      console.warn('[Auth] Hydration failed:', err);
    }
    set({ isHydrated: true });
  },
}));
