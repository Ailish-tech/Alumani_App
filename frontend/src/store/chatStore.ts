import { create } from 'zustand';
import { ChatRoom, Message } from '../types';
import api from '../services/api';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;

  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  createRoom: (otherUserId: string) => Promise<ChatRoom | null>;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/chat/rooms');
      set({ rooms: res.data.data || [], isLoading: false });
    } catch (err: any) {
      console.warn('[ChatStore] fetchRooms error:', err.message);
      set({ isLoading: false, error: 'Could not load conversations' });
    }
  },

  fetchMessages: async (roomId) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      set((s) => ({
        messages: { ...s.messages, [roomId]: res.data.data || [] },
      }));
    } catch (err: any) {
      console.warn('[ChatStore] fetchMessages error:', err.message);
    }
  },

  addMessage: (message) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [message.roomId]: [...(s.messages[message.roomId] || []), message],
      },
      rooms: s.rooms.map((r) =>
        r.id === message.roomId
          ? { ...r, lastMessagePreview: message.content, updatedAt: message.timestamp }
          : r
      ),
    }));
  },

  createRoom: async (otherUserId: string) => {
    try {
      const res = await api.post('/chat/rooms', { otherUserId });
      const room = res.data.data;
      if (room) {
        set((s) => {
          const exists = s.rooms.some((r) => r.id === room.id);
          return {
            rooms: exists ? s.rooms : [room, ...s.rooms],
          };
        });
      }
      return room;
    } catch (err: any) {
      console.warn('[ChatStore] createRoom error:', err.message);
      return null;
    }
  },

  updateRoom: (roomId, updates) => {
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, ...updates } : r
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
