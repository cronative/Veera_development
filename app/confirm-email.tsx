import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { useRouter, useURL } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Mail, ArrowRight } from 'lucide-react-native';

type ConfirmationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

interface ConfirmationResult {
  state: ConfirmationState;
  message: string;
  userEmail?: string;
}

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult>({
    state: 'loading',
    message: 'Confirming your email address...'
  });

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
  try {
    console.log('[EmailConfirmation] Starting confirmation process');

    const url = await Linking.getInitialURL();

    if (!url) throw new Error('No URL found on initial load');

    console.log('[EmailConfirmation] Full URL:', url);

    const hasHash = url.includes('#');
    const queryString = hasHash
      ? url.split('#')[1]
      : url.split('?')[1] ?? '';

    const queryParams = new URLSearchParams(queryString);

    const access_token = queryParams.get('access_token');
    const refresh_token = queryParams.get('refresh_token');
    const type = queryParams.get('type');

    if (!access_token || !refresh_token) {
      setConfirmationResult({
        state: 'invalid',
        message: 'Invalid or missing tokens in confirmation link.',
      });
      return;
    }

    await handleSignupConfirmation(access_token, refresh_token);

  } catch (error) {
    console.error('[EmailConfirmation] Error:', error);
    setConfirmationResult({
      state: 'error',
      message: 'Failed to confirm email: ' + error.message,
    });
  }
};

  const handleSignupConfirmation = async (accessToken: string, refreshToken: string) => {
    try {
      // Set the session using the tokens from the URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) throw error;

      if (data.session && data.user) {
        console.log('[EmailConfirmation] Signup confirmation successful');
        setConfirmationResult({
          state: 'success',
          message: 'Your email has been confirmed successfully! Welcome to Vera.',
          userEmail: data.user.email
        });

        // Auto-redirect after a short delay
        setTimeout(() => {
          router.replace('/(drawer)/');
        }, 2000);
      } else {
        throw new Error('No session created after confirmation');
      }
    } catch (error) {
      console.error('[EmailConfirmation] Signup confirmation error:', error);
      throw error;
    }
  };

  const handleEmailChangeConfirmation = async (token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email_change'
      });

      if (error) throw error;

      console.log('[EmailConfirmation] Email change confirmation successful');
      setConfirmationResult({
        state: 'success',
        message: 'Your email address has been updated successfully!',
        userEmail: data.user?.email
      });

      // Auto-redirect after a short delay
      setTimeout(() => {
        router.replace('/(drawer)/');
      }, 2000);
    } catch (error) {
      console.error('[EmailConfirmation] Email change confirmation error:', error);
      throw error;
    }
  };

  const handleGeneralConfirmation = async (token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) throw error;

      console.log('[EmailConfirmation] General confirmation successful');
      setConfirmationResult({
        state: 'success',
        message: 'Your email has been confirmed successfully!',
        userEmail: data.user?.email
      });

      // Auto-redirect after a short delay
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      console.error('[EmailConfirmation] General confirmation error:', error);
      throw error;
    }
  };

  const handleContinueToLogin = () => {
    router.replace('/login');
  };

  const handleContinueToApp = () => {
    router.replace('/(drawer)/');
  };

  const handleResendConfirmation = async () => {
    try {
      // This would require the user's email, which we might not have
      // For now, redirect to signup to start over
      router.replace('/signup');
    } catch (error) {
      console.error('[EmailConfirmation] Error resending confirmation:', error);
    }
  };

  const renderContent = () => {
    switch (confirmationResult.state) {
      case 'loading':
        return (
          <Card style={styles.card}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.pastelBlue} />
              <Text style={styles.loadingText}>{confirmationResult.message}</Text>
            </View>
          </Card>
        );

      case 'success':
        return (
          <Card style={styles.card}>
            <View style={styles.successContainer}>
              <CheckCircle size={64} color={COLORS.success} />
              <Text style={styles.successTitle}>Email Confirmed!</Text>
              <Text style={styles.successMessage}>{confirmationResult.message}</Text>
              
              {confirmationResult.userEmail && (
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{confirmationResult.userEmail}</Text>
                </View>
              )}

              <Text style={styles.redirectText}>
                Redirecting you to the app...
              </Text>

              <Button
                title="Continue to App"
                onPress={handleContinueToApp}
                icon={<ArrowRight size={20} color={COLORS.white} />}
                style={styles.actionButton}
              />
            </View>
          </Card>
        );

      case 'expired':
        return (
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <AlertCircle size={64} color={COLORS.warning} />
              <Text style={styles.errorTitle}>Link Expired</Text>
              <Text style={styles.errorMessage}>{confirmationResult.message}</Text>
              
              <View style={styles.errorActions}>
                <Button
                  title="Sign Up Again"
                  onPress={handleResendConfirmation}
                  style={styles.actionButton}
                />
                <Button
                  title="Go to Login"
                  onPress={handleContinueToLogin}
                  variant="outline"
                  style={styles.secondaryButton}
                />
              </View>
            </View>
          </Card>
        );

      case 'invalid':
        return (
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <AlertCircle size={64} color={COLORS.error} />
              <Text style={styles.errorTitle}>Invalid Link</Text>
              <Text style={styles.errorMessage}>{confirmationResult.message}</Text>
              
              <View style={styles.errorActions}>
                <Button
                  title="Go to Login"
                  onPress={handleContinueToLogin}
                  style={styles.actionButton}
                />
                <Button
                  title="Sign Up Again"
                  onPress={handleResendConfirmation}
                  variant="outline"
                  style={styles.secondaryButton}
                />
              </View>
            </View>
          </Card>
        );

      case 'error':
        return (
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <AlertCircle size={64} color={COLORS.error} />
              <Text style={styles.errorTitle}>Confirmation Failed</Text>
              <Text style={styles.errorMessage}>{confirmationResult.message}</Text>
              
              <View style={styles.errorActions}>
                <Button
                  title="Try Again"
                  onPress={handleEmailConfirmation}
                  style={styles.actionButton}
                />
                <Button
                  title="Go to Login"
                  onPress={handleContinueToLogin}
                  variant="outline"
                  style={styles.secondaryButton}
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
        <Mail size={48} color={COLORS.pastelBlue} />
        <Text style={styles.headerTitle}>Email Confirmation</Text>
        <Text style={styles.headerSubtitle}>
          Verifying your email address
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_32,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
    marginTop: SIZES.spacing_16,
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
    marginBottom: SIZES.spacing_16,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
    padding: SIZES.spacing_12,
    backgroundColor: COLORS.pastelGreen,
    borderRadius: SIZES.radius_8,
    width: '100%',
  },
  userEmail: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textDark,
  },
  redirectText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
    fontStyle: 'italic',
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
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
});