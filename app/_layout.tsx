import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

const InitialLayout = () => {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const isRouterReady = segments.length > 0;

    // Only run the navigation logic if the auth check is complete AND the router is ready.
    if (authState.isLoading || !isRouterReady) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    // If the user is authenticated but is currently in the auth group (e.g., on the login screen),
    // redirect them to the main app.
    if (authState.authenticated && inAuthGroup) {
      router.replace('/(tabs)');
    } 
    // If the user is not authenticated and is NOT in the auth group,
    // redirect them to the login screen.
    else if (!authState.authenticated && !inAuthGroup) {
      router.replace('/login');
    }
  }, [authState, segments]); // Add segments to the dependency array for robustness

  // While loading, show a spinner to prevent the navigator from rendering
  if (authState.isLoading) {
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
