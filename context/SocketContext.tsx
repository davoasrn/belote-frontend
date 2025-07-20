import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, Suit } from '../types/types';
import { useAuth } from './AuthContext';

const SERVER_URL = 'http://192.168.1.100:3000'; // <-- CHANGE THIS IP

interface LobbyState { gameId: string; hostId: string; players: any[]; }

interface SocketContextType {
  socket: Socket | null;
  gameState: GameState | null;
  lobbyState: LobbyState | null;
  error: string;
  setGameState: (state: GameState | null) => void;
  setLobbyState: (state: LobbyState | null) => void;
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

  useEffect(() => {
    if (authState.authenticated && authState.token) {
      const newSocket = io(SERVER_URL, {
        extraHeaders: { Authorization: `Bearer ${authState.token}` },
      });
      setSocket(newSocket);

      newSocket.on('lobbyUpdate', (data: LobbyState) => setLobbyState(data));
      newSocket.on('gameUpdate', (data: GameState) => {
        setLobbyState(null); // Clear lobby state when game starts
        setGameState(data);
      });
      newSocket.on('error', (errorMessage: string) => setError(errorMessage));

      return () => { newSocket.disconnect(); };
    } else {
      socket?.disconnect();
      setSocket(null);
    }
  }, [authState]);

  const value = { socket, gameState, lobbyState, error, setGameState, setLobbyState };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
