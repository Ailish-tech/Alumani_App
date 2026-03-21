import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

// ─── API Base URL ──────────────────────────────────────────────────────────────
// Your PC's local network IP. Update this if your IP changes.
const LAN_IP = '192.168.1.9';
const BASE_URL = `http://${LAN_IP}:3000/api`;
console.log('[API] Base URL:', BASE_URL);

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth Interceptor ──────────────────────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor (auto-retry + 401 logout) ────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Auto-logout on 401
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx
    const isRetryable =
      !error.response || // network error
      (error.response.status >= 500 && error.response.status < 600);

    const retryCount = config._retryCount || 0;

    if (isRetryable && retryCount < MAX_RETRIES && config) {
      config._retryCount = retryCount + 1;
      console.warn(`[API] Retry ${config._retryCount}/${MAX_RETRIES} for ${config.url}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * config._retryCount!));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL };
