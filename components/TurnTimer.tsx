import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const TURN_DURATION_SECONDS = 30;

interface TurnTimerProps {
  timeLeft: number;
}

export default function TurnTimer({ timeLeft }: TurnTimerProps) {
  const progressPercentage = (timeLeft / TURN_DURATION_SECONDS) * 100;

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerText}>{timeLeft}s</Text>
      <View style={styles.timerBarBackground}>
        <View
          style={[
            styles.timerBarForeground,
            { width: `${progressPercentage}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    width: '50%',
    alignItems: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarForeground: {
    height: '100%',
    backgroundColor: '#facc15', // Yellow color for the timer
    borderRadius: 4,
  },
});
