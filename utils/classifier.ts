import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { ClassifierResult } from '@/types/chat';
import { containsTaskKeywords, getMatchingTaskKeywords, calculateTaskConfidence } from './taskKeywords';

const THRESHOLD = 0.7;

export async function classifyMessage(message: string): Promise<ClassifierResult> {
  const needsDataFetch = containsTaskKeywords(message);
  const confidence = needsDataFetch ? calculateTaskConfidence(message) : 0;
  const topics = needsDataFetch ? getMatchingTaskKeywords(message) : [];

  console.log('[Classifier] Message:', message);
  console.log('[Classifier] Needs data fetch:', needsDataFetch);
  console.log('[Classifier] Confidence:', confidence);
  console.log('[Classifier] Matching topics:', topics);

  return {
    needsDataFetch,
    confidence: Math.max(confidence, needsDataFetch ? 0.8 : 0), // Ensure minimum confidence for detected keywords
    topics: needsDataFetch ? ['canvas', ...topics] : [],
  };
}