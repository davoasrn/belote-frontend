import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, ScrollView, Button, LayoutAnimation, UIManager, Platform, Image } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card, GamePhase, Player, GameState, TrumpSuit, Suit } from '../types/types';
import CardView from '../components/CardView';
import CardBackView, { CardBackThemeID } from '../components/CardBackView';
import TurnTimer from '../components/TurnTimer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TURN_DURATION_SECONDS = 30;

const tableThemes: Record<string, string> = {
  green_felt: '#1A3C34',
  dark_wood: '#4a2c2a',
  blue_velvet: '#1e3a8a',
};

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

const PlayerDisplay = ({ player, position, isCurrentTurn, avatarUrl, partner, team }: {
  player: Player;
  position: 'north' | 'south' | 'west' | 'east';
  isCurrentTurn: boolean;
  avatarUrl?: string;
  partner?: boolean;
  team?: number;
}) => (
  <View style={[styles.player, styles[position], isCurrentTurn && styles.currentPlayerTurn, player.disconnected && styles.disconnectedPlayer]}>
    {/* Avatar */}
    {avatarUrl ? (
      <View style={{ marginBottom: 4 }}>
        <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: isCurrentTurn ? '#facc15' : '#fff' }} />
      </View>
    ) : null}
    <Text style={styles.playerName}>{player.name}</Text>
    {team !== undefined && (
      <Text style={{ color: team === 1 ? '#facc15' : '#60a5fa', fontWeight: 'bold', fontSize: 12 }}>
        Team {team}
        {partner ? ' (Partner)' : ''}
      </Text>
    )}
    {player.disconnected && <Text style={styles.disconnectedText}>Disconnected</Text>}
  </View>
);

