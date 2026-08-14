'use client';
import { create } from 'zustand';
import { authApi } from './api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('de_token');
      const userStr = localStorage.getItem('de_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, ...user } = res.data.data;
    localStorage.setItem('de_token', token);
    localStorage.setItem('de_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem('de_token');
    localStorage.removeItem('de_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    localStorage.setItem('de_user', JSON.stringify(user));
    set({ user });
  },

  // Role checks
  isAdmin: () => get().user?.role === 'owner_admin',
  isManager: () => ['owner_admin', 'manager'].includes(get().user?.role),
  isSupervisor: () => ['owner_admin', 'manager', 'supervisor'].includes(get().user?.role),
  isWorker: () => get().user?.role === 'worker',
  isAccountant: () => ['owner_admin', 'accountant'].includes(get().user?.role),
  hasRole: (...roles) => roles.includes(get().user?.role),
}));

export default useAuthStore;
