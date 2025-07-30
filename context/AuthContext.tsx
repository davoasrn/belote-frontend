import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { PlayerPreferences } from '../types/types';

const API_URL = 'http://192.168.10.128:3000';

interface AuthState {
  token: string | null;
  authenticated: boolean;
  preferences: PlayerPreferences;
  userId?: string;
  username?: string;
  isLoading: boolean; // <-- Add loading state
}

interface AuthContextType {
  authState: AuthState;
  register: (username: string, password: string) => Promise<any>;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  updatePreferences: (prefs: PlayerPreferences) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticated: false,
    preferences: {},
    isLoading: true, // <-- Start in a loading state
  });

  useEffect(() => {
    const loadUser = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        try {
          const result = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAuthState({
            token,
            authenticated: true,
            preferences: result.data.preferences || {},
            userId: result.data.userId,
            username: result.data.username,
            isLoading: false
          });
        } catch (e) {
          // Token is invalid, treat as logged out
          setAuthState({ token: null, authenticated: false, preferences: {}, isLoading: false });
        }
      } else {
        // No token found, not logged in
        setAuthState({ token: null, authenticated: false, preferences: {}, isLoading: false });
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await axios.post(`${API_URL}/auth/login`, { username, password });
      const token = result.data.access_token;
      await SecureStore.setItemAsync('authToken', token);
      
      const profileResult = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuthState({
        token,
        authenticated: true,
        preferences: profileResult.data.preferences || {},
        userId: profileResult.data.userId,
        username: profileResult.data.username,
        isLoading: false
      });
      return result;
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  };

  const updatePreferences = async (prefs: PlayerPreferences) => {
    try {
      const result = await axios.patch(`${API_URL}/user/preferences`, prefs, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      setAuthState(prev => ({ ...prev, preferences: result.data.preferences }));
      return result;
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setAuthState({ token: null, authenticated: false, preferences: {}, isLoading: false });
  };

  const register = async (username: string, password: string) => {
    try {
      return await axios.post(`${API_URL}/auth/register`, { username, password });
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  };

  const value = { authState, register, login, logout, updatePreferences };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
