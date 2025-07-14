import AsyncStorage from '@react-native-async-storage/async-storage';
import { RetrievedData } from '@/types/chat';

const CACHE_PREFIX = 'vera_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedData(key: string): Promise<RetrievedData | null> {
  try {
    const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCachedData(key: string, data: Omit<RetrievedData, 'cached' | 'timestamp'>): Promise<void> {
  try {
    const cacheData: RetrievedData = {
      ...data,
      cached: true,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
}