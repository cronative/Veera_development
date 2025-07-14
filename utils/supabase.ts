import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js/dist/module/index.js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    enabled: false // Disable WebSocket connections entirely
  },
  global: {
    headers: {
      'x-application-name': 'vera-app'
    }
  }
});