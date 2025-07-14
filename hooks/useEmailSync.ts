import { useState, useEffect, useCallback } from 'react';
import { emailSyncService, EmailSyncResult, EmailSyncStatus } from '@/utils/emailSyncService';

export function useEmailSync() {
  const [syncStatus, setSyncStatus] = useState<EmailSyncStatus>(emailSyncService.getSyncStatus());
  const [lastSyncResult, setLastSyncResult] = useState<EmailSyncResult | null>(null);

  useEffect(() => {
    // Add status listener
    emailSyncService.addStatusListener(setSyncStatus);

    // Trigger initial sync when hook is first used
    triggerSync();

    // Cleanup on unmount
    return () => {
      emailSyncService.removeStatusListener(setSyncStatus);
    };
  }, []);

  const triggerSync = useCallback(async (forceRefresh = false): Promise<EmailSyncResult> => {
    console.log('[useEmailSync] Triggering email sync, forceRefresh:', forceRefresh);
    
    try {
      const result = await emailSyncService.syncEmails(forceRefresh);
      setLastSyncResult(result);
      
      console.log('[useEmailSync] Sync completed:', {
        success: result.success,
        emailsProcessed: result.emailsProcessed,
        newEmails: result.newEmails,
        error: result.error
      });
      
      return result;
    } catch (error) {
      const errorResult: EmailSyncResult = {
        success: false,
        emailsProcessed: 0,
        newEmails: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setLastSyncResult(errorResult);
      console.error('[useEmailSync] Sync failed:', error);
      
      return errorResult;
    }
  }, []);

  const manualRefresh = useCallback(async (): Promise<EmailSyncResult> => {
    console.log('[useEmailSync] Manual refresh triggered');
    return triggerSync(true);
  }, [triggerSync]);

  return {
    syncStatus,
    lastSyncResult,
    triggerSync,
    manualRefresh,
    isProcessing: syncStatus.isProcessing,
    lastSync: syncStatus.lastSync,
    error: syncStatus.error,
    totalProcessed: syncStatus.totalProcessed
  };
}