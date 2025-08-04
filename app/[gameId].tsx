import { View, StyleSheet, SafeAreaView, Platform, LayoutAnimation, UIManager } from 'react-native';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    
    const localPlayerIndex = gameState.players?.findIndex(
      p => p.id === authState.userId || p.name === authState.username
    );
    
    return {
      localPlayerIndex: localPlayerIndex >= 0 ? localPlayerIndex : 0,
      humanPlayer: gameState.players[localPlayerIndex >= 0 ? localPlayerIndex : 0]
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

  // Timer effect - optimized with proper dependencies
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (gameState && localPlayerData && gamePhases.isHumanTurn) {
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
  }, [gameState, localPlayerData, gamePhases.isHumanTurn]);

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
    // Use router.back() equivalent - need to import from expo-router
    // router.back();
    setTimeout(() => setGameState(null), 500);
  }, [clearSuggestion, setGameState]);

  const handleGetSuggestion = useCallback(() => {
    if (socket && gameState) {
      socket.emit('getSuggestion', { gameId: gameState.gameId });
    }
  }, [socket, gameState]);

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
          legalMoveSet={new Set()} // Will need to calculate legal moves
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
