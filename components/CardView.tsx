import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import { Card } from '../types/types';
import Animated from 'react-native-reanimated'; // <-- Import Animated
import Colors from '../constants/Colors';

interface CardViewProps {
  card: Card;
  onPress?: () => void;
  isPlayable?: boolean;
  isSuggested?: boolean;
  style?: any; 
}

const suitSymbols: { [key: string]: { symbol: string; color: string } } = {
  Hearts: { symbol: '♥', color: Colors.light.cardRed },
  Diamonds: { symbol: '♦', color: Colors.light.cardRed },
  Clubs: { symbol: '♣', color: Colors.light.cardText },
  Spades: { symbol: '♠', color: Colors.light.cardText },
};

// We need to create an animatable version of Pressable
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CardView({ card, onPress, isPlayable = true, isSuggested = false, style }: CardViewProps) {
  const { symbol, color } = suitSymbols[card.suit];

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.card,
        !isPlayable && styles.unplayableCard,
        isSuggested && styles.suggestedCard,
        style, // <-- Apply animated styles here
      ]}
      disabled={!isPlayable}
    >
      <Text style={[styles.rank, { color }]}>{card.rank}</Text>
      <Text style={[styles.suit, { color }]}>{symbol}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  unplayableCard: {
    opacity: 0.5,
    backgroundColor: '#e2e8f0',
  },
  suggestedCard: {
    borderColor: Colors.light.accent,
    shadowColor: Colors.light.accent,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  suit: {
    fontSize: 18,
  },
});
