import { create } from 'zustand';
import { Post, Comment } from '../types';
import api from '../services/api';

interface PostState {
  feed: Post[];
  isLoading: boolean;

  fetchFeed: () => Promise<void>;
  createPost: (textContent: string, mediaUrls?: string[]) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  fetchComments: (postId: string) => Promise<Comment[]>;
}

export const usePostStore = create<PostState>((set, get) => ({
  feed: [],
  isLoading: false,

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/posts/feed');
      set({ feed: res.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createPost: async (textContent, mediaUrls) => {
    const res = await api.post('/posts', { textContent, mediaUrls });
    set((s) => ({ feed: [res.data.data, ...s.feed] }));
  },

  likePost: async (postId) => {
    // Optimistic update — mark as liked and increment count
    set((s) => ({
      feed: s.feed.map((p) =>
        p.id === postId
          ? { ...p, likesCount: p.likesCount + 1, isLikedByMe: true } as any
          : p
      ),
    }));
    try {
      await api.post(`/posts/${postId}/like`);
    } catch {
      // Revert on failure
      set((s) => ({
        feed: s.feed.map((p) =>
          p.id === postId
            ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLikedByMe: false } as any
            : p
        ),
      }));
    }
  },

  unlikePost: async (postId) => {
    // Optimistic update — mark as unliked and decrement count
    set((s) => ({
      feed: s.feed.map((p) =>
        p.id === postId
          ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLikedByMe: false } as any
          : p
      ),
    }));
    try {
      await api.post(`/posts/${postId}/unlike`);
    } catch {
      // Revert on failure
      set((s) => ({
        feed: s.feed.map((p) =>
          p.id === postId
            ? { ...p, likesCount: p.likesCount + 1, isLikedByMe: true } as any
            : p
        ),
      }));
    }
  },

  addComment: async (postId, content) => {
    const res = await api.post(`/posts/${postId}/comment`, { content });
    set((s) => ({
      feed: s.feed.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ),
    }));
    return res.data.data;
  },

  fetchComments: async (postId) => {
    const res = await api.get(`/posts/${postId}/comments`);
    return res.data.data;
  },
}));
