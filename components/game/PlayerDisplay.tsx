import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Player } from '../../types/types';

interface PlayerDisplayProps {
  player: Player;
  position: 'north' | 'south' | 'west' | 'east';
  isCurrentTurn: boolean;
  avatarUrl?: string;
  partner?: boolean;
  team?: number;
  isLocal?: boolean;
}

const PlayerDisplay = React.memo<PlayerDisplayProps>(({ 
  player, 
  position, 
  isCurrentTurn, 
  avatarUrl, 
  partner, 
  team, 
  isLocal 
}) => (
  <View style={[
    styles.player, 
    styles[position], 
    isCurrentTurn && styles.currentPlayerTurn, 
    player.disconnected && styles.disconnectedPlayer
  ]}>
    {/* Avatar */}
    {avatarUrl ? (
      <View style={{ marginBottom: 4 }}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 24, 
            borderWidth: 2, 
            borderColor: isCurrentTurn ? '#facc15' : '#fff' 
          }} 
        />
      </View>
    ) : null}
    <Text style={styles.playerName}>{player.name}</Text>
    {team !== undefined && (
      <Text style={{ 
        color: team === 1 ? '#facc15' : '#60a5fa', 
        fontWeight: 'bold', 
        fontSize: 12 
      }}>
        Team {team}
        {partner ? ' (Partner)' : ''}
      </Text>
    )}
    {player.disconnected && <Text style={styles.disconnectedText}>Disconnected</Text>}
  </View>
));

PlayerDisplay.displayName = 'PlayerDisplay';

const styles = StyleSheet.create({
  player: { 
    padding: 10, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'transparent', 
    minWidth: 90, 
    minHeight: 60 
  },
  currentPlayerTurn: { 
    borderColor: '#facc15', 
    shadowColor: '#facc15', 
    shadowOpacity: 0.8, 
    shadowRadius: 10, 
    elevation: 10 
  },
  disconnectedPlayer: { 
    opacity: 0.5, 
    backgroundColor: '#4b5563' 
  },
  disconnectedText: { 
    color: '#f9fafb', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  playerName: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 14 
  },
  north: { 
    alignSelf: 'center', 
    marginBottom: 10 
  },
  south: { 
    alignSelf: 'center', 
    marginTop: 10 
  },
  west: {},
  east: {},
});

export default PlayerDisplay;
