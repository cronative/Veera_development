import { Database } from './supabase';
import { TaskData, AssignmentData, AnnouncementData } from './tasks';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  enriched?: boolean;
  metadata?: {
    relevanceScore?: number;
    dataSource?: 'cache' | 'database' | 'none';
    processingTime?: number;
    hasTaskData?: boolean;
    taskCount?: number;
  };
}

export interface ClassifierResult {
  needsDataFetch: boolean;
  confidence: number;
  topics: string[];
}

export interface RetrievedData {
  assignments?: AssignmentData[];
  announcements?: AnnouncementData[];
  tasks?: TaskData[];
  cached: boolean;
  timestamp: number;
}