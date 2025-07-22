import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SocketProvider } from '../context/SocketContext';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useShallow } from 'zustand/react/shallow';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    })),
  );
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const isRouterReady = segments.length > 0;
    if (isLoading || !isRouterReady) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments.join(',')]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="[gameId]" options={{ title: 'Game Board' }} />
      {/* Add this new screen configuration for the lobby */}
      <Stack.Screen 
        name="lobby/[gameId]" 
        options={{ 
          title: 'Game Lobby',
          headerBackTitle: 'Home', // Makes the back button cleaner
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SocketProvider>
      <RootLayoutNav />
    </SocketProvider>
  );
}
