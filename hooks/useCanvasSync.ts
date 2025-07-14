import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCanvas } from './useCanvas';
import { supabase } from '@/utils/supabase';

const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const RETRY_DELAYS = [5000, 15000, 30000]; // Retry after 5s, 15s, 30s

export function useCanvasSync() {
  const { syncCourseData, loading, error } = useCanvas();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const handleSync = async () => {
    try {
      // Get all active courses
      const { data: courses, error: coursesError } = await supabase
        .from('canvas_courses')
        .select('id')
        .eq('workflow_state', 'available');

      if (coursesError) throw coursesError;

      // Sync each course
      for (const course of courses || []) {
        try {
          await syncCourseData(course.id);
          
          // Log successful sync
          await supabase
            .from('canvas_sync_status')
            .insert({
              course_id: course.id,
              status: 'completed',
              trigger_type: 'scheduled',
              completed_at: new Date().toISOString(),
            });

          retryCountRef.current = 0; // Reset retry count on success
        } catch (error) {
          console.error(`Error syncing course ${course.id}:`, error);
          
          // Log failed sync
          await supabase
            .from('canvas_sync_status')
            .insert({
              course_id: course.id,
              status: 'failed',
              trigger_type: 'scheduled',
              message: error.message,
              retry_count: retryCountRef.current,
            });

          // Implement retry logic
          if (retryCountRef.current < RETRY_DELAYS.length) {
            const delay = RETRY_DELAYS[retryCountRef.current];
            retryCountRef.current++;
            
            setTimeout(() => {
              handleSync();
            }, delay);
          }
        }
      }
    } catch (error) {
      console.error('Error in sync process:', error);
    }
  };

  const scheduleSyncTask = () => {
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule next sync
    syncTimeoutRef.current = setTimeout(() => {
      handleSync();
      scheduleSyncTask(); // Reschedule for next interval
    }, SYNC_INTERVAL);
  };

  useEffect(() => {
    // Initial sync on mount
    handleSync();

    // Set up app state listener
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check last sync time and sync if needed
        supabase
          .from('canvas_sync_status')
          .select('completed_at')
          .order('completed_at', { ascending: false })
          .limit(1)
          .then(({ data }) => {
            const lastSync = data?.[0]?.completed_at ? new Date(data[0].completed_at) : null;
            const now = new Date();
            
            if (!lastSync || (now.getTime() - lastSync.getTime()) > SYNC_INTERVAL) {
              handleSync();
            }
          });
      }
    });

    // Start scheduling
    scheduleSyncTask();

    // Cleanup
    return () => {
      subscription.remove();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    error,
    manualSync: handleSync,
  };
}