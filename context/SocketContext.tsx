import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, Suit } from '../types/types';
import { useAuth } from './AuthContext';

const SERVER_URL = 'http://192.168.10.128:3000';

interface LobbyState { gameId: string; hostId: string; players: any[]; }

interface SocketContextType {
  socket: Socket | null;
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
  const { authState } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<Card | Suit | null>(null);

  const clearSuggestion = () => setSuggestion(null);

  useEffect(() => {
    if (authState.authenticated && authState.token) {
      const newSocket = io(SERVER_URL, {
        extraHeaders: { Authorization: `Bearer ${authState.token}` },
      });
      setSocket(newSocket);

      newSocket.on('lobbyUpdate', (data: LobbyState) => {
        setError('');
        setLobbyState(data);
      });
      newSocket.on('gameUpdate', (data: GameState) => {
        setError('');
        setLobbyState(null); // Clear lobby state when game starts
        setGameState(data);
      });
      newSocket.on('suggestion', (suggestedMove: Card | Suit | null) => {
        setSuggestion(suggestedMove);
      });
      newSocket.on('error', (errorMessage: string) => {
        console.error('Received server error:', errorMessage);
        setError(errorMessage);
      });

      return () => { newSocket.disconnect(); };
    } else {
      socket?.disconnect();
      setSocket(null);
    }
  }, [authState]);

  const value = { socket, gameState, lobbyState, error, suggestion, setGameState, setLobbyState, clearSuggestion };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
