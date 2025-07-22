// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { useSocket } from '../../context/SocketContext';

export default function HomeScreen() {
  const [lobbyId, setLobbyId] = useState('');
  // Use the new isConnected state from the context
  const { socket, error, lobbyState, setLobbyState, setGameState, isConnected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    // When lobbyState is updated, it means we've successfully joined or created a lobby.
    if (lobbyState) {
      router.push(`/lobby/${lobbyState.gameId}`);
    }
  }, [lobbyState]);

  const handleCreateLobby = () => {
    if (socket) {
      // Clear any previous game/lobby state before creating a new one
      setGameState(null);
      setLobbyState(null);
      socket.emit('createLobby');
    }
  };

  const handleJoinLobby = () => {
    if (socket && lobbyId) {
      setGameState(null);
      setLobbyState(null);
      socket.emit('joinLobby', lobbyId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bazar Belote</Text>
        
        {/* Use the isConnected flag to control the loading indicator */}
        {!isConnected ? (
          <View>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        ) : (
          <>
            <Button
              title="Create New Game Lobby"
              onPress={handleCreateLobby}
            />
            
            <Text style={styles.divider}>- OR -</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Lobby ID to Join"
              value={lobbyId}
              onChangeText={setLobbyId}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            <Button
              title="Join Lobby"
              onPress={handleJoinLobby}
              disabled={!lobbyId}
            />
          </>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginBottom: 50 },
  divider: { fontSize: 16, color: '#64748b', marginVertical: 24 },
  input: { height: 50, width: '90%', borderColor: '#94a3b8', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, fontSize: 16, textAlign: 'center', color: '#0f172a', backgroundColor: '#fff' },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20, fontSize: 16 },
  connectingText: { marginTop: 10, color: '#64748b', fontStyle: 'italic' },
});
