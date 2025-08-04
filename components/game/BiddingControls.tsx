import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { TrumpSuit, Suit } from '../../types/types';

interface BiddingControlsProps {
  onBid: (suit: TrumpSuit, points: number) => void;
  onPass: () => void;
  currentBid: number;
}

const BiddingControls = React.memo<BiddingControlsProps>(({ onBid, onPass, currentBid }) => {
  const [selectedSuit, setSelectedSuit] = useState<TrumpSuit | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number>(currentBid + 10);
  
  // Memoize computed values
  const bidOptions = React.useMemo(() => 
    Array.from({ length: 9 }, (_, i) => currentBid + 10 + i * 10),
    [currentBid]
  );

  // Valid trump suits for bidding (exclude HIDDEN) - memoized to prevent array recreation
  const validTrumpSuits = React.useMemo((): TrumpSuit[] => 
    [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades, 'No-Trump'],
    []
  );

  // Memoize handlers to prevent re-creation
  const handleBid = React.useCallback(() => {
    if (selectedSuit && selectedPoints) {
      onBid(selectedSuit, selectedPoints);
    }
  }, [selectedSuit, selectedPoints, onBid]);

  const handlePassBid = React.useCallback(() => {
    console.log('Pass button pressed - TEST');
    Alert.alert('Button Test', 'Pass button works!');
    onPass();
  }, [onPass]);

  const handleSuitSelect = React.useCallback((suit: TrumpSuit) => {
    console.log('Suit selected:', suit);
    setSelectedSuit(suit);
  }, []);

  const handlePointsSelect = React.useCallback((points: number) => {
    setSelectedPoints(points);
  }, []);

  const handleBidPress = React.useCallback(() => {
    console.log('Bid button pressed - TEST, selectedSuit:', selectedSuit, 'selectedPoints:', selectedPoints);
    Alert.alert('Button Test', `Bid button works! ${selectedSuit ? `${selectedPoints} ${selectedSuit}` : 'No suit selected'}`);
    if (selectedSuit) {
      handleBid();
    }
  }, [selectedSuit, selectedPoints, handleBid]);

  return (
    <View style={styles.biddingControlsContainer}>
      <Text style={styles.biddingTitle}>Your Bid</Text>
      
      <View style={styles.bidSelectorRow}>
        {validTrumpSuits.map(suit => (
          <Pressable 
            key={suit} 
            style={[styles.suitButton, selectedSuit === suit && styles.selectedButton]} 
            onPress={() => handleSuitSelect(suit)}
          >
            <Text style={styles.suitButtonText}>
              {suit === 'No-Trump' ? 'NT' : suit.charAt(0)}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pointsScrollView}>
        {bidOptions.map(points => (
          <Pressable 
            key={points} 
            style={[styles.pointsButton, selectedPoints === points && styles.selectedButton]} 
            onPress={() => handlePointsSelect(points)}
          >
            <Text style={styles.pointsButtonText}>{points}</Text>
          </Pressable>
        ))}
      </ScrollView>
      
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.passButton]} 
          onPress={handlePassBid}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Pass</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.bidButton,
            !selectedSuit && styles.disabledButton
          ]} 
          onPress={handleBidPress}
          disabled={!selectedSuit}
          activeOpacity={selectedSuit ? 0.7 : 0.3}
        >
          <Text style={[styles.actionButtonText, !selectedSuit && styles.disabledButtonText]}>
            Bid
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

BiddingControls.displayName = 'BiddingControls';

const styles = StyleSheet.create({
  biddingControlsContainer: { 
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 20,
    gap: 10 
  },
  biddingTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  bidSelectorRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%', 
    marginBottom: 8 
  },
  suitButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  selectedButton: { 
    borderColor: '#facc15' 
  },
  suitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  pointsScrollView: { 
    width: '100%', 
    marginBottom: 8 
  },
  pointsButton: { 
    width: 55, 
    height: 35, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 8, 
    marginHorizontal: 4, 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  pointsButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  actionButtonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%', 
    paddingHorizontal: 20,
    marginTop: 15,
    zIndex: 1000, 
    elevation: 1000
  },
  actionButton: { 
    minWidth: 100,
    marginHorizontal: 10,
    paddingVertical: 15, 
    paddingHorizontal: 25, 
    borderRadius: 10, 
    minHeight: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  passButton: { 
    backgroundColor: '#dc2626' 
  },
  bidButton: { 
    backgroundColor: '#16a34a' 
  },
  disabledButton: { 
    backgroundColor: '#6b7280', 
    opacity: 0.5 
  },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    textAlign: 'center'
  },
  disabledButtonText: { 
    color: '#d1d5db' 
  },
});

export default BiddingControls;
