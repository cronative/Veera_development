import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSession } from '@supabase/auth-helpers-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, ArrowRight } from 'lucide-react-native';

interface CallbackState {
  status: 'loading' | 'success' | 'error' | 'new_user' | 'existing_user';
  message: string;
  userInfo?: {
    email: string;
    name: string;
    isNewUser: boolean;
  };
}

export default function OutlookCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const session = useSession();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing authentication...'
  });

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      // Extract parameters from URL
      const { code, error, state } = params;

      // Handle OAuth errors
      if (error) {
        setCallbackState({
          status: 'error',
          message: getErrorMessage(error as string)
        });
        return;
      }

      // Validate required parameters
      if (!code) {
        setCallbackState({
          status: 'error',
          message: 'Missing authorization code. Please try authenticating again.'
        });
        return;
      }

      // Validate state parameter for CSRF protection
      if (!state) {
        setCallbackState({
          status: 'error',
          message: 'Invalid authentication state. Please try again.'
        });
        return;
      }

      setCallbackState({
        status: 'loading',
        message: 'Exchanging authorization code...'
      });

      // Exchange code for tokens
      const tokenResult = await exchangeCodeForTokens(code as string);
      
      if (!tokenResult.success) {
        setCallbackState({
          status: 'error',
          message: tokenResult.error || 'Failed to exchange authorization code'
        });
        return;
      }

      setCallbackState({
        status: 'loading',
        message: 'Retrieving user information...'
      });

      // Get user info from Microsoft Graph
      const userInfo = await getUserInfo(tokenResult.accessToken!);
      
      setCallbackState({
        status: 'loading',
        message: 'Checking user account...'
      });

      // Check if user exists in our system
      const userStatus = await checkUserStatus(userInfo.email);
      
      if (userStatus.isNewUser) {
        // Store temporary auth data for signup process
        await storeTemporaryAuthData({
          email: userInfo.email,
          name: userInfo.name,
          accessToken: tokenResult.accessToken!,
          refreshToken: tokenResult.refreshToken
        });

        setCallbackState({
          status: 'new_user',
          message: 'Welcome! Let\'s complete your account setup.',
          userInfo: {
            email: userInfo.email,
            name: userInfo.name,
            isNewUser: true
          }
        });
      } else {
        // Existing user - complete authentication
        await completeAuthentication(userStatus.userId!, {
          accessToken: tokenResult.accessToken!,
          refreshToken: tokenResult.refreshToken,
          userInfo
        });

        setCallbackState({
          status: 'existing_user',
          message: 'Welcome back! Redirecting to your dashboard...',
          userInfo: {
            email: userInfo.email,
            name: userInfo.name,
            isNewUser: false
          }
        });

        // Auto-redirect existing users after a brief delay
        setTimeout(() => {
          router.replace('/(tabs)/');
        }, 2000);
      }

    } catch (error) {
      console.error('[OutlookCallback] Processing error:', error);
      setCallbackState({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID!,
          client_secret: process.env.EXPO_PUBLIC_AZURE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: 'https://vera-app.com/auth/outlook/callback'
        }).toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || 'Token exchange failed');
      }

      const tokenData = await response.json();
      
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  };

  const getUserInfo = async (accessToken: string) => {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve user information');
    }

    const userData = await response.json();
    return {
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      name: userData.displayName
    };
  };

  const checkUserStatus = async (email: string) => {
    // Check if user exists in Supabase auth
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error('Failed to check user status');
    }

    const existingUser = data.users.find(user => 
      user.email === email || user.user_metadata?.email === email
    );

    return {
      isNewUser: !existingUser,
      userId: existingUser?.id
    };
  };

  const storeTemporaryAuthData = async (authData: any) => {
    // Store in AsyncStorage for signup process
    try {
      await AsyncStorage.setItem('outlook_auth_temp', JSON.stringify({
        ...authData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error storing temporary auth data:', error);
    }
  };

  const completeAuthentication = async (userId: string, authData: any) => {
    // Store OAuth tokens in database
    const { error } = await supabase
      .from('user_oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'microsoft',
        access_token: authData.accessToken,
        refresh_token: authData.refreshToken,
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
      });

    if (error) {
      throw new Error('Failed to store authentication tokens');
    }

    // Also store in email accounts table
    await supabase
      .from('user_email_accounts')
      .upsert({
        user_id: userId,
        email_address: authData.userInfo.email,
        access_token: authData.accessToken,
        refresh_token: authData.refreshToken,
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        provider: 'microsoft'
      });
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. Please try again and grant the necessary permissions.';
      case 'invalid_request':
        return 'Invalid authentication request. Please try again.';
      case 'unauthorized_client':
        return 'Application is not authorized. Please contact support.';
      case 'unsupported_response_type':
        return 'Authentication method not supported. Please contact support.';
      case 'invalid_scope':
        return 'Invalid permissions requested. Please contact support.';
      case 'server_error':
        return 'Microsoft authentication server error. Please try again later.';
      case 'temporarily_unavailable':
        return 'Authentication service temporarily unavailable. Please try again later.';
      default:
        return `Authentication error: ${error}. Please try again.`;
    }
  };

  const handleContinueToSignup = () => {
    router.replace('/signup');
  };

  const handleContinueToDashboard = () => {
    router.replace('/(tabs)/');
  };

  const handleRetry = () => {
    router.replace('/login');
  };

  const renderContent = () => {
    switch (callbackState.status) {
      case 'loading':
        return (
          <Card style={styles.card}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.pastelBlue} />
              <Text style={styles.loadingText}>{callbackState.message}</Text>
            </View>
          </Card>
        );

      case 'success':
      case 'existing_user':
        return (
          <Card style={styles.card}>
            <View style={styles.successContainer}>
              <CheckCircle size={64} color={COLORS.success} />
              <Text style={styles.successTitle}>Authentication Successful!</Text>
              <Text style={styles.successMessage}>{callbackState.message}</Text>
              
              {callbackState.userInfo && (
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoText}>
                    Welcome back, {callbackState.userInfo.name}!
                  </Text>
                  <Text style={styles.userEmail}>
                    {callbackState.userInfo.email}
                  </Text>
                </View>
              )}

              <Button
                title="Continue to Dashboard"
                onPress={handleContinueToDashboard}
                icon={<ArrowRight size={20} color={COLORS.white} />}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );

      case 'new_user':
        return (
          <Card style={styles.card}>
            <View style={styles.newUserContainer}>
              <CheckCircle size={64} color={COLORS.pastelBlue} />
              <Text style={styles.newUserTitle}>Almost There!</Text>
              <Text style={styles.newUserMessage}>{callbackState.message}</Text>
              
              {callbackState.userInfo && (
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoText}>
                    Hi {callbackState.userInfo.name}!
                  </Text>
                  <Text style={styles.userEmail}>
                    {callbackState.userInfo.email}
                  </Text>
                  <Text style={styles.setupText}>
                    Let's set up your Vera account to get started.
                  </Text>
                </View>
              )}

              <Button
                title="Complete Account Setup"
                onPress={handleContinueToSignup}
                icon={<ArrowRight size={20} color={COLORS.white} />}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );

      case 'error':
        return (
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <AlertCircle size={64} color={COLORS.error} />
              <Text style={styles.errorTitle}>Authentication Failed</Text>
              <Text style={styles.errorMessage}>{callbackState.message}</Text>
              
              <View style={styles.errorActions}>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  style={styles.retryButton}
                />
                <Button
                  title="Go to Login"
                  onPress={() => router.replace('/login')}
                  variant="outline"
                  style={styles.loginButton}
                />
              </View>
            </View>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Microsoft Authentication</Text>
        <Text style={styles.headerSubtitle}>
          Connecting your Outlook account to Vera
        </Text>
      </View>
      
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.spacing_20,
  },
  header: {
    alignItems: 'center',
    marginTop: SIZES.spacing_48,
    marginBottom: SIZES.spacing_32,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  headerSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    padding: SIZES.spacing_32,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginTop: SIZES.spacing_16,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginTop: SIZES.spacing_16,
    marginBottom: SIZES.spacing_8,
  },
  successMessage: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
  },
  newUserContainer: {
    alignItems: 'center',
  },
  newUserTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginTop: SIZES.spacing_16,
    marginBottom: SIZES.spacing_8,
  },
  newUserMessage: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_24,
    padding: SIZES.spacing_16,
    backgroundColor: COLORS.pastelGreen,
    borderRadius: SIZES.radius_12,
    width: '100%',
  },
  userInfoText: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_4,
  },
  userEmail: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginBottom: SIZES.spacing_8,
  },
  setupText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginTop: SIZES.spacing_16,
    marginBottom: SIZES.spacing_8,
  },
  errorMessage: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: SIZES.spacing_12,
    width: '100%',
  },
  actionButton: {
    minWidth: 200,
  },
  retryButton: {
    flex: 1,
  },
  loginButton: {
    flex: 1,
  },
});