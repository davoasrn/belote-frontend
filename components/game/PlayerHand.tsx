import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Suit } from '../../types/types';
import CardView from '../CardView';

interface PlayerHandProps {
  hand: Card[];
  isBiddingPhase: boolean;
  isPlayingPhase: boolean;
  isHumanTurn: boolean;
  legalMoveSet: Set<string>;
  isCardSuggested: (card: Card) => boolean;
  onPlayCard: (card: Card) => void;
}

const PlayerHand = React.memo<PlayerHandProps>(({ 
  hand,
  isBiddingPhase,
  isPlayingPhase,
  isHumanTurn,
  legalMoveSet,
  isCardSuggested,
  onPlayCard
}) => {
  // Memoize visible cards to prevent filtering on every render
  const visibleCards = React.useMemo(() => 
    hand.filter(card => card.suit !== Suit.HIDDEN), 
    [hand]
  );

  // Memoize card components to prevent recreation
  const cardComponents = React.useMemo(() => 
    visibleCards.map((card) => {
      const cardKey = `${card.rank}-${card.suit}`;
      
      // Card is playable if:
      // 1. Not in bidding phase AND
      // 2. Either not in playing phase OR (it's human's turn AND card is legal move)
      const isPlayable = !isBiddingPhase && 
        (!isPlayingPhase || (isHumanTurn && legalMoveSet.has(cardKey)));
      
      const isSuggested = !isBiddingPhase && isCardSuggested(card);
      
      return (
        <CardView 
          key={cardKey}
          card={card} 
          onPress={isPlayable ? () => onPlayCard(card) : undefined}
          isPlayable={isPlayable}
          isSuggested={isSuggested}
        />
      );
    }),
    [visibleCards, isBiddingPhase, isPlayingPhase, isHumanTurn, legalMoveSet, isCardSuggested, onPlayCard]
  );

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.handContainer}
    >
      {cardComponents}
    </ScrollView>
  );
});

PlayerHand.displayName = 'PlayerHand';

const styles = StyleSheet.create({
  handContainer: { 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    alignItems: 'center', 
    height: 100,
  },
});

export default PlayerHand;
