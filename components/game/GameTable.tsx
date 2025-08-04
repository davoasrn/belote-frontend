import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Player } from '../../types/types';
import PlayerDisplay from './PlayerDisplay';

interface GameTableProps {
  players: Player[];
  currentTurnPlayerIndex: number;
  currentTrick: { card: any; playerId: string }[];
  localPlayerIndex: number;
  getAvatarUrl: (player: Player) => string | undefined;
  getTeam: (playerIdx: number) => number;
  isPartner: (playerIdx: number) => boolean;
  children: React.ReactNode; // For trick area content
}

const GameTable = React.memo<GameTableProps>(({ 
  players, 
  currentTurnPlayerIndex, 
  localPlayerIndex,
  getAvatarUrl,
  getTeam,
  isPartner,
  children
}) => {
  const seatOrder = React.useMemo(() => 
    [0, 1, 2, 3].map(i => (localPlayerIndex + i) % 4), 
    [localPlayerIndex]
  );

  // Memoize player data to prevent unnecessary re-computations
  const playersData = React.useMemo(() => ({
    north: {
      player: players[seatOrder[2]],
      isCurrentTurn: currentTurnPlayerIndex === seatOrder[2],
      avatarUrl: getAvatarUrl(players[seatOrder[2]]),
      partner: isPartner(seatOrder[2]),
      team: getTeam(seatOrder[2])
    },
    west: {
      player: players[seatOrder[1]],
      isCurrentTurn: currentTurnPlayerIndex === seatOrder[1],
      avatarUrl: getAvatarUrl(players[seatOrder[1]]),
      partner: isPartner(seatOrder[1]),
      team: getTeam(seatOrder[1])
    },
    east: {
      player: players[seatOrder[3]],
      isCurrentTurn: currentTurnPlayerIndex === seatOrder[3],
      avatarUrl: getAvatarUrl(players[seatOrder[3]]),
      partner: isPartner(seatOrder[3]),
      team: getTeam(seatOrder[3])
    }
  }), [players, seatOrder, currentTurnPlayerIndex, getAvatarUrl, isPartner, getTeam]);

  return (
    <View style={styles.table}>
      {/* North */}
      <PlayerDisplay
        player={playersData.north.player}
        position="north"
        isCurrentTurn={playersData.north.isCurrentTurn}
        avatarUrl={playersData.north.avatarUrl}
        partner={playersData.north.partner}
        team={playersData.north.team}
        isLocal={false}
      />
      
      <View style={styles.middleRow}>
        {/* West */}
        <PlayerDisplay
          player={playersData.west.player}
          position="west"
          isCurrentTurn={playersData.west.isCurrentTurn}
          avatarUrl={playersData.west.avatarUrl}
          partner={playersData.west.partner}
          team={playersData.west.team}
          isLocal={false}
        />
        
        {/* Trick Area - passed as children */}
        <View style={styles.trickArea}>
          {children}
        </View>
        
        {/* East */}
        <PlayerDisplay
          player={playersData.east.player}
          position="east"
          isCurrentTurn={playersData.east.isCurrentTurn}
          avatarUrl={playersData.east.avatarUrl}
          partner={playersData.east.partner}
          team={playersData.east.team}
          isLocal={false}
        />
      </View>
    </View>
  );
});

GameTable.displayName = 'GameTable';

const styles = StyleSheet.create({
  table: { 
    flex: 1, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 5 
  },
  middleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    alignItems: 'center' 
  },
  trickArea: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: 110, 
    paddingHorizontal: 10 
  },
});

export default GameTable;
