import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// --- ⚠️ IMPORTANT ACTION REQUIRED ⚠️ ---
// This must be the same IP address as in your SocketContext
const API_URL = 'http://192.168.10.57:3000/auth'; // <-- CHANGE THIS IP

interface AuthContextType {
  authState: { token: string | null; authenticated: boolean };
  register: (username: any, password: any) => Promise<any>;
  login: (username: any, password: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<{ token: string | null; authenticated: boolean }>({
    token: null,
    authenticated: false,
  });

  useEffect(() => {
    // Check if a token is stored on the device when the app loads
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        setAuthState({ token, authenticated: true });
      }
    };
    loadToken();
  }, []);

  const register = async (username: string, password: string) => {
    try {
      return await axios.post(`${API_URL}/register`, { username, password });
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const result = await axios.post(`${API_URL}/login`, { username, password });
      setAuthState({
        token: result.data.access_token,
        authenticated: true,
      });
      await SecureStore.setItemAsync('authToken', result.data.access_token);
      return result;
    } catch (e) {
      return { error: true, msg: (e as any).response.data.message };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setAuthState({ token: null, authenticated: false });
  };

  const value = {
    authState,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
