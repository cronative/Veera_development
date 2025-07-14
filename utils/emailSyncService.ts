import { supabase } from './supabase';
import { outlookAuthService } from './outlookAuth';
import { emailProcessorService } from './emailProcessor';
import { AppState, AppStateStatus } from 'react-native';

export interface EmailSyncResult {
  success: boolean;
  emailsProcessed: number;
  newEmails: number;
  error?: string;
  details?: {
    tokenRefreshed: boolean;
    emailsFetched: number;
    emailsStored: number;
    processingTime: number;
  };
}

export interface EmailSyncStatus {
  isProcessing: boolean;
  lastSync: Date | null;
  error: string | null;
  totalProcessed: number;
}

export class EmailSyncService {
  private static instance: EmailSyncService;
  private syncStatus: EmailSyncStatus = {
    isProcessing: false,
    lastSync: null,
    error: null,
    totalProcessed: 0
  };
  private listeners: ((status: EmailSyncStatus) => void)[] = [];
  private appStateSubscription: any = null;

  static getInstance(): EmailSyncService {
    if (!EmailSyncService.instance) {
      EmailSyncService.instance = new EmailSyncService();
    }
    return EmailSyncService.instance;
  }

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[EmailSync] App became active, triggering email sync');
        this.syncEmails();
      }
    });
  }

  addStatusListener(listener: (status: EmailSyncStatus) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.syncStatus);
  }

  removeStatusListener(listener: (status: EmailSyncStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private updateStatus(updates: Partial<EmailSyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  async syncEmails(forceRefresh = false): Promise<EmailSyncResult> {
    if (this.syncStatus.isProcessing && !forceRefresh) {
      console.log('[EmailSync] Sync already in progress, skipping');
      return {
        success: false,
        emailsProcessed: 0,
        newEmails: 0,
        error: 'Sync already in progress'
      };
    }

    const startTime = Date.now();
    console.log('[EmailSync] Starting email synchronization...');

    this.updateStatus({
      isProcessing: true,
      error: null
    });

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('[EmailSync] User authenticated:', user.id);

      // Get user's email accounts
      const { data: emailAccounts, error: accountsError } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accountsError) {
        throw new Error(`Failed to fetch email accounts: ${accountsError.message}`);
      }

      if (!emailAccounts || emailAccounts.length === 0) {
        console.log('[EmailSync] No email accounts found for user');
        this.updateStatus({
          isProcessing: false,
          lastSync: new Date(),
          error: 'No email accounts connected'
        });
        return {
          success: false,
          emailsProcessed: 0,
          newEmails: 0,
          error: 'No email accounts connected'
        };
      }

      console.log('[EmailSync] Found', emailAccounts.length, 'email accounts');

      let totalEmailsProcessed = 0;
      let totalNewEmails = 0;
      let tokenRefreshed = false;
      let emailsFetched = 0;
      let emailsStored = 0;

      // Process each email account
      for (const account of emailAccounts) {
        try {
          console.log('[EmailSync] Processing account:', account.email_address);

          // Check if token needs refresh
          let accessToken = account.access_token;
          if (new Date(account.token_expires_at) <= new Date()) {
            console.log('[EmailSync] Token expired, refreshing...');
            
            const newToken = await this.refreshAccessToken(account);
            if (!newToken) {
              console.error('[EmailSync] Failed to refresh token for:', account.email_address);
              continue;
            }
            
            accessToken = newToken;
            tokenRefreshed = true;
            console.log('[EmailSync] Token refreshed successfully');
          }

          // Fetch emails from Outlook
          const emails = await this.fetchEmailsFromOutlook(accessToken);
          emailsFetched += emails.length;
          console.log('[EmailSync] Fetched', emails.length, 'emails from Outlook');

          // Process and store emails
          const processResult = await this.processAndStoreEmails(emails, account);
          emailsStored += processResult.stored;
          totalNewEmails += processResult.newEmails;
          totalEmailsProcessed += processResult.processed;

          console.log('[EmailSync] Account processing complete:', {
            account: account.email_address,
            fetched: emails.length,
            stored: processResult.stored,
            newEmails: processResult.newEmails
          });

        } catch (accountError) {
          console.error('[EmailSync] Error processing account:', account.email_address, accountError);
          // Continue with other accounts
        }
      }

      const processingTime = Date.now() - startTime;
      console.log('[EmailSync] Synchronization completed successfully:', {
        totalEmailsProcessed,
        totalNewEmails,
        processingTime: `${processingTime}ms`
      });

      this.updateStatus({
        isProcessing: false,
        lastSync: new Date(),
        error: null,
        totalProcessed: this.syncStatus.totalProcessed + totalEmailsProcessed
      });

      return {
        success: true,
        emailsProcessed: totalEmailsProcessed,
        newEmails: totalNewEmails,
        details: {
          tokenRefreshed,
          emailsFetched,
          emailsStored,
          processingTime
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[EmailSync] Synchronization failed:', errorMessage);

      this.updateStatus({
        isProcessing: false,
        error: errorMessage
      });

      return {
        success: false,
        emailsProcessed: 0,
        newEmails: 0,
        error: errorMessage
      };
    }
  }

  private async refreshAccessToken(account: any): Promise<string | null> {
    try {
      console.log('[EmailSync] Refreshing access token for:', account.email_address);

      if (!account.refresh_token) {
        throw new Error('No refresh token available');
      }

      const newToken = await outlookAuthService.refreshAccessToken(account.refresh_token);
      if (!newToken) {
        throw new Error('Token refresh returned null');
      }

      // Update token in database
      const { error: updateError } = await supabase
        .from('user_email_accounts')
        .update({
          access_token: newToken,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) {
        throw new Error(`Failed to update token: ${updateError.message}`);
      }

      console.log('[EmailSync] Token refreshed and stored successfully');
      return newToken;

    } catch (error) {
      console.error('[EmailSync] Token refresh failed:', error);
      return null;
    }
  }

  private async fetchEmailsFromOutlook(accessToken: string): Promise<any[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?` + new URLSearchParams({
          '$filter': `receivedDateTime ge ${sevenDaysAgo.toISOString()}`,
          '$select': 'id,subject,sender,receivedDateTime,bodyPreview,body',
          '$top': '50',
          '$orderby': 'receivedDateTime desc'
        }).toString(),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.value || !Array.isArray(data.value)) {
        throw new Error('Invalid response format from Outlook API');
      }

      console.log('[EmailSync] Successfully fetched', data.value.length, 'emails from Outlook');
      return data.value;

    } catch (error) {
      console.error('[EmailSync] Failed to fetch emails from Outlook:', error);
      throw error;
    }
  }

  private async processAndStoreEmails(emails: any[], account: any): Promise<{
    processed: number;
    stored: number;
    newEmails: number;
  }> {
    let processed = 0;
    let stored = 0;
    let newEmails = 0;

    for (const email of emails) {
      try {
        processed++;

        // Check if email already exists
        const { data: existing, error: checkError } = await supabase
          .from('extracted_email_data')
          .select('id')
          .eq('user_id', account.user_id)
          .eq('message_id', email.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('[EmailSync] Error checking existing email:', checkError);
          continue;
        }

        if (existing) {
          console.log('[EmailSync] Email already exists, skipping:', email.id);
          continue;
        }

        // Process email with emailProcessorService
        const extractedInfo = await emailProcessorService.extractEmailInformation(email);
        
        // Only store if we found relevant information
        if (extractedInfo.keywordsMatched.length > 0 || extractedInfo.confidenceScore > 0.3) {
          const { error: insertError } = await supabase
            .from('extracted_email_data')
            .insert({
              user_id: account.user_id,
              email_account_id: account.id,
              message_id: email.id,
              subject: email.subject,
              sender: email.sender?.emailAddress?.address || 'Unknown',
              received_at: email.receivedDateTime,
              extracted_type: extractedInfo.type,
              extracted_data: {
                dates: extractedInfo.dates,
                times: extractedInfo.times,
                locations: extractedInfo.locations,
                deadlines: extractedInfo.deadlines,
                description: extractedInfo.description
              },
              keywords_matched: extractedInfo.keywordsMatched,
              confidence_score: extractedInfo.confidenceScore
            });

          if (insertError) {
            console.error('[EmailSync] Error storing email:', insertError);
            continue;
          }

          stored++;
          newEmails++;
          console.log('[EmailSync] Stored new email:', email.subject);
        }

      } catch (emailError) {
        console.error('[EmailSync] Error processing individual email:', emailError);
        // Continue with next email
      }
    }

    return { processed, stored, newEmails };
  }

  getSyncStatus(): EmailSyncStatus {
    return { ...this.syncStatus };
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const emailSyncService = EmailSyncService.getInstance();