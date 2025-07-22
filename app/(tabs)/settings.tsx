import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const THEME_OPTIONS = [
  { id: 'green_felt', name: 'Classic Green', color: '#059669' },
  { id: 'dark_wood', name: 'Dark Wood', color: '#4a2c2a' },
  { id: 'blue_velvet', name: 'Blue Velvet', color: '#1e3a8a' },
];

const CARD_BACK_OPTIONS = [
  { id: 'default_back', name: 'Default Blue', color: '#2563eb' },
  { id: 'red_diamond', name: 'Red Diamond', color: '#dc2626' },
  { id: 'gold_swirl', name: 'Gold Swirl', color: '#f59e0b' },
];

export default function SettingsScreen() {
  const { authState, updatePreferences, logout } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState(authState.preferences?.tableTheme || 'green_felt');
  const [selectedCardBack, setSelectedCardBack] = useState(authState.preferences?.cardBack || 'default_back');

  const handleSave = async () => {
    const result = await updatePreferences({
      tableTheme: selectedTheme,
      cardBack: selectedCardBack,
    });

    if (result && !result.error) {
      Alert.alert('Success', 'Your preferences have been saved.');
    } else {
      Alert.alert('Error', 'Could not save preferences.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Game Appearance</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Table Theme</Text>
        <View style={styles.optionsContainer}>
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.option, selectedTheme === option.id && styles.selectedOption]}
              onPress={() => setSelectedTheme(option.id)}
            >
              <View style={[styles.colorSwatch, { backgroundColor: option.color }]} />
              <Text style={styles.optionText}>{option.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Back</Text>
        <View style={styles.optionsContainer}>
          {CARD_BACK_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.option, selectedCardBack === option.id && styles.selectedOption]}
              onPress={() => setSelectedCardBack(option.id)}
            >
              <View style={[styles.colorSwatch, { backgroundColor: option.color }]} />
              <Text style={styles.optionText}>{option.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </Pressable>
      
      <View style={styles.logoutButton}>
        <Button title="Logout" onPress={logout} color="#dc2626" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f1f5f9' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#1e293b' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 15, color: '#334155' },
  optionsContainer: {},
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  selectedOption: { borderColor: '#2563eb' },
  colorSwatch: { width: 24, height: 24, borderRadius: 12, marginRight: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  optionText: { fontSize: 16, color: '#1e293b' },
  saveButton: { backgroundColor: '#16a34a', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { marginTop: 40 }
});
