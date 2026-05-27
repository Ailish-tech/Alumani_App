import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'alumniconnect_token';

let socket: Socket | null = null;

/**
 * Connect to the Socket.io server.
 * Re-uses the existing socket if already connected.
 * Sends the Firebase ID token for authentication.
 */
export async function connectSocket(userId: string): Promise<Socket> {
  if (socket?.connected) return socket;

  // Disconnect old socket if exists
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  // Get the Firebase ID token from secure storage
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.warn('[Socket] Could not read auth token:', e);
  }

  // Extract the base origin from the API URL (remove /api)
  const baseUrl = API_BASE_URL.replace('/api', '');
  console.log(`[Socket] Connecting to ${baseUrl} as user ${userId}`);

  socket = io(baseUrl, {
    auth: { token: token || undefined, userId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    forceNew: false,
  });

  socket.on('connect', () => {
    console.log(`[Socket] ✅ Connected! ID: ${socket?.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] ❌ Disconnected: ${reason}`);
  });

  socket.on('connect_error', (err) => {
    console.log(`[Socket] ⚠️ Connection error: ${err.message}`);
  });

  socket.on('reconnect', (attempt) => {
    console.log(`[Socket] 🔄 Reconnected after ${attempt} attempt(s)`);
  });

  return socket;
}

/**
 * Get the current socket instance (or null if not connected).
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleaned up');
  }
}
