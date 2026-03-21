import { create } from 'zustand';
import { ChatRoom, Message } from '../types';
import api from '../services/api';

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  isLoading: boolean;

  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/chat/rooms');
      set({ rooms: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (roomId) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      set((s) => ({
        messages: { ...s.messages, [roomId]: res.data.data },
      }));
    } catch {}
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
}));
