// app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Pressable, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

// Use import for static assets
// import logo from '../assets/images/logo.png';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const onLoginPress = async () => {
    setError('');
    const result = await login(username, password);
    if (result && result.error) {
      setError(result.msg);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Bazar Belote</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button title="Login" onPress={onLoginPress} color={Colors.light.primary} />
      <Pressable onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Don&apos;t have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 20, // Soften the edges
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.light.text,
  },
  input: {
    height: 50,
    borderColor: Colors.light.grey,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: Colors.light.white,
  },
  errorText: {
    color: Colors.light.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  linkText: {
    color: '#1d4ed8', // Standard link blue for better UX
    textAlign: 'center',
    marginTop: 20,
  },
});
