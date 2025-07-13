import { useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, SafeAreaView } from 'react-native';
import { useSocket } from '../../context/SocketContext';

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('');
  const { socket, gameState, error, setGameState } = useSocket();
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path

  useEffect(() => {
    // Only navigate if we are on the home screen ('/') and a new game has started.
    // This prevents re-navigating on every subsequent game update when this screen
    // is in the background of the navigation stack.
    if (gameState && gameState.gameId && pathname === '/') {
      router.push(`/${gameState.gameId}`);
    }
  }, [gameState, router, pathname]);

  const handleCreateGame = () => {
    if (socket && playerName) {
      // Reset local game state before creating a new one
      setGameState(null);
      socket.emit('createGame', playerName);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.lobby}>
        <Text style={styles.title}>Welcome to Belote!</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={playerName}
          onChangeText={setPlayerName}
          placeholderTextColor="#9ca3af"
        />
        <Button
          title="Create New Game"
          onPress={handleCreateGame}
          disabled={!playerName || !socket?.connected}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!socket?.connected && !error && (
          <Text style={styles.infoText}>Connecting to server...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  lobby: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 30,
  },
  input: {
    height: 50,
    width: '90%',
    borderColor: '#94a3b8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  infoText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
