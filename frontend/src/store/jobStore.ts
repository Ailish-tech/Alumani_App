import { create } from 'zustand';
import api from '../services/api';

export interface Job {
  id: string;
  title: string;
  company: string;
  type: 'job' | 'internship';
  description: string;
  location: string;
  applyUrl: string;
  salary: string;
  postedBy: string;
  applicantsCount: number;
  isActive: boolean;
  createdAt: string;
}

interface JobState {
  jobs: Job[];
  isLoading: boolean;
  fetchJobs: (type?: string) => Promise<void>;
  createJob: (data: Partial<Job>) => Promise<void>;
  applyToJob: (jobId: string, coverNote?: string) => Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  isLoading: false,

  fetchJobs: async (type) => {
    set({ isLoading: true });
    try {
      const url = type ? `/jobs?type=${type}` : '/jobs';
      const res = await api.get(url);
      set({ jobs: res.data.data, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createJob: async (data) => {
    try {
      await api.post('/jobs', data);
      get().fetchJobs();
    } catch (e) { throw e; }
  },

  applyToJob: async (jobId, coverNote) => {
    try {
      await api.post(`/jobs/${jobId}/apply`, { coverNote });
      get().fetchJobs();
    } catch (e) { throw e; }
  },
}));
