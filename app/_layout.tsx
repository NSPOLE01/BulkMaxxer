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
      router.replace('/(tabs)' as never);
    }
  }, [user, loading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            headerShown: true,
            title: 'Search Food',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#111111',
            headerTitleStyle: { color: '#111111' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: true,
            title: 'Scan Barcode',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#111111',
            headerTitleStyle: { color: '#111111' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="manual"
          options={{
            headerShown: true,
            title: 'Manual Entry',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#111111',
            headerTitleStyle: { color: '#111111' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="confirm"
          options={{
            headerShown: true,
            title: 'Confirm Food',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#111111',
            headerTitleStyle: { color: '#111111' },
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#111111" size="large" />
        </View>
      )}
    </>
  );
}
