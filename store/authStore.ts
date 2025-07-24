import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { PlayerPreferences } from '../types/types';

const API_URL = 'http://192.168.10.128:3000';

interface AuthState {
  token: string | null;
  preferences: PlayerPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: boolean; msg?: string }>;
  register: (username: string, password: string) => Promise<{ error?: boolean; msg?: string }>;
  logout: () => void;
  updatePreferences: (prefs: PlayerPreferences) => Promise<{ error?: boolean; msg?: string }>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  preferences: {},
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      try {
        const result = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({
          isAuthenticated: true,
          token,
          preferences: result.data.preferences || {},
          isLoading: false,
        });
      } catch (e) {
        await SecureStore.deleteItemAsync('authToken');
        set({ isAuthenticated: false, token: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const result = await axios.post(`${API_URL}/auth/login`, { username, password });
      const token = result.data.access_token;
      await SecureStore.setItemAsync('authToken', token);
      
      // Fetch profile immediately after login to get all user data
      const profileResult = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        isAuthenticated: true,
        token,
        preferences: profileResult.data.preferences || {},
        isLoading: false,
      });
      return {};
    } catch (err) {
      set({ isLoading: false });
      return { error: true, msg: (err as any).response?.data?.message || 'An error occurred' };
    }
  },

  register: async (username, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      return {};
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    set({ isAuthenticated: false, token: null, preferences: {} });
  },

  updatePreferences: async (prefs) => {
    try {
      const result = await axios.patch(`${API_URL}/user/preferences`, prefs, {
        headers: { Authorization: `Bearer ${get().token}` },
      });
      set({ preferences: result.data.preferences });
      return {};
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  },
}));

// Initialize the auth check when the app loads
useAuthStore.getState().checkAuth();
