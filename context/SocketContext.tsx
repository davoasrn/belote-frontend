import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, Suit } from '../types/types';
import { useAuthStore } from '../store/authStore';

const SERVER_URL = 'http://192.168.10.128:3000';

interface LobbyState { gameId: string; hostId: string; players: any[]; }

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean; // <-- Add connection status
  gameState: GameState | null;
  lobbyState: LobbyState | null;
  error: string;
  suggestion: Card | Suit | null;
  setGameState: (state: GameState | null) => void;
  setLobbyState: (state: LobbyState | null) => void;
  clearSuggestion: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false); // <-- New state for connection
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<Card | Suit | null>(null);

  const clearSuggestion = () => setSuggestion(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(SERVER_URL, {
        extraHeaders: { Authorization: `Bearer ${token}` },
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log(`✅ [${Platform.OS}] Socket connected successfully!`);
        setIsConnected(true);
        setError('');
      });
      newSocket.on('disconnect', () => {
        console.log(`❌ [${Platform.OS}] Socket disconnected.`);
        setIsConnected(false);
      });
      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
        setIsConnected(false);
        setError('Failed to connect to the game server.');
      });
      
      newSocket.on('lobbyUpdate', (data: LobbyState) => setLobbyState(data));
      newSocket.on('gameUpdate', (data: GameState) => {
        console.log('[SOCKET-DEBUG] gameUpdate received - phase:', data.phase, 'currentTurnPlayerIndex:', data.currentTurnPlayerIndex, 'players:', data.players.map(p => ({id: p.id, name: p.name, isBot: p.isBot})));
        setLobbyState(null);
        setGameState(data);
        setSuggestion(null);
      });
      newSocket.on('suggestion', (suggestedMove: Card | Suit | null) => {
        setSuggestion(suggestedMove);
      });
      newSocket.on('error', (errorMessage: string) => setError(errorMessage));

      return () => { newSocket.disconnect(); };
    } else {
      socket?.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, token]);

  const value = { socket, isConnected, gameState, lobbyState, error, suggestion, setGameState, setLobbyState, clearSuggestion };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
