import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEYS = {
  REMEMBER_ME: 'vera_remember_me',
  LAST_EMAIL: 'vera_last_email',
  FIRST_LAUNCH: 'vera_first_launch',
} as const;

export class AuthStorageService {
  static async setRememberMe(remember: boolean): Promise<void> {
    console.log('[First Launch Check] AuthStorageService setRememberMe:', remember);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, remember.toString());
      console.log('[First Launch Check] Remember me set successfully');
    } catch (error) {
      console.error('[First Launch Check] Error setting remember me:', error);
    }
  }

  static async getRememberMe(): Promise<boolean> {
    console.log('[First Launch Check] AuthStorageService getRememberMe called');
    try {
      const value = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
      console.log('[First Launch Check] Remember me value:', value);
      return value === 'true';
    } catch (error) {
      console.error('[First Launch Check] Error getting remember me:', error);
      return false;
    }
  }

  static async setLastEmail(email: string): Promise<void> {
    console.log('[First Launch Check] AuthStorageService setLastEmail:', email);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.LAST_EMAIL, email);
      console.log('[First Launch Check] Last email set successfully');
    } catch (error) {
      console.error('[First Launch Check] Error setting last email:', error);
    }
  }

  static async getLastEmail(): Promise<string | null> {
    console.log('[First Launch Check] AuthStorageService getLastEmail called');
    try {
      const email = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.LAST_EMAIL);
      console.log('[First Launch Check] Last email value:', email);
      return email;
    } catch (error) {
      console.error('[First Launch Check] Error getting last email:', error);
      return null;
    }
  }

  static async clearLastEmail(): Promise<void> {
    console.log('[First Launch Check] AuthStorageService clearLastEmail called');
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LAST_EMAIL);
      console.log('[First Launch Check] Last email cleared successfully');
    } catch (error) {
      console.error('[First Launch Check] Error clearing last email:', error);
    }
  }

  static async setFirstLaunch(isFirst: boolean): Promise<void> {
    console.log('[First Launch Check] AuthStorageService setFirstLaunch:', isFirst);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.FIRST_LAUNCH, isFirst.toString());
      console.log('[First Launch Check] First launch flag set successfully');
    } catch (error) {
      console.error('[First Launch Check] Error setting first launch:', error);
    }
  }

  static async isFirstLaunch(): Promise<boolean> {
    console.log('[First Launch Check] AuthStorageService isFirstLaunch() called');
    try {
      const value = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.FIRST_LAUNCH);
      console.log('[First Launch Check] First launch storage value:', value);
      const result = value === null; // First launch if no value stored
      console.log('[First Launch Check] Return value:', result);
      return result;
    } catch (error) {
      console.error('[First Launch Check] Error checking first launch:', error);
      return false;
    }
  }

  static async clearAll(): Promise<void> {
    console.log('[First Launch Check] AuthStorageService clearAll called');
    try {
      await AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS));
      console.log('[First Launch Check] All auth storage cleared successfully');
    } catch (error) {
      console.error('[First Launch Check] Error clearing auth storage:', error);
    }
  }
}