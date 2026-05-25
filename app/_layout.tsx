import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { DataProvider } from '../src/data/DataProvider';
import { ThemeProvider, useTheme } from '../src/theme';

// Route guard: bounce unauthenticated users to (auth), authenticated users out
// of it. Onboarding is reached explicitly after sign-up.
function Guard() {
  const { session, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) router.replace('/(auth)/sign-in');
    else if (session && inAuth) router.replace('/(tabs)');
  }, [session, initializing, segments, router]);

  // Overlay routes (transaction / category / review / recurring) present as
  // modals over the tabs, matching the design's in-frame sheets.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="category/[slug]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="review" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recurring" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function Root() {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <DataProvider>
          <Guard />
        </DataProvider>
      </AuthProvider>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    InstrumentSerif: InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
    SpaceMono: SpaceMono_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
