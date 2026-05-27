import { create } from 'zustand';
import api from '../services/api';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: 'meetup' | 'webinar' | 'workshop' | 'social';
  imageUrl: string;
  createdBy: string;
  rsvpCount: number;
  createdAt: string;
}

interface EventState {
  events: Event[];
  isLoading: boolean;
  fetchEvents: () => Promise<void>;
  createEvent: (data: Partial<Event>) => Promise<void>;
  rsvpEvent: (eventId: string, status: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,

  fetchEvents: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/events');
      set({ events: res.data.data, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createEvent: async (data) => {
    try {
      await api.post('/events', data);
      get().fetchEvents();
    } catch (e) { throw e; }
  },

  rsvpEvent: async (eventId, status) => {
    try {
      await api.post(`/events/${eventId}/rsvp`, { status });
      get().fetchEvents();
    } catch (e) { throw e; }
  },
}));
