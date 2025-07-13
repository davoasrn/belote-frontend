// app/[gameId].tsx
import {  useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  SafeAreaView,
  Button,
  LayoutAnimation, // <-- Import LayoutAnimation
  UIManager, // <-- Import UIManager for Android
  Platform, // <-- Import Platform to check OS
} from 'react-native';
import { useSocket } from '../context/SocketContext';
import { Card, GamePhase, Player, Suit, GameState } from '../types/types';
import CardView from '../components/CardView';
import TurnTimer from '../components/TurnTimer';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TURN_DURATION_SECONDS = 30;

// Helper function to determine legal moves
const getLegalMoves = (player: Player, gameState: GameState): Card[] => {
    if (gameState.phase !== GamePhase.Playing || !gameState.trumpSuit) return player.hand;
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
    return hand;
};

const PlayerDisplay = ({ player, position, isCurrentTurn }: { player: Player; position: 'north' | 'south' | 'west' | 'east'; isCurrentTurn: boolean; }) => (
  <View style={[styles.player, styles[position], isCurrentTurn && styles.currentPlayerTurn, player.disconnected && styles.disconnectedPlayer]}>
    <Text style={styles.playerName}>{player.name}</Text>
    {player.disconnected ? (
        <Text style={styles.disconnectedText}>Disconnected</Text>
    ) : (
        <Text style={styles.playerInfo}>{player.hand.length > 0 ? `${player.hand.length} cards` : ''}</Text>
    )}
  </View>
);

const BiddingControls = ({ onBid, onPass, suggestion }: { onBid: (suit: Suit) => void; onPass: () => void; suggestion: Suit | null }) => (
    <View style={styles.biddingContainer}>
        <Text style={styles.biddingTitle}>Your turn to bid</Text>
        <View style={styles.biddingButtons}>
            {Object.values(Suit).map(suit => (
                <Pressable key={suit} style={[styles.bidButton, suggestion === suit && styles.suggestedButton]} onPress={() => onBid(suit)}>
                    <Text style={styles.bidButtonText}>{suit}</Text>
                </Pressable>
            ))}
            <Pressable style={[styles.bidButton, styles.passButton]} onPress={onPass}>
                <Text style={styles.bidButtonText}>Pass</Text>
            </Pressable>
        </View>
    </View>
);

