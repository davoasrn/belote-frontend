import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { PlayerPreferences } from '../types/types';

const API_URL = 'http://192.168.10.128:3000';

interface AuthState {
  token: string | null;
  authenticated: boolean;
  preferences: PlayerPreferences;
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
  });

  useEffect(() => {
    const loadUser = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        try {
          // The backend needs to be updated to return preferences on the profile endpoint.
          // This is a placeholder for that functionality.
          const result = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Assuming the profile endpoint will return a user object with a preferences key
          setAuthState({ token, authenticated: true, preferences: result.data.preferences || {} });
        } catch (e) {
          logout(); // Token is invalid or expired
        }
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await axios.post(`${API_URL}/auth/login`, { username, password });
      const token = result.data.access_token;
      await SecureStore.setItemAsync('authToken', token);
      
      // After login, fetch profile to get preferences
      const profileResult = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuthState({ token, authenticated: true, preferences: profileResult.data.preferences || {} });
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
    setAuthState({ token: null, authenticated: false, preferences: {} });
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
