import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SocketProvider } from '../context/SocketContext';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useShallow } from 'zustand/react/shallow'; // <-- 1. Import useShallow

function RootLayoutNav() {
  // 2. Use useShallow to prevent unnecessary re-renders
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

    // Only navigate if there is a mismatch between auth state and current location
    if (isAuthenticated && inAuthGroup) {
      // User is logged in but still on an auth screen, so redirect
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      // User is not logged in and is trying to access a protected screen, so redirect
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments.join(',')]); // <-- Stabilize the dependency by converting array to string

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="[gameId]" options={{ title: 'Game Board' }} />
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
