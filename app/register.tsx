// app/register.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import Colors from '@/constants/Colors';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore((state) => state.register);
  const router = useRouter();

  const onRegisterPress = async () => {
    setError('');
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }
    const result = await register(username, password);
    if (result && result.error) {
      setError(result.msg as string);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button title="Register" onPress={onRegisterPress} color={Colors.light.primary} />
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
});
