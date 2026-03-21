import { create } from 'zustand';
import { MentorshipRequest, User } from '../types';
import api from '../services/api';

interface MentorshipState {
  mentors: User[];
  myMentorships: { asStudent: MentorshipRequest[]; asMentor: MentorshipRequest[] };
  isLoading: boolean;

  searchMentors: (domain?: string) => Promise<void>;
  requestMentorship: (mentorId: string, topic: string) => Promise<void>;
  respondToMentorship: (id: string, status: 'ACCEPTED' | 'REJECTED', channel?: string, scheduledTime?: string) => Promise<void>;
  completeMentorship: (id: string) => Promise<void>;
  fetchMyMentorships: () => Promise<void>;
}

export const useMentorshipStore = create<MentorshipState>((set) => ({
  mentors: [],
  myMentorships: { asStudent: [], asMentor: [] },
  isLoading: false,

  searchMentors: async (domain) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/mentorship/search-mentors', { params: { domain } });
      set({ mentors: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  requestMentorship: async (mentorId, topic) => {
    await api.post('/mentorship/request', { mentorId, topic });
  },

  respondToMentorship: async (id, status, channel, scheduledTime) => {
    await api.put(`/mentorship/${id}/respond`, { status, channel, scheduledTime });
  },

  completeMentorship: async (id) => {
    await api.put(`/mentorship/${id}/complete`);
  },

  fetchMyMentorships: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/mentorship/my');
      set({ myMentorships: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
