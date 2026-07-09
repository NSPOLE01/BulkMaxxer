import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/auth';

export default function RootLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)/');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00C853" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F0F' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            headerShown: true,
            title: 'Search Food',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: true,
            title: 'Scan Barcode',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="manual"
          options={{
            headerShown: true,
            title: 'Manual Entry',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="confirm"
          options={{
            headerShown: true,
            title: 'Confirm Food',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
