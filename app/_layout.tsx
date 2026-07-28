import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

export default function RootLayout() {
  const { user, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)' as never);
    }
  }, [user, loading]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            headerShown: true,
            title: 'Search Food',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontFamily: 'Poppins_600SemiBold' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: true,
            title: 'Scan Barcode',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontFamily: 'Poppins_600SemiBold' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="manual"
          options={{
            headerShown: true,
            title: 'Manual Entry',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontFamily: 'Poppins_600SemiBold' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="confirm"
          options={{
            headerShown: true,
            title: 'Confirm Food',
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontFamily: 'Poppins_600SemiBold' },
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </>
  );
}
