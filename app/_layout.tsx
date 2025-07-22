// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { useEffect } from 'react';

const InitialLayout = () => {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';

    if (authState?.authenticated && !inTabsGroup) {
      // Redirect to the main app
      router.replace('/(tabs)');
    } else if (!authState?.authenticated && inTabsGroup) {
      // Redirect to the login page if not authenticated and trying to access tabs
      router.replace('/login');
    }
  }, [authState, segments]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="[gameId]" options={{ title: 'Game Board' }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <InitialLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
