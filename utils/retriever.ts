import { getCachedData, setCachedData } from './cache';
import { RetrievedData } from '@/types/chat';
import { classifyMessage } from './classifier';
import { taskDataService, TaskDataService } from './taskDataService';
import { TaskRetrievalResult } from '@/types/tasks';

/**
 * Enhanced retriever that uses the centralized task data service
 */
export async function retrieveRelevantData(message: string): Promise<RetrievedData | null> {
  try {
    console.log('[Retriever] Classifying message:', message);
    
    // Check classifier first
    const classification = await classifyMessage(message);
    console.log('[Retriever] Classification result:', classification);
    
    if (!classification.needsDataFetch) {
      console.log('[Retriever] No data fetch needed.');
      return null;
    }
    
    // Check cache
    const cacheKey = message.toLowerCase().trim();
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log('[Retriever] Returning cached data.');
      return cachedData;
    }
    
    console.log('[Retriever] Fetching fresh data...');
    
    // Use centralized task data service
    const taskData = await taskDataService.fetchTaskData();
    
    // Convert to RetrievedData format for backward compatibility
    const data: RetrievedData = {
      assignments: taskData.assignments,
      announcements: taskData.announcements,
      tasks: taskData.tasks,
      cached: false,
      timestamp: taskData.timestamp
    };

    // Cache the results
    await setCachedData(cacheKey, data);
    console.log('[Retriever] Data cached and returned.');
    
    return data;
  } catch (error) {
    console.error('[Retriever] Error:', error);
    return null;
  }
}

/**
 * Direct access to task data service for API routes
 */
export async function getTaskData(): Promise<TaskRetrievalResult | null> {
  try {
    return await taskDataService.fetchTaskData();
  } catch (error) {
    console.error('[Retriever] getTaskData error:', error);
    return null;
  }
}

/**
 * Format task data for AI prompts
 */
export function formatTaskDataForPrompt(data: TaskRetrievalResult): string {
  return taskDataService.formatTasksForPrompt(data);
}