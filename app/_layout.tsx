import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/utils/supabase';
import { useFonts } from 'expo-font';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('[App Initialization] Starting app launch - RootLayout');
  const [fontsLoaded] = useFonts({
    'Calistoga-Regular': require('../assets/fonts/Calistoga-Regular.ttf'),
    'DarkerGrotesque-Regular': require('../assets/fonts/DarkerGrotesque-Regular.ttf'),
    'DarkerGrotesque-Medium': require('../assets/fonts/DarkerGrotesque-Medium.ttf'),
  });

  useFrameworkReady();

  console.log('[App Initialization] System fonts ready, hiding splash screen');

  useEffect(() => {
    // Hide splash screen immediately since we're using system fonts
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  console.log('[App Initialization] RootLayout rendering with SessionContextProvider at root level');

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="get-started" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="confirm-email" options={{ headerShown: false }} />
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/outlook/callback" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </SessionContextProvider>
  );
}