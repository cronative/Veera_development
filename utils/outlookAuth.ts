import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { exchangeCodeAsync, TokenResponse } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { OUTLOOK_CONFIG } from '@/constants/outlook';
import { supabase } from './supabase';

// Configure WebBrowser for authentication
WebBrowser.maybeCompleteAuthSession();

export interface OutlookAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  userInfo?: {
    email: string;
    name: string;
    id: string;
  };
  error?: string;
}

export class OutlookAuthService {
  private static instance: OutlookAuthService;
  
  static getInstance(): OutlookAuthService {
    if (!OutlookAuthService.instance) {
      OutlookAuthService.instance = new OutlookAuthService();
    }
    return OutlookAuthService.instance;
  }

  async authenticate(): Promise<OutlookAuthResult> {
    try {
      console.log('[OutlookAuth] Starting PKCE authentication...');

      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be logged in to connect Outlook');
      }

      // Generate redirect URI using AuthSession
      // const redirectUri = AuthSession.makeRedirectUri({
      //   scheme: Platform.OS === 'web' ? undefined : 'veraapp',
      //   path: 'auth/outlook/callback'
      // });
      const redirectUri = AuthSession.makeRedirectUri({
        native: Platform.select({
          ios: OUTLOOK_CONFIG.REDIRECT_URIS.ios,
          android: OUTLOOK_CONFIG.REDIRECT_URIS.android,
        }),
        useProxy: false,
      });
      
      console.log('[OutlookAuth] Redirect URI:', redirectUri);
      
      // Configure the authorization request
      const authRequest = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID!,
        scopes: OUTLOOK_CONFIG.SCOPES.split(' '),
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          response_mode: 'query',
          state: Math.random().toString(36).substring(7), // CSRF protection
          tenant: process.env.EXPO_PUBLIC_AZURE_TENANT_ID || 'common'
        },
      });

      // Start the authorization session
      const result = await authRequest.promptAsync({
        authorizationEndpoint: OUTLOOK_CONFIG.AUTH_ENDPOINT
      });

      console.log('[OutlookAuth] Auth result:', result);

      if (result.type !== 'success') {
        return {
          success: false,
          error: result.type === 'cancel' 
            ? 'Authentication was cancelled' 
            : `Authentication failed: ${result.type}`
        };
      }

      if (result.params.error) {
        return {
          success: false,
          error: `Authentication error: ${result.params.error}`
        };
      }

      if (!result.params.code) {
        return {
          success: false,
          error: 'No authorization code received'
        };
      }

      // Exchange code for tokens using AuthSession
      return await this.exchangeCodeForTokens(
        authRequest,
        result.params.code,
        redirectUri,
        user.id
      );
    } catch (error) {
      console.error('[OutlookAuth] Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  }

  private async exchangeCodeForTokens(
    authRequest: AuthSession.AuthRequest,
    code: string,
    redirectUri: string,
    userId: string
  ): Promise<OutlookAuthResult> {
    try {
      console.log('[OutlookAuth] Exchanging code for tokens with PKCE...');
      
      // Use AuthSession's token exchange method
      const tokenResult: TokenResponse = await exchangeCodeAsync(
        {
          clientId: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID!,
          code,
          redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier!
          }
        },
        {
          tokenEndpoint: OUTLOOK_CONFIG.TOKEN_ENDPOINT,
        }
      );

      console.log('[OutlookAuth] Token exchange successful');

      if (!tokenResult.accessToken) {
        throw new Error('No access token received');
      }

      // Get user info
      const userInfo = await this.getUserInfo(tokenResult.accessToken);
      
      // Calculate expiration date
      const expiresAt = tokenResult.expiresIn 
        ? new Date(Date.now() + (tokenResult.expiresIn * 1000))
        : new Date(Date.now() + 3600000); // Default 1 hour

      console.log('[OutlookAuth] Access Token:', tokenResult.accessToken);
      console.log('[OutlookAuth] Refresh Token:', tokenResult.refreshToken);
      
      // Store tokens in Supabase
      await this.storeUserTokens({
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken || '',
        expiresAt,
        userInfo,
        userId
      });

      return {
        success: true,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt,
        userInfo
      };
    } catch (error) {
      console.error('[OutlookAuth] Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  private async getUserInfo(accessToken: string) {
    const response = await fetch(`${OUTLOOK_CONFIG.GRAPH_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await response.json();
    return {
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      name: userData.displayName
    };
  }

  private async storeUserTokens(data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    userInfo: any;
    userId: string;
  }) {
    // Store in user_oauth_tokens table
    const { error: oauthError } = await supabase
      .from('user_oauth_tokens')
      .upsert({
        user_id: data.userId,
        provider: 'microsoft',
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        expires_at: data.expiresAt.toISOString()
      });

    if (oauthError) {
      console.error('[OutlookAuth] Error storing OAuth tokens:', oauthError);
      throw oauthError;
    }

    // Also store in user_email_accounts for backward compatibility
    const { error } = await supabase
      .from('user_email_accounts')
      .upsert({
        user_id: data.userId,
        email_address: data.userInfo.email,
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        token_expires_at: data.expiresAt.toISOString(),
        provider: 'microsoft'
      });

    if (error) {
      console.error('[OutlookAuth] Error storing email account:', error);
      throw error;
    }

    console.log('[OutlookAuth] Tokens stored successfully');
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(OUTLOOK_CONFIG.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID!,
          client_secret: process.env.EXPO_PUBLIC_AZURE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }).toString()
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('[OutlookAuth] Token refresh error:', error);
      return null;
    }
  }
}

export const outlookAuthService = OutlookAuthService.getInstance();