import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/utils/supabase';
import { AuthStorageService } from '@/utils/authStorage';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  isFirstLaunch: boolean;
}

export function useAuthState(): AuthState {
  console.log('[App Initialization] useAuthState hook initializing');
  
  const session = useSession();
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[Session State] useAuthState - session update:', { 
    sessionExists: !!session, 
    sessionValue: session 
  });

  useEffect(() => {
    console.log('[App Initialization] useAuthState useEffect - checkAuthState starting');
    checkAuthState();
  }, []);

  useEffect(() => {
    console.log('[Session State] useAuthState useEffect - session change:', session);
    if (session !== null) {
      console.log('[Loading] useAuthState - session resolved, setting loading false');
      setIsLoading(false);
    }
  }, [session]);

  const checkAuthState = async () => {
    console.log('[First Launch Check] useAuthState checkAuthState called');
    try {
      // Check if this is the first launch
      const firstLaunch = await AuthStorageService.isFirstLaunch();
      console.log('[First Launch Check] AuthStorageService result:', firstLaunch);
      console.log('[Launch State] isFirstLaunch:', firstLaunch);
      setIsFirstLaunch(firstLaunch);
      
      if (firstLaunch) {
        console.log('[First Launch Check] Setting first launch to false for future');
        await AuthStorageService.setFirstLaunch(false);
      }
    } catch (error) {
      console.error('[First Launch Check] Error checking auth state:', error);
    } finally {
      console.log('[Loading] useAuthState - checkAuthState completed, setting loading false');
      setIsLoading(false);
    }
  };

  const authState = {
    isAuthenticated: !!session,
    isLoading: session === null && isLoading,
    user: session?.user || null,
    isFirstLaunch,
  };

  console.log('[User Auth] useAuthState returning:', authState);

  return authState;
}

export async function signOut() {
  console.log('[User Auth] signOut function called');
  try {
    await supabase.auth.signOut();
    console.log('[User Auth] Supabase signOut successful');
    // Optionally clear stored auth data
    await AuthStorageService.clearLastEmail();
    console.log('[User Auth] Auth storage cleared');
  } catch (error) {
    console.error('[User Auth] Error signing out:', error);
    throw error;
  }
}