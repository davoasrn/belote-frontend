import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../../types/types';
import PlayerDisplay from './PlayerDisplay';
import TurnTimer from '../TurnTimer';

interface GameStatusProps {
  isHumanTurn: boolean;
  isBiddingPhase: boolean;
  isScoringPhase: boolean;
  isFinishedPhase: boolean;
  timeLeft: number;
  winningTeam?: string;
  humanPlayer: Player;
  localPlayerIndex: number;
  getAvatarUrl: (player: Player) => string | undefined;
  getTeam: (playerIdx: number) => number;
  isPartner: (playerIdx: number) => boolean;
}

const GameStatus = React.memo<GameStatusProps>(({ 
  isHumanTurn,
  isBiddingPhase,
  isScoringPhase,
  isFinishedPhase,
  timeLeft,
  winningTeam,
  humanPlayer,
  localPlayerIndex,
  getAvatarUrl,
  getTeam,
  isPartner
}) => {
  // Memoize human player data
  const humanPlayerData = React.useMemo(() => ({
    avatarUrl: getAvatarUrl(humanPlayer),
    team: getTeam(localPlayerIndex),
    partner: isPartner(localPlayerIndex)
  }), [humanPlayer, localPlayerIndex, getAvatarUrl, getTeam, isPartner]);

  return (
    <View style={styles.southPlayerContainer}>
      {isHumanTurn && !isBiddingPhase && !isScoringPhase && !isFinishedPhase && (
        <TurnTimer timeLeft={timeLeft} />
      )}
      
      {isScoringPhase && (
        <View style={styles.scoringBox}>
          <Text style={styles.scoringTitle}>Round Over!</Text>
        </View>
      )}
      
      {isFinishedPhase && (
        <View style={styles.scoringBox}>
          <Text style={styles.scoringTitle}>Game Over!</Text>
          <Text style={styles.gameOverText}>{winningTeam} wins!</Text>
        </View>
      )}
      
      {!isBiddingPhase && !isScoringPhase && !isFinishedPhase && (
        <PlayerDisplay
          player={humanPlayer}
          position="south"
          isCurrentTurn={isHumanTurn}
          avatarUrl={humanPlayerData.avatarUrl}
          partner={humanPlayerData.partner}
          team={humanPlayerData.team}
          isLocal={true}
        />
      )}
    </View>
  );
});

GameStatus.displayName = 'GameStatus';

const styles = StyleSheet.create({
  southPlayerContainer: { 
    height: 120, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  scoringBox: { 
    padding: 20, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  scoringTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 10 
  },
  gameOverText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#facc15', 
    marginBottom: 10 
  },
});

export default GameStatus;