const BazarBiddingControls = ({ onBid, onPass, currentBid }: { onBid: (suit: TrumpSuit, points: number) => void; onPass: () => void; currentBid: number }) => {
  const [selectedSuit, setSelectedSuit] = useState<TrumpSuit | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number>(currentBid + 10);
  const bidOptions = Array.from({ length: 9 }, (_, i) => currentBid + 10 + i * 10);

  const handleBid = () => {
    if (selectedSuit && selectedPoints) {
      onBid(selectedSuit, selectedPoints);
    }
  };

  return (
    <View style={styles.biddingContainer}>
      <Text style={styles.biddingTitle}>Your Bid</Text>
      <View style={styles.bidSelectorRow}>
        {(Object.values(Suit) as TrumpSuit[]).concat('No-Trump').map(suit => (
          <Pressable key={suit} style={[styles.suitButton, selectedSuit === suit && styles.selectedButton]} onPress={() => setSelectedSuit(suit)}>
            <Text style={styles.suitButtonText}>{suit === 'No-Trump' ? 'NT' : suit.charAt(0)}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pointsScrollView}>
        {bidOptions.map(points => (
            <Pressable key={points} style={[styles.pointsButton, selectedPoints === points && styles.selectedButton]} onPress={() => setSelectedPoints(points)}>
                <Text style={styles.pointsButtonText}>{points}</Text>
            </Pressable>
        ))}
      </ScrollView>
      <View style={styles.actionButtonsRow}>
        <Pressable style={[styles.actionButton, styles.passButton]} onPress={onPass}>
          <Text style={styles.actionButtonText}>Pass</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.bidButton]} onPress={handleBid} disabled={!selectedSuit}>
          <Text style={styles.actionButtonText}>Bid</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function GameScreen() {
  const router = useRouter();
  
  const { socket, gameState, setGameState, suggestion, clearSuggestion } = useSocket();
  const { authState } = useAuth();
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION_SECONDS);
  const timerRef = useRef<number | null>(null);

  // Log local player and turn info for debugging
  // React.useEffect(() => {
  //   if (!gameState) return;
  //   // Find the local player by matching userId or username from authState
  //   const localPlayer = gameState.players.find(
  //     p => p.id === authState.userId || p.name === authState.username
  //   ) || gameState.players[0];
  //   const currentTurnPlayer = gameState.players[gameState.currentTurnPlayerIndex];
  //   console.log('[PlayerMapping] localPlayer:', authState,localPlayer?.id, localPlayer?.name, '| currentTurnPlayer:', currentTurnPlayer?.id, currentTurnPlayer?.name, '| currentTurnPlayerIndex:', gameState.currentTurnPlayerIndex);
  // }, [gameState, authState.userId, authState.username]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [gameState?.currentTrick.length, gameState?.players[0].hand.length, gameState?.phase]);

  useEffect(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
    if (gameState && gameState.players[gameState.currentTurnPlayerIndex].id === gameState.players[0].id) {
        setTimeLeft(TURN_DURATION_SECONDS);
        timerRef.current = setInterval(() => {
            setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000) as unknown as number;
    }
    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, [gameState?.currentTurnPlayerIndex, gameState?.players[0].id]);

  const handleMakeBid = (suit: TrumpSuit, points: number) => {
    if (socket && gameState) socket.emit('makeBid', { gameId: gameState.gameId, suit, points });
  };
  const handlePassBid = () => {
     if (socket && gameState) socket.emit('passBid', { gameId: gameState.gameId });
  };
  const handlePlayCard = (card: Card) => {
    if (socket && gameState) socket.emit('playCard', { gameId: gameState.gameId, card });
  };
  const handleExitGame = () => {
    clearSuggestion();
      router.back();
      setTimeout(() => setGameState(null), 500);
  };
  const handleGetSuggestion = () => {
    if (socket && gameState) socket.emit('getSuggestion', { gameId: gameState.gameId });
  };

  if (!gameState) {
    return <View style={styles.container}><Text>Loading game...</Text></View>;
  }

  const tableThemeColor = tableThemes[authState.preferences?.tableTheme || 'green_felt'];
  const localPlayerIndex = gameState.players?.findIndex(
    p => p.id === authState.userId || p.name === authState.username
  );
  const humanPlayer = gameState.players[localPlayerIndex] || gameState.players[0];
  const isHumanTurn = gameState.currentTurnPlayerIndex === localPlayerIndex;
  const isBiddingPhase = gameState.phase === GamePhase.Bidding;
  const isPlayingPhase = gameState.phase === GamePhase.Playing;
  const isScoringPhase = gameState.phase === GamePhase.Scoring;
  const isFinishedPhase = gameState.phase === GamePhase.Finished;


  // Always show local user as south, and map others clockwise
  // seatOrder: [south, west, north, east] = [local, (local+1)%4, (local+2)%4, (local+3)%4]
  const seatOrder = [0, 1, 2, 3].map(i => (localPlayerIndex + i) % 4);

  // Avatar URL helper
  const getAvatarUrl = (player: Player) => player.preferences?.avatarUrl || undefined;

  // Team/partner logic: Team 1 = original player indices 0 & 2, Team 2 = 1 & 3
  const getTeam = (playerIdx: number) => (playerIdx % 2 === 0 ? 1 : 2);
  const isPartner = (playerIdx: number) => playerIdx !== localPlayerIndex && playerIdx % 2 === localPlayerIndex % 2;

  const legalMoves = isPlayingPhase && isHumanTurn ? getLegalMoves(humanPlayer, gameState) : [];
  const legalMoveSet = new Set(legalMoves.map(c => `${c.rank}-${c.suit}`));

  const isCardSuggested = (card: Card) => {
    if (!suggestion || typeof suggestion === 'string') return false;
    return suggestion.rank === card.rank && suggestion.suit === card.suit;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tableThemeColor }]}> 
      <View style={styles.table}>
        {/* North */}
        <PlayerDisplay
          player={gameState.players[seatOrder[2]]}
          position="north"
          isCurrentTurn={gameState.currentTurnPlayerIndex === seatOrder[2]}
          avatarUrl={getAvatarUrl(gameState.players[seatOrder[2]])}
          partner={isPartner(seatOrder[2])}
          team={getTeam(seatOrder[2])}
        />
        <View style={styles.middleRow}>
          {/* West */}
          <PlayerDisplay
            player={gameState.players[seatOrder[1]]}
            position="west"
            isCurrentTurn={gameState.currentTurnPlayerIndex === seatOrder[1]}
            avatarUrl={getAvatarUrl(gameState.players[seatOrder[1]])}
            partner={isPartner(seatOrder[1])}
            team={getTeam(seatOrder[1])}
          />
          <View style={styles.trickArea}>
            {gameState.currentTrick.map(({ card }) => (
                <View key={`${card.suit}-${card.rank}`} style={styles.trickCard}>
                    <CardView card={card} />
                </View>
            ))}
          </View>
          {/* East */}
          <PlayerDisplay
            player={gameState.players[seatOrder[3]]}
            position="east"
            isCurrentTurn={gameState.currentTurnPlayerIndex === seatOrder[3]}
            avatarUrl={getAvatarUrl(gameState.players[seatOrder[3]])}
            partner={isPartner(seatOrder[3])}
            team={getTeam(seatOrder[3])}
          />
        </View>
        <View style={styles.southPlayerContainer}>
            {isHumanTurn && !isBiddingPhase && !isScoringPhase && !isFinishedPhase && <TurnTimer timeLeft={timeLeft} />}
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
                 <PlayerDisplay
                   player={humanPlayer}
                   position="south"
                   isCurrentTurn={isHumanTurn}
                   avatarUrl={getAvatarUrl(humanPlayer)}
                   partner={isPartner(localPlayerIndex)}
                   team={getTeam(localPlayerIndex)}
                 />
            )}
        </View>
      </View>

      <View style={styles.humanPlayerArea}>
        <View style={styles.infoBox}>
            <View style={styles.infoButtonContainer}>
              <Button title="Exit" onPress={handleExitGame} color="#f87171" />
            </View>
            <View style={styles.bidInfo}>
                <Text style={styles.scoreText}>T1: {gameState.teamScores.team1} | T2: {gameState.teamScores.team2}</Text>
                <Text style={styles.infoText}>Bid: {gameState.winningBid ? `${gameState.winningBid.points} ${gameState.winningBid.suit}` : 'None'}</Text>
            </View>
            <View style={styles.infoButtonContainer}>
                {isHumanTurn && <Button title="Hint" onPress={handleGetSuggestion} color="#facc15" />}
            </View>
        </View>
        
        {isBiddingPhase && isHumanTurn ? (
          <BazarBiddingControls onBid={handleMakeBid} onPass={handlePassBid} currentBid={gameState.winningBid?.points || 80} />
        ) : (
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
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  table: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5 },
  middleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  trickArea: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 110, paddingHorizontal: 10 },
  trickCard: { marginHorizontal: -20 },
  player: { padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', minWidth: 90, minHeight: 60 },
  currentPlayerTurn: { borderColor: '#facc15', shadowColor: '#facc15', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  disconnectedPlayer: { opacity: 0.5, backgroundColor: '#4b5563' },
  disconnectedText: { color: '#f9fafb', fontWeight: 'bold', fontSize: 12 },
  playerName: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  playerInfo: { fontSize: 12, color: '#fff', marginTop: 4, height: 15 },
  opponentHand: { flexDirection: 'row', marginTop: 4, height: 15, minWidth: 70 },
  north: { alignSelf: 'center', marginBottom: 10 },
  south: { alignSelf: 'center', marginTop: 10 },
  west: {},
  east: {},
  southPlayerContainer: { height: 120, justifyContent: 'center', alignItems: 'center', gap: 10 },
  humanPlayerArea: { backgroundColor: 'rgba(0,0,0,0.2)', borderTopColor: 'rgba(255,255,255,0.2)', borderTopWidth: 1 },
  handContainer: { paddingVertical: 15, paddingHorizontal: 10, alignItems: 'center', height: 130 },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  infoButtonContainer: { flex: 1, alignItems: 'center' },
  bidInfo: { flex: 2, alignItems: 'center' },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  scoreText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  biddingContainer: { paddingVertical: 10, alignItems: 'center', width: '100%', height: 130 },
  biddingTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  bidSelectorRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10 },
  suitButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedButton: { borderColor: '#facc15' },
  suitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  pointsScrollView: { width: '100%', marginBottom: 10 },
  pointsButton: { width: 55, height: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginHorizontal: 4, borderWidth: 2, borderColor: 'transparent' },
  pointsButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '70%' },
  actionButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  passButton: { backgroundColor: '#dc2626' },
  bidButton: { backgroundColor: '#16a34a' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scoringBox: { padding: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, alignItems: 'center' },
  scoringTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  gameOverText: { fontSize: 22, fontWeight: 'bold', color: '#facc15', marginBottom: 10 },
});
