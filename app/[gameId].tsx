import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView,  ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card, GamePhase, Player, GameState } from '../types/types';
import CardView from '../components/CardView';
import CardBackView, { CardBackThemeID } from '../components/CardBackView';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const tableThemes: Record<string, string> = {
  green_felt: '#059669',
  dark_wood: '#4a2c2a',
  blue_velvet: '#1e3a8a',
};

const PlayerDisplay = ({ player, position, isCurrentTurn }: { player: Player; position: 'north' | 'south' | 'west' | 'east'; isCurrentTurn: boolean; }) => (
  <View style={[styles.player, styles[position], isCurrentTurn && styles.currentPlayerTurn, player.disconnected && styles.disconnectedPlayer]}>
    <Text style={styles.playerName}>{player.name}</Text>
    {player.disconnected ? (
        <Text style={styles.disconnectedText}>Disconnected</Text>
    ) : (
      <View style={styles.opponentHand}>
        {position !== 'south' && Array.from({ length: player.hand.length }).map((_, index) => (
          <View key={index} style={{ marginLeft: index > 0 ? -55 : 0 }}>
            <CardBackView cardBackTheme={player.preferences?.cardBack as CardBackThemeID} />
          </View>
        ))}
      </View>
    )}
  </View>
);

export default function GameScreen() {
  const router = useRouter();
  const { socket, gameState, setGameState } = useSocket();
  const { authState } = useAuth();

  // This effect tells React Native to animate any layout changes that occur on the next render.
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [gameState?.currentTrick, gameState?.players[0].hand]); // Trigger animation when trick or hand changes

  const handlePlayCard = (card: Card) => {
    if (socket && gameState) socket.emit('playCard', { gameId: gameState.gameId, card });
  };
  
  const handleExitGame = () => {
    router.back();
    setTimeout(() => setGameState(null), 500);
  };

  if (!gameState) {
    return <View style={styles.container}><Text>Loading game...</Text></View>;
  }

  const tableThemeColor = tableThemes[authState.preferences?.tableTheme || 'green_felt'];
  const humanPlayer = gameState.players[0];
  const isHumanTurn = gameState.currentTurnPlayerIndex === 0;
  const isPlayingPhase = gameState.phase === GamePhase.Playing;

  const legalMoves = isPlayingPhase && isHumanTurn ? getLegalMoves(humanPlayer, gameState) : [];
  const legalMoveSet = new Set(legalMoves.map(c => `${c.rank}-${c.suit}`));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tableThemeColor }]}>
      <View style={styles.table}>
        <PlayerDisplay player={gameState.players[2]} position="north" isCurrentTurn={gameState.currentTurnPlayerIndex === 2} />
        <View style={styles.middleRow}>
            <PlayerDisplay player={gameState.players[3]} position="west" isCurrentTurn={gameState.currentTurnPlayerIndex === 3} />
            <View style={styles.trickArea}>
                {gameState.currentTrick.map(({ card }, index) => (
                    <View key={`${card.suit}-${card.rank}`} style={[styles.trickCard, { marginLeft: index > 0 ? -50 : 0 }]}>
                        <CardView card={card} />
                    </View>
                ))}
            </View>
            <PlayerDisplay player={gameState.players[1]} position="east" isCurrentTurn={gameState.currentTurnPlayerIndex === 1} />
        </View>
        <PlayerDisplay player={humanPlayer} position="south" isCurrentTurn={isHumanTurn} />
      </View>

      <View style={styles.humanPlayerArea}>
        <View style={styles.infoBox}>
            <Pressable onPress={handleExitGame}><Text style={styles.exitText}>Exit</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handContainer}>
          {humanPlayer.hand.map((card) => (
            <CardView
              key={`${card.suit}-${card.rank}`}
              card={card}
              onPress={() => handlePlayCard(card)}
              isPlayable={!isPlayingPhase || !isHumanTurn || legalMoveSet.has(`${card.rank}-${card.suit}`)}
              isSuggested={false} // Add suggestion logic later
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Helper function (should be outside the component)
const getLegalMoves = (player: Player, gameState: GameState): Card[] => {
  if (!gameState.trumpSuit) return player.hand;
  const hand = player.hand;
  const trick = gameState.currentTrick;
  if (trick.length === 0) return hand;
  const leadingCard = trick[0].card;
  const leadingSuit = leadingCard.suit;
  const trumpSuit = gameState.trumpSuit;
  const cardsInLeadingSuit = hand.filter(c => c.suit === leadingSuit);
  if (cardsInLeadingSuit.length > 0) return cardsInLeadingSuit;
  const trumpCards = hand.filter(c => c.suit === trumpSuit);
  if (trumpCards.length > 0) return trumpCards;
  return player.hand;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  table: { flex: 1, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5 },
  middleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  trickArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 110, paddingHorizontal: 10 },
  trickCard: { },
  player: { padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', minWidth: 90, minHeight: 60 },
  currentPlayerTurn: { borderColor: '#facc15' },
  disconnectedPlayer: { opacity: 0.5, backgroundColor: '#4b5563' },
  disconnectedText: { color: '#f9fafb', fontWeight: 'bold', fontSize: 12 },
  playerName: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  playerInfo: { fontSize: 12, color: '#fff', marginTop: 4, height: 15 },
  opponentHand: { flexDirection: 'row', marginTop: 4, height: 15, minWidth: 70 },
  north: { alignSelf: 'center' },
  south: { alignSelf: 'center' },
  west: {},
  east: {},
  humanPlayerArea: { backgroundColor: 'rgba(0,0,0,0.2)', borderTopColor: 'rgba(255,255,255,0.2)', borderTopWidth: 1 },
  handContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 130,
  },
  infoBox: { paddingVertical: 12, paddingHorizontal: 20 },
  exitText: { color: '#f87171', fontSize: 16, fontWeight: 'bold' },
});
