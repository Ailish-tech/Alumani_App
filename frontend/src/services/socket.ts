import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

const SOCKET_URL = BASE_URL.replace('/api', '');

let socket: Socket | null = null;

/**
 * Connect to the Socket.io server.
 * @param token - Auth token (dev or Firebase JWT)
 */
export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

/**
 * Disconnect from the Socket.io server.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (or null if not connected).
 */
export function getSocket(): Socket | null {
  return socket;
}
