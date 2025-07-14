import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = 'vera_first_launch';

export default function Index() {
  console.log('[App Initialization] Index component starting');
  
  const { session, isLoading } = useSessionContext();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  console.log('[Session State] Index component - current session:', { 
    sessionExists: !!session, 
    sessionValue: session,
    sessionType: typeof session,
    isLoading 
  });

  useEffect(() => {
    console.log('[First Launch Check] Starting checkFirstLaunch()');
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    console.log('[First Launch Check] checkFirstLaunch() called');
    try {
      const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      console.log('[First Launch Check] AsyncStorage result:', hasLaunched);
      
      if (hasLaunched === null) {
        // First launch - mark as launched and show sign up
        console.log('[First Launch Check] First launch detected, setting flag');
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
        console.log('[Launch State] isFirstLaunch: true');
        setIsFirstLaunch(true);
      } else {
        // Not first launch
        console.log('[First Launch Check] Not first launch');
        console.log('[Launch State] isFirstLaunch: false');
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error('[First Launch Check] Error checking first launch:', error);
      console.log('[Launch State] isFirstLaunch: false (error fallback)');
      setIsFirstLaunch(false);
    }
  };

  // Show loading while session and first launch status are being determined
  if (isLoading || isFirstLaunch === null) {
    console.log('[Loading] Activity indicator visible: Index - determining session/launch state', {
      isLoading,
      isFirstLaunchNull: isFirstLaunch === null,
      screen: 'index'
    });
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pastelGreenDark} />
      </View>
    );
  }

  console.log('[Loading] Activity indicator hidden: Index - states determined', {
    screen: 'index',
    session: !!session,
    isFirstLaunch
  });

  // If user is authenticated, redirect to main app
  if (session) {
    console.log('[Navigation] Redirecting to drawer - user authenticated', {
      destination: '/(drawer)/',
      params: { authenticated: true }
    });
    return <Redirect href="/(drawer)/" />;
  }

  // If not authenticated, redirect based on first launch status
  if (isFirstLaunch) {
    console.log('[Navigation] Redirecting to signup - first launch', {
      destination: '/signup',
      params: { firstLaunch: true }
    });
    return <Redirect href="/signup" />;
  } else {
    console.log('[Navigation] Redirecting to login - returning user', {
      destination: '/login',
      params: { firstLaunch: false }
    });
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});