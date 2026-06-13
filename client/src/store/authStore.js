const API_URL = import.meta.env.VITE_API_URL || '/api';
import { create } from 'zustand';
import api from '../lib/api';
import { socket, joinUserRoom, leaveUserRoom } from '../lib/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Load profile of currently logged in user
  loadUser: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
      
      // Connect socket and join user room
      socket.connect();
      joinUserRoom(res.data.user._id);
    } catch (err) {
      console.error('Load user failed:', err.response?.data?.message || err.message);
      get().logout();
      set({ isLoading: false });
    }
  },

  // Register user
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });

      // Connect socket and join user room
      socket.connect();
      joinUserRoom(user.id);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });

      // Connect socket and join user room
      socket.connect();
      joinUserRoom(user.id);
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  // Logout
  logout: () => {
    const { user } = get();
    if (user) {
      leaveUserRoom(user.id || user._id);
    }
    
    localStorage.removeItem('token');
    socket.disconnect();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // Update user KYC or roles
  updateUser: (updatedFields) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : null,
    }));
  },

  clearError: () => set({ error: null }),
}));
