import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, Suit } from '../types/types';
import { useAuth } from './AuthContext';

const SERVER_URL = 'http://192.168.10.57:3000'; 

interface SocketContextType {
  socket: Socket | null;
  gameState: GameState | null;
  error: string;
  suggestion: Card | Suit | null; // <-- Add suggestion state
  setGameState: (state: GameState | null) => void;
  clearSuggestion: () => void; // <-- Add function to clear suggestion
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<Card | Suit | null>(null);

  const clearSuggestion = () => setSuggestion(null);

  useEffect(() => {
    if (authState.authenticated && authState.token) {
      const newSocket = io(SERVER_URL, {
        extraHeaders: {
          Authorization: `Bearer ${authState.token}`,
        },
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Authenticated socket connected!');
        setError('');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection Error:', err.message);
        setError('Failed to connect to the game server.');
      });
      
      newSocket.on('error', (errorMessage: string) => {
        console.error('Server Error:', errorMessage);
        setError(errorMessage);
      });

      // Listen for suggestion event
      newSocket.on('suggestion', (suggestedMove: Card | Suit | null) => {
        console.log('Suggestion received:', suggestedMove);
        setSuggestion(suggestedMove);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [authState]);

  useEffect(() => {
    if (!socket) return;
    const handleGameUpdate = (newGameState: GameState) => {
      console.log('Received game update. Phase:', newGameState.phase);
      setGameState(newGameState);
      setError('');
      setSuggestion(null); // Clear suggestion on any game update
    };
    socket.on('gameUpdate', handleGameUpdate);
    return () => {
      socket.off('gameUpdate', handleGameUpdate);
    };
  }, [socket]);

  const value = { socket, gameState, error, suggestion, setGameState, clearSuggestion };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
