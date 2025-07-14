import { useState, useCallback } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { outlookAuthService, OutlookAuthResult } from '@/utils/outlookAuth';
import { emailProcessorService } from '@/utils/emailProcessor';
import { supabase } from '@/utils/supabase';

export function useOutlookAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [authResult, setAuthResult] = useState<OutlookAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  const authenticate = useCallback(async () => {
    if (!session?.user?.id) {
      return { success: false, error: 'User must be logged in first' };
    }

    try {
      setIsAuthenticating(true);
      setError(null);
      
      console.log('[useOutlookAuth] Starting authentication...');
      const result = await outlookAuthService.authenticate();
      
      setAuthResult(result);
      
      if (result.success) {
        console.log('[useOutlookAuth] Authentication successful');
        
        // Start email processing in background
        processEmails();
      } else {
        setError(result.error || 'Authentication failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      console.error('[useOutlookAuth] Authentication error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  }, [session?.user?.id]);

  const processEmails = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsProcessingEmails(true);
      setError(null);
      
      console.log('[useOutlookAuth] Starting email processing...');
      await emailProcessorService.processUserEmails(session.user.id);
      console.log('[useOutlookAuth] Email processing completed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email processing failed';
      setError(errorMessage);
      console.error('[useOutlookAuth] Email processing error:', error);
    } finally {
      setIsProcessingEmails(false);
    }
  }, [session?.user?.id]);

  const getEmailAccounts = useCallback(async () => {
    if (!session?.user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[useOutlookAuth] Error fetching email accounts:', error);
      return [];
    }
  }, [session?.user?.id]);

  const getExtractedEmails = useCallback(async (type?: string) => {
    if (!session?.user?.id) return [];

    try {
      let query = supabase
        .from('extracted_email_data')
        .select('*')
        .eq('user_id', session.user.id)
        .order('received_at', { ascending: false });

      if (type) {
        query = query.eq('extracted_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[useOutlookAuth] Error fetching extracted emails:', error);
      return [];
    }
  }, [session?.user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    authenticate,
    processEmails,
    getEmailAccounts,
    getExtractedEmails,
    clearError,
    isAuthenticating,
    isProcessingEmails,
    authResult,
    error,
    isAuthenticated: authResult?.success || false
  };
}