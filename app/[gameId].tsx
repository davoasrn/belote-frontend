import { View, StyleSheet, SafeAreaView, Platform, LayoutAnimation, UIManager } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card, GamePhase, TrumpSuit, Suit } from '../types/types';
import GameTable from '../components/game/GameTable';
import TrickArea from '../components/game/TrickArea';
import GameStatus from '../components/game/GameStatus';
import GameInfo from '../components/game/GameInfo';
import PlayerHand from '../components/game/PlayerHand';
import BiddingControls from '../components/game/BiddingControls';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TURN_DURATION_SECONDS = 30;

const tableThemes: Record<string, string> = {
  green_felt: '#1A3C34',
  dark_wood: '#4a2c2a',
  blue_velvet: '#1e3a8a',
};

export default function GameScreen() {
  const { socket, gameState, setGameState, suggestion, clearSuggestion } = useSocket();
  const { authState } = useAuth();
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION_SECONDS);
  const timerRef = useRef<number | null>(null);

  // Memoize local player data to prevent unnecessary rerenders
  const localPlayerData = useMemo(() => {
    if (!gameState) return null;
    
    console.log(`[PLAYER-DEBUG] Finding local player - authState.userId: ${authState.userId}, authState.username: ${authState.username}`);
    console.log(`[PLAYER-DEBUG] Available players:`, gameState.players?.map(p => ({ id: p.id, name: p.name })));
    
    let localPlayerIndex = gameState.players?.findIndex(
      p => p.id === authState.userId || p.name === authState.username
    );
    
    // Fallback: if we can't find the player and we have a connected socket, 
    // assume we're the first human player
    if (localPlayerIndex < 0 && gameState.players) {
      localPlayerIndex = gameState.players.findIndex(p => !p.isBot);
      console.log(`[PLAYER-DEBUG] Using fallback - found first human player at index: ${localPlayerIndex}`);
    }
    
    // Final fallback: assume index 0
    if (localPlayerIndex < 0) {
      localPlayerIndex = 0;
      console.log(`[PLAYER-DEBUG] Using final fallback - index 0`);
    }
    
    console.log(`[PLAYER-DEBUG] Final localPlayerIndex: ${localPlayerIndex}`);
    
    return {
      localPlayerIndex,
      humanPlayer: gameState.players[localPlayerIndex]
    };
  }, [gameState, authState.userId, authState.username]);

  // Memoize game phase states
  const gamePhases = useMemo(() => {
    if (!gameState) return {
      isBiddingPhase: false,
      isPlayingPhase: false,
      isScoringPhase: false,
      isFinishedPhase: false,
      isHumanTurn: false
    };
    
    return {
      isBiddingPhase: gameState.phase === GamePhase.Bidding,
      isPlayingPhase: gameState.phase === GamePhase.Playing,
      isScoringPhase: gameState.phase === GamePhase.Scoring,
      isFinishedPhase: gameState.phase === GamePhase.Finished,
      isHumanTurn: localPlayerData?.localPlayerIndex !== undefined && 
                   gameState.currentTurnPlayerIndex === localPlayerData.localPlayerIndex
    };
  }, [gameState, localPlayerData]);

  // Memoize theme and stable data
  const tableThemeColor = useMemo(() => 
    tableThemes[authState.preferences?.tableTheme || 'green_felt'], 
    [authState.preferences?.tableTheme]
  );

  // Layout animation effect - memoized dependencies
  const trickLength = gameState?.currentTrick.length;
  const handLength = gameState?.players[0]?.hand.length;
  const phase = gameState?.phase;
  
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [trickLength, handLength, phase]);

  // Helper function to calculate legal moves
  const getLegalMoves = useCallback((player: any, gameState: any) => {
    if (gameState.phase !== GamePhase.Playing || !gameState.trumpSuit) return player.hand;
    
    const hand = player.hand;
    const trick = gameState.currentTrick;
    
    if (trick.length === 0) return hand;
    
    const leadingCard = trick[0].card;
    const leadingSuit = leadingCard.suit;
    const trumpSuit = gameState.trumpSuit;
    
    const cardsInLeadingSuit = hand.filter((c: Card) => c.suit === leadingSuit);
    if (cardsInLeadingSuit.length > 0) return cardsInLeadingSuit;
    
    const trumpCards = hand.filter((c: Card) => c.suit === trumpSuit);
    if (trumpCards.length > 0) return trumpCards;
    
    return hand;
  }, []);

  // Helper functions memoized to prevent recreations
  const getAvatarUrl = useCallback((player: any) => player.preferences?.avatarUrl || undefined, []);
  const getTeam = useCallback((playerIdx: number) => (playerIdx % 2 === 0 ? 1 : 2), []);
  const isPartner = useCallback((playerIdx: number) => 
    localPlayerData ? playerIdx !== localPlayerData.localPlayerIndex && 
    playerIdx % 2 === localPlayerData.localPlayerIndex % 2 : false, 
    [localPlayerData]
  );

  // Memoized handlers to prevent component rerenders
  const handleMakeBid = useCallback((suit: TrumpSuit, points: number) => {
    console.log(`[BID-DEBUG] ${authState.username} making bid: ${points} ${suit}`);
    if (socket && gameState) {
      socket.emit('makeBid', { gameId: gameState.gameId, suit, points });
    }
  }, [socket, gameState, authState.username]);

  const handlePassBid = useCallback(() => {
    console.log(`[BID-DEBUG] ${authState.username} passing bid`);
    if (socket && gameState) {
      socket.emit('passBid', { gameId: gameState.gameId });
    }
  }, [socket, gameState, authState.username]);

  const handlePlayCard = useCallback((card: Card) => {
    if (socket && gameState) {
      socket.emit('playCard', { gameId: gameState.gameId, card });
    }
  }, [socket, gameState]);

  const handleExitGame = useCallback(() => {
    clearSuggestion();
    router.back();
    setTimeout(() => setGameState(null), 500);
  }, [clearSuggestion, setGameState]);

  const handleGetSuggestion = useCallback(() => {
    if (socket && gameState) {
      socket.emit('getSuggestion', { gameId: gameState.gameId });
    }
  }, [socket, gameState]);

  // Timer effect - simplified with stable dependencies
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only start timer if it's actually the human player's turn AND in playing phase
    const shouldStartTimer = gameState && 
                            localPlayerData && 
                            gameState.phase === GamePhase.Playing &&
                            gameState.currentTurnPlayerIndex === localPlayerData.localPlayerIndex;
    
    if (shouldStartTimer) {
      console.log(`[TIMER-DEBUG] Starting timer for ${authState.username || 'unknown'} - currentTurnPlayerIndex: ${gameState.currentTurnPlayerIndex}, localPlayerIndex: ${localPlayerData.localPlayerIndex}`);
      setTimeLeft(TURN_DURATION_SECONDS);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Timer expired - auto-play a random legal card
            if (localPlayerData && gameState) {
              const { humanPlayer } = localPlayerData;
              const legalMoves = getLegalMoves(humanPlayer, gameState);
              if (legalMoves.length > 0) {
                const randomCard = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                console.log(`[AUTO-PLAY] ${authState.username || 'unknown'} auto-playing card due to timeout:`, randomCard);
                handlePlayCard(randomCard);
              }
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000) as unknown as number;
    } else {
      console.log(`[TIMER-DEBUG] Not starting timer for ${authState.username || 'unknown'} - phase: ${gameState?.phase}, currentTurnPlayerIndex: ${gameState?.currentTurnPlayerIndex}, localPlayerIndex: ${localPlayerData?.localPlayerIndex}`);
      // Reset timer display when it's not human's turn
      setTimeLeft(TURN_DURATION_SECONDS);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState?.currentTurnPlayerIndex, gameState?.phase, localPlayerData?.localPlayerIndex, authState.username, getLegalMoves, handlePlayCard, gameState, localPlayerData]);

  if (!gameState || !localPlayerData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading state */}
        </View>
      </View>
    );
  }

  const { localPlayerIndex, humanPlayer } = localPlayerData;
  const { isBiddingPhase, isPlayingPhase, isScoringPhase, isFinishedPhase, isHumanTurn } = gamePhases;

  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: tableThemeColor },
      Platform.OS === 'android' && { paddingBottom: 20 }
    ]}>
      <View style={styles.gameArea}>
        {/* Game Table with all players */}
        <GameTable 
          players={gameState.players}
          localPlayerIndex={localPlayerIndex}
          currentTurnPlayerIndex={gameState.currentTurnPlayerIndex}
          currentTrick={gameState.currentTrick}
          getAvatarUrl={getAvatarUrl}
          getTeam={getTeam}
          isPartner={isPartner}
        >
          <TrickArea currentTrick={gameState.currentTrick} />
        </GameTable>

        {/* Game Status - Timer, Phase Info */}
        <GameStatus
          isHumanTurn={isHumanTurn}
          isBiddingPhase={isBiddingPhase}
          isScoringPhase={isScoringPhase}
          isFinishedPhase={isFinishedPhase}
          humanPlayer={humanPlayer}
          timeLeft={timeLeft}
          winningTeam={gameState.winningTeam}
          localPlayerIndex={localPlayerIndex}
          getAvatarUrl={getAvatarUrl}
          getTeam={getTeam}
          isPartner={isPartner}
        />
      </View>

      <View style={styles.humanPlayerArea}>
        {/* Game Info - Scores, Bids, Actions */}
        <GameInfo
          teamScores={gameState.teamScores}
          winningBid={gameState.winningBid}
          isHumanTurn={isHumanTurn}
          onExitGame={handleExitGame}
          onGetSuggestion={handleGetSuggestion}
        />
        
        {/* Player Hand */}
        <PlayerHand
          hand={humanPlayer.hand.filter(card => card.suit !== Suit.HIDDEN)}
          isBiddingPhase={isBiddingPhase}
          isPlayingPhase={isPlayingPhase}
          isHumanTurn={isHumanTurn}
          legalMoveSet={new Set(getLegalMoves(humanPlayer, gameState).map((c: Card) => `${c.rank}-${c.suit}`))}
          isCardSuggested={(card: Card) => {
            if (!suggestion || typeof suggestion === 'string') return false;
            return suggestion.rank === card.rank && suggestion.suit === card.suit;
          }}
          onPlayCard={handlePlayCard}
        />
        
        {/* Bidding Controls */}
        {isBiddingPhase && (
          <View style={styles.biddingContainer}>
            {isHumanTurn ? (
              <BiddingControls 
                onBid={handleMakeBid} 
                onPass={handlePassBid} 
                currentBid={gameState.winningBid?.points || 80} 
              />
            ) : (
              <View style={styles.waitingContainer}>
                {/* Waiting for other player to bid */}
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-between'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  humanPlayerArea: { 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderTopColor: 'rgba(255,255,255,0.2)', 
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'android' ? 15 : 5
  },
  biddingContainer: { 
    paddingVertical: 15, 
    alignItems: 'center', 
    width: '100%', 
    minHeight: 180, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.2)' 
  },
  waitingContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
});
