import { OUTLOOK_CONFIG, EMAIL_KEYWORDS, EXTRACTION_PATTERNS } from '@/constants/outlook';
import { supabase } from './supabase';
import { outlookAuthService } from './outlookAuth';

export interface EmailData {
  id: string;
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  body: {
    content: string;
    contentType: string;
  };
}

export interface ExtractedEmailInfo {
  type: 'opportunity' | 'event' | 'time_sensitive' | 'general';
  dates: string[];
  times: string[];
  locations: string[];
  deadlines: string[];
  keywordsMatched: string[];
  confidenceScore: number;
  description?: string;
}

export class EmailProcessorService {
  private static instance: EmailProcessorService;
  
  static getInstance(): EmailProcessorService {
    if (!EmailProcessorService.instance) {
      EmailProcessorService.instance = new EmailProcessorService();
    }
    return EmailProcessorService.instance;
  }

  async processUserEmails(userId: string): Promise<void> {
    try {
      console.log('[EmailProcessor] Starting email processing for user:', userId);
      
      // Get user's email accounts
      const { data: emailAccounts, error: accountsError } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('user_id', userId);

      if (accountsError) {
        throw accountsError;
      }

      if (!emailAccounts || emailAccounts.length === 0) {
        console.log('[EmailProcessor] No email accounts found for user');
        return;
      }

      // Process emails for each account
      for (const account of emailAccounts) {
        await this.processAccountEmails(account);
      }

      console.log('[EmailProcessor] Email processing completed');
    } catch (error) {
      console.error('[EmailProcessor] Error processing emails:', error);
      throw error;
    }
  }

  private async processAccountEmails(account: any): Promise<void> {
    try {
      console.log('[EmailProcessor] Processing emails for account:', account.email_address);
      
      // Check if token is expired and refresh if needed
      let accessToken = account.access_token;
      if (new Date(account.token_expires_at) <= new Date()) {
        console.log('[EmailProcessor] Token expired, refreshing...');
        accessToken = await outlookAuthService.refreshAccessToken(account.refresh_token);
        
        if (!accessToken) {
          console.error('[EmailProcessor] Failed to refresh token for account:', account.email_address);
          return;
        }

        // Update token in database
        await supabase
          .from('user_email_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
          })
          .eq('id', account.id);
      }

      // Fetch recent emails (last 7 days)
      const emails = await this.fetchRecentEmails(accessToken);
      console.log('[EmailProcessor] Fetched', emails.length, 'emails');

      // Process each email
      for (const email of emails) {
        await this.processIndividualEmail(email, account);
      }
    } catch (error) {
      console.error('[EmailProcessor] Error processing account emails:', error);
    }
  }

  private async fetchRecentEmails(accessToken: string): Promise<EmailData[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const response = await fetch(
        `${OUTLOOK_CONFIG.GRAPH_API_BASE}/me/messages?` + new URLSearchParams({
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
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('[EmailProcessor] Error fetching emails:', error);
      return [];
    }
  }

  private async processIndividualEmail(email: EmailData, account: any): Promise<void> {
    try {
      // Check if email already processed
      const { data: existing } = await supabase
        .from('extracted_email_data')
        .select('id')
        .eq('user_id', account.user_id)
        .eq('message_id', email.id)
        .single();

      if (existing) {
        console.log('[EmailProcessor] Email already processed:', email.id);
        return;
      }

      // Extract information from email
      const extractedInfo = this.extractEmailInformation(email);
      
      // Only store if we found relevant information
      if (extractedInfo.keywordsMatched.length > 0 || extractedInfo.confidenceScore > 0.3) {
        await this.storeExtractedData(email, account, extractedInfo);
        console.log('[EmailProcessor] Stored extracted data for email:', email.subject);
      }
    } catch (error) {
      console.error('[EmailProcessor] Error processing individual email:', error);
    }
  }

  // Make this method public so it can be used by EmailSyncService
  extractEmailInformation(email: EmailData): ExtractedEmailInfo {
    const content = `${email.subject} ${email.bodyPreview} ${email.body?.content || ''}`.toLowerCase();
    
    // Find matching keywords
    const keywordsMatched: string[] = [];
    let type: ExtractedEmailInfo['type'] = 'general';
    let maxMatches = 0;

    // Check each category
    Object.entries(EMAIL_KEYWORDS).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
      keywordsMatched.push(...matches);
      
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        type = category.toLowerCase() as ExtractedEmailInfo['type'];
      }
    });

    // Extract structured data
    const dates = this.extractDates(content);
    const times = this.extractTimes(content);
    const locations = this.extractLocations(content);
    const deadlines = this.extractDeadlines(content);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(keywordsMatched, dates, times, locations, deadlines);

    return {
      type,
      dates,
      times,
      locations,
      deadlines,
      keywordsMatched: [...new Set(keywordsMatched)], // Remove duplicates
      confidenceScore,
      description: email.bodyPreview
    };
  }

  private extractDates(content: string): string[] {
    const dates: string[] = [];
    EXTRACTION_PATTERNS.DATE.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });
    return [...new Set(dates)];
  }

  private extractTimes(content: string): string[] {
    const times: string[] = [];
    EXTRACTION_PATTERNS.TIME.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        times.push(...matches);
      }
    });
    return [...new Set(times)];
  }

  private extractLocations(content: string): string[] {
    const locations: string[] = [];
    EXTRACTION_PATTERNS.LOCATION.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          locations.push(match[1].trim());
        }
      });
    });
    return [...new Set(locations)];
  }

  private extractDeadlines(content: string): string[] {
    const deadlines: string[] = [];
    EXTRACTION_PATTERNS.DEADLINE.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          deadlines.push(match[1].trim());
        }
      });
    });
    return [...new Set(deadlines)];
  }

  private calculateConfidenceScore(
    keywords: string[],
    dates: string[],
    times: string[],
    locations: string[],
    deadlines: string[]
  ): number {
    let score = 0;
    
    // Base score from keywords
    score += keywords.length * 0.2;
    
    // Bonus for structured data
    if (dates.length > 0) score += 0.3;
    if (times.length > 0) score += 0.2;
    if (locations.length > 0) score += 0.2;
    if (deadlines.length > 0) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private async storeExtractedData(email: EmailData, account: any, extractedInfo: ExtractedEmailInfo): Promise<void> {
    const { error } = await supabase
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

    if (error) {
      console.error('[EmailProcessor] Error storing extracted data:', error);
      throw error;
    }
  }
}

export const emailProcessorService = EmailProcessorService.getInstance();