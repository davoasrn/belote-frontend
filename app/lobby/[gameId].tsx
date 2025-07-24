import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, Share, Pressable } from 'react-native';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../store/authStore';

export default function LobbyScreen() {
  const { gameId } = useLocalSearchParams();
  const { socket, lobbyState, gameState } = useSocket();
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    // When the game starts, the server sends a 'gameUpdate'.
    // This effect detects that and navigates to the game screen.
    if (gameState && gameState.gameId === gameId) {
        router.replace(`/${gameId}`);
    }
  }, [gameState, gameId, router]);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${gameId}`,
        title: 'Belote Game Lobby ID'
      });
    } catch (error) {
      alert((error as Error).message);
    }
  };

  // A helper to safely decode the JWT and get the user ID
  const getUserIdFromToken = (authToken: string | null): string | null => {
    if (!authToken) return null;
    try {
      // Basic JWT decode (for client-side display only, not for security)
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      return payload.sub; // 'sub' is the standard claim for subject (user ID)
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  };

  const isHost = getUserIdFromToken(token) === lobbyState?.hostId;

  if (!lobbyState) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Lobby</Text>
      <Pressable onPress={onShare}>
        <Text style={styles.gameId}>Lobby ID: {gameId}</Text>
      </Pressable>
      <Text style={styles.shareHint}>(Tap ID to Share)</Text>

      <View style={styles.playerList}>
        <Text style={styles.playerListTitle}>Players ({lobbyState.players.length}/4)</Text>
        {lobbyState.players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.name} {player.id === lobbyState.hostId ? '👑' : ''}</Text>
          </View>
        ))}
        {Array.from({ length: 4 - lobbyState.players.length }).map((_, i) => (
            <View key={`empty-${i}`} style={[styles.playerRow, styles.emptySlot]}>
                <Text style={styles.emptySlotText}>Waiting for player...</Text>
            </View>
        ))}
      </View>

      {isHost && (
        <Button
          title="Start Game"
          onPress={() => socket?.emit('startGame', gameId)}
          disabled={lobbyState.players.length < 1} // Host can start with bots
        />
      )}
      {!isHost && (
        <Text style={styles.waitingText}>Waiting for the host to start the game...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#1e293b' },
  gameId: { fontSize: 20, color: '#4338ca', fontWeight: '500' },
  shareHint: { fontSize: 14, color: '#64748b', marginBottom: 30, fontStyle: 'italic' },
  playerList: { width: '100%', marginVertical: 20 },
  playerListTitle: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center', color: '#334155' },
  playerRow: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  playerName: { fontSize: 18, fontWeight: '500' },
  emptySlot: { backgroundColor: '#e2e8f0' },
  emptySlotText: { fontSize: 18, color: '#94a3b8', fontStyle: 'italic' },
  waitingText: { fontSize: 16, color: '#475569', fontStyle: 'italic', marginTop: 20 },
});
