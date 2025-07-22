// components/CardBackView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

// Define our theme styles as a plain object for dynamic key access
const themes = {
  default_back: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  red_diamond: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  gold_swirl: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
};

// Create a specific type from the keys of our themes object
export type CardBackThemeID = keyof typeof themes;

interface CardBackViewProps {
  cardBackTheme?: CardBackThemeID;
}

export default function CardBackView({ cardBackTheme = 'default_back' }: CardBackViewProps) {
  // This is now type-safe because cardBackTheme can only be one of the defined keys
  const themeStyle = themes[cardBackTheme];

  return (
    <View style={[styles.cardBack, themeStyle]}>
      {/* In the future, we could add a pattern or logo here */}
    </View>
  );
}

const styles = StyleSheet.create({
  cardBack: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 4,
  },
});