export default function GameScreen() {
  const router = useRouter();
  const { socket, gameState, setGameState, suggestion, clearSuggestion } = useSocket();
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION_SECONDS);
  const timerRef = useRef<number | null>(null);

  // Effect to trigger animations when the game state changes
  useEffect(() => {
    // Configure the next layout change to have a spring animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [gameState?.currentTrick.length, gameState?.players[0].hand.length]); // Animate on trick/hand changes


  const handlePlayCard = (card: Card) => {
    if (socket && gameState && gameState.phase === GamePhase.Playing) {
      socket.emit('playCard', { gameId: gameState.gameId, card });
    }
  };

  const handleMakeBid = (suit: Suit) => {
    if (socket && gameState && gameState.phase === GamePhase.Bidding) {
      socket.emit('makeBid', { gameId: gameState.gameId, suit });
    }
  };

  const handlePassBid = () => {
     if (socket && gameState && gameState.phase === GamePhase.Bidding) {
      socket.emit('passBid', { gameId: gameState.gameId });
    }
  };

  const handleExitGame = () => {
    clearSuggestion();
    router.back();
    setTimeout(() => setGameState(null), 500);
  };

  if (!gameState) {
    return <View style={styles.container}><Text>Loading game...</Text></View>;
  }

  const humanPlayer = gameState.players[0];
  const isHumanTurn = gameState.currentTurnPlayerIndex === 0;
  const isBiddingPhase = gameState.phase === GamePhase.Bidding;
  const isPlayingPhase = gameState.phase === GamePhase.Playing;
  const isScoringPhase = gameState.phase === GamePhase.Scoring;
  const isFinishedPhase = gameState.phase === GamePhase.Finished;

  const legalMoves = isPlayingPhase && isHumanTurn ? getLegalMoves(humanPlayer, gameState) : [];
  const legalMoveSet = new Set(legalMoves.map(c => `${c.rank}-${c.suit}`));

  const isCardSuggested = (card: Card) => {
    if (!suggestion || typeof suggestion === 'string') return false;
    return suggestion.rank === card.rank && suggestion.suit === card.suit;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.table}>
        <PlayerDisplay player={gameState.players[2]} position="north" isCurrentTurn={gameState.currentTurnPlayerIndex === 2} />
        <View style={styles.middleRow}>
          <PlayerDisplay player={gameState.players[3]} position="west" isCurrentTurn={gameState.currentTurnPlayerIndex === 3} />
          <View style={styles.trickArea}>
            {gameState.currentTrick.map(({ card }, index) => (
                <View key={`${card.suit}-${card.rank}`} style={[styles.trickCard, { marginLeft: index > 0 ? -35 : 0 }]}>
                    <CardView card={card} />
                </View>
            ))}
          </View>
          <PlayerDisplay player={gameState.players[1]} position="east" isCurrentTurn={gameState.currentTurnPlayerIndex === 1} />
        </View>
        <View style={styles.southPlayerContainer}>
            {isHumanTurn && !isBiddingPhase && !isScoringPhase && !isFinishedPhase && <TurnTimer timeLeft={timeLeft} />}
            {isBiddingPhase && isHumanTurn && (
                <BiddingControls onBid={handleMakeBid} onPass={handlePassBid} suggestion={typeof suggestion === 'string' ? suggestion : null} />
            )}
             {isScoringPhase && (
                <View style={styles.scoringBox}>
                    <Text style={styles.scoringTitle}>Round Over!</Text>
                </View>
            )}
            {isFinishedPhase && (
                <View style={styles.scoringBox}>
                    <Text style={styles.scoringTitle}>Game Over!</Text>
                    <Text style={styles.gameOverText}>{gameState.winningTeam} wins!</Text>
                </View>
            )}
            {!isBiddingPhase && !isScoringPhase && !isFinishedPhase && (
                 <PlayerDisplay player={humanPlayer} position="south" isCurrentTurn={isHumanTurn} />
            )}
        </View>
      </View>

      <View style={styles.humanPlayerArea}>
        <View style={styles.infoBox}>
            <View style={styles.infoButtonContainer}>
              <Button title="Exit" onPress={handleExitGame} color="#f87171" />
            </View>
            <Text style={styles.infoText}>Trump: {gameState.trumpSuit || 'None'}</Text>
            <View style={styles.infoButtonContainer}>
                {isHumanTurn && <Button title="Hint" onPress={() => socket?.emit('getSuggestion', { gameId: gameState.gameId })} color="#facc15" />}
            </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handContainer}>
          {humanPlayer.hand.map((card) => (
            <CardView 
                key={`${card.suit}-${card.rank}`} 
                card={card} 
                onPress={() => handlePlayCard(card)}
                isPlayable={!isPlayingPhase || !isHumanTurn || legalMoveSet.has(`${card.rank}-${card.suit}`)}
                isSuggested={isCardSuggested(card)}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#059669',
  },
  table: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  trickArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    paddingHorizontal: 10,
  },
  trickCard: {},
  player: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
    minHeight: 60,
  },
  currentPlayerTurn: {
    borderColor: '#facc15',
    shadowColor: '#facc15',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  disconnectedPlayer: {
    opacity: 0.5,
    backgroundColor: '#4b5563',
  },
  disconnectedText: {
    color: '#f9fafb',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerName: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  playerInfo: { fontSize: 12, color: '#fff', marginTop: 4 },
  north: { alignSelf: 'center', marginBottom: 10 },
  south: { alignSelf: 'center', marginTop: 10 },
  west: {},
  east: {},
  southPlayerContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  humanPlayerArea: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
  },
  handContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  infoButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  biddingContainer: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
  },
  biddingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  biddingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bidButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  passButton: {
    backgroundColor: '#dc2626',
  },
  suggestedButton: {
    borderColor: '#22c55e',
  },
  bidButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scoringBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    alignItems: 'center',
  },
  scoringTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  scoringText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  gameOverText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#facc15',
    marginBottom: 10,
  },
});
