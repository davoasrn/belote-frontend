import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface GameInfoProps {
  teamScores: { team1: number; team2: number };
  winningBid?: { points: number; suit: string };
  isHumanTurn: boolean;
  onExitGame: () => void;
  onGetSuggestion: () => void;
}

const GameInfo = React.memo<GameInfoProps>(({ 
  teamScores,
  winningBid,
  isHumanTurn,
  onExitGame,
  onGetSuggestion
}) => {
  // Memoize bid text to prevent recalculation
  const bidText = React.useMemo(() => 
    winningBid ? `${winningBid.points} ${winningBid.suit}` : 'None',
    [winningBid]
  );

  return (
    <View style={styles.infoBox}>
      <View style={styles.infoButtonContainer}>
        <Button title="Exit" onPress={onExitGame} color="#f87171" />
      </View>
      
      <View style={styles.bidInfo}>
        <Text style={styles.scoreText}>
          T1: {teamScores.team1} | T2: {teamScores.team2}
        </Text>
        <Text style={styles.infoText}>
          Bid: {bidText}
        </Text>
      </View>
      
      <View style={styles.infoButtonContainer}>
        {isHumanTurn && (
          <Button title="Hint" onPress={onGetSuggestion} color="#facc15" />
        )}
      </View>
    </View>
  );
});

GameInfo.displayName = 'GameInfo';

const styles = StyleSheet.create({
  infoBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.2)' 
  },
  infoButtonContainer: { 
    flex: 1, 
    alignItems: 'center' 
  },
  bidInfo: { 
    flex: 2, 
    alignItems: 'center' 
  },
  infoText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  scoreText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
});

export default GameInfo;
