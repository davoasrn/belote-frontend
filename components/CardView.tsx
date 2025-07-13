import React from 'react';
import { StyleSheet, Text,  Pressable } from 'react-native';
import { Card } from '../types/types';

interface CardViewProps {
  card: Card;
  onPress?: () => void;
  isPlayable?: boolean;
  isSuggested?: boolean; // <-- Add new property
}

const suitSymbols: { [key: string]: { symbol: string; color: string } } = {
  Hearts: { symbol: '♥', color: '#ef4444' },
  Diamonds: { symbol: '♦', color: '#ef4444' },
  Clubs: { symbol: '♣', color: '#0f172a' },
  Spades: { symbol: '♠', color: '#0f172a' },
};

export default function CardView({ card, onPress, isPlayable = true, isSuggested = false }: CardViewProps) {
  const { symbol, color } = suitSymbols[card.suit];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        !isPlayable && styles.unplayableCard,
        isSuggested && styles.suggestedCard, // <-- Apply suggestion style
      ]}
      disabled={!isPlayable}
    >
      <Text style={[styles.rank, { color }]}>{card.rank}</Text>
      <Text style={[styles.suit, { color }]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2, // Increased border width
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
    borderColor: '#22c55e', // Green border for suggested card
    shadowColor: '#22c55e',
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
