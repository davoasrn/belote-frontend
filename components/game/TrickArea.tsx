import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../../types/types';
import CardView from '../CardView';

interface TrickAreaProps {
  currentTrick: { card: Card; playerId: string }[];
}

const TrickArea = React.memo<TrickAreaProps>(({ currentTrick }) => {
  // Only rerender when trick actually changes
  const trickCards = React.useMemo(() => 
    currentTrick.map(({ card }) => (
      <View key={`${card.suit}-${card.rank}`} style={styles.trickCard}>
        <CardView card={card} />
      </View>
    )), 
    [currentTrick]
  );

  return <>{trickCards}</>;
});

TrickArea.displayName = 'TrickArea';

const styles = StyleSheet.create({
  trickCard: { 
    marginHorizontal: -20 
  },
});

export default TrickArea;
