import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Mail, Lock, User, Eye, EyeOff, CircleCheck as CheckCircle } from 'lucide-react-native';

interface OutlookAuthData {
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  timestamp: number;
}

// DEVELOPMENT ONLY: Set to true to bypass email verification
const BYPASS_EMAIL_VERIFICATION = true;

export default function SignUpScreen() {
  console.log('[App Initialization] SignUpScreen component starting');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [outlookAuthData, setOutlookAuthData] = useState<OutlookAuthData | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    username?: string;
    general?: string;
  }>({});
  
  const { session } = useSessionContext();
  const router = useRouter();

  console.log('[Session State] SignUpScreen - current session:', { 
    sessionExists: !!session, 
    sessionValue: session 
  });

  // Check for Outlook auth data on mount
  useEffect(() => {
    console.log('[App Initialization] SignUpScreen checking for Outlook auth data');
    checkForOutlookAuth();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('[User Auth] SignUpScreen useEffect - session change detected:', session);
    if (session) {
      console.log('[Navigation] Redirecting to drawer - already authenticated', {
        destination: '/(drawer)/',
        params: { fromSignup: true }
      });
      router.replace('/(drawer)/');
    }
  }, [session, router]);

  const checkForOutlookAuth = async () => {
    console.log('[User Auth] Checking for Outlook auth data in AsyncStorage');
    try {
      const tempAuthData = await AsyncStorage.getItem('outlook_auth_temp');
      if (tempAuthData) {
        try {
          const authData: OutlookAuthData = JSON.parse(tempAuthData);
          
          // Check if data is not too old (5 minutes)
          if (Date.now() - authData.timestamp < 300000) {
            console.log('[User Auth] Valid Outlook auth data found:', authData.email);
            setOutlookAuthData(authData);
            setEmail(authData.email);
            setFullName(authData.name);
            
            // Generate username from email
            const suggestedUsername = authData.email.split('@')[0].toLowerCase();
            setUsername(suggestedUsername);
          } else {
            // Clear expired data
            console.log('[User Auth] Outlook auth data expired, clearing');
            await AsyncStorage.removeItem('outlook_auth_temp');
          }
        } catch (error) {
          console.error('[User Auth] Error parsing Outlook auth data:', error);
          await AsyncStorage.removeItem('outlook_auth_temp');
        }
      } else {
        console.log('[User Auth] No Outlook auth data found');
      }
    } catch (error) {
      console.error('[User Auth] Error accessing AsyncStorage:', error);
    }
  };

  const validateForm = () => {
    console.log('[User Auth] SignUpScreen validateForm called');
    const newErrors: typeof errors = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation (only if not from Outlook)
    if (!outlookAuthData) {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('[User Auth] Form validation result:', { isValid, errors: newErrors });
    return isValid;
  };

  const handleSignUp = async () => {
    console.log('[User Auth] SignUpScreen handleSignUp initiated');
    
    if (!validateForm()) {
      console.log('[User Auth] Form validation failed, aborting sign up');
      return;
    }

    setLoading(true);
    // Clear any previous errors
    setErrors({});
    console.log('[Loading] Activity indicator visible: SignUpScreen - signing up');

    try {
      console.log('[User Auth] Attempting Supabase signUp');
      
      // DEVELOPMENT ONLY: Bypass email verification
      if (BYPASS_EMAIL_VERIFICATION) {
        console.log('[DEV MODE] Bypassing email verification - auto-confirming user');
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username,
            },
            // DEVELOPMENT: Skip email confirmation
            emailRedirectTo: undefined,
          },
        });

        if (error) {
          console.error('[User Auth] Supabase signUp error:', error);
          throw error;
        }

        console.log('[User Auth] Supabase signUp successful:', { 
          hasUser: !!data.user, 
          hasSession: !!data.session 
        });

        // If we have a session, user is automatically logged in
        if (data.user && data.session) {
          // If we have Outlook auth data, store the OAuth tokens
          if (outlookAuthData) {
            console.log('[User Auth] Storing Outlook tokens for new user');
            await storeOutlookTokens(data.user.id, outlookAuthData);
            
            // Clear temporary auth data
            await AsyncStorage.removeItem('outlook_auth_temp');
          }

          // User is automatically logged in
          Alert.alert(
            'Welcome to Vera!',
            outlookAuthData 
              ? 'Your account has been created and your Outlook account is connected.'
              : 'Your account has been created successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  console.log('[Navigation] Redirecting to drawer - signup successful', {
                    destination: '/(drawer)/',
                    params: { signupSuccess: true }
                  });
                  router.replace('/(drawer)/');
                },
              },
            ]
          );
        } else if (data.user && !data.session) {
          // User created but not automatically signed in - show success and redirect to login
          console.log('[DEV MODE] User created but not automatically signed in');
          
          Alert.alert(
            'Account Created!',
            'Your account has been created successfully. Please sign in to continue.',
            [
              {
                text: 'Continue to Sign In',
                onPress: () => {
                  console.log('[Navigation] Redirecting to login - account created', {
                    destination: '/login',
                    params: { accountCreated: true }
                  });
                  router.replace('/login');
                },
              },
            ]
          );
        }
      } else {
        // PRODUCTION: Original email verification flow
        console.log('[PRODUCTION MODE] Using email verification flow');
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username,
            },
            emailRedirectTo: 'veraapp://confirm-email',
          },
        });

        if (error) {
          console.error('[User Auth] Supabase signUp error:', error);
          throw error;
        }

        console.log('[User Auth] Supabase signUp successful:', { 
          hasUser: !!data.user, 
          hasSession: !!data.session 
        });

        if (data.user && data.session) {
          // If we have Outlook auth data, store the OAuth tokens
          if (outlookAuthData) {
            console.log('[User Auth] Storing Outlook tokens for new user');
            await storeOutlookTokens(data.user.id, outlookAuthData);
            
            // Clear temporary auth data
            await AsyncStorage.removeItem('outlook_auth_temp');
          }

          // User is automatically logged in
          Alert.alert(
            'Welcome to Vera!',
            outlookAuthData 
              ? 'Your account has been created and your Outlook account is connected.'
              : 'Your account has been created successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  console.log('[Navigation] Redirecting to drawer - signup successful', {
                    destination: '/(drawer)/',
                    params: { signupSuccess: true }
                  });
                  router.replace('/(drawer)/');
                },
              },
            ]
          );
        } else if (data.user && !data.session) {
          // Email confirmation required
          console.log('[User Auth] Email confirmation required');
          Alert.alert(
            'Check your email',
            'We sent you a confirmation link to complete your registration. Please check your email and click the link to verify your account.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[Navigation] Redirecting to login - email confirmation required', {
                    destination: '/login',
                    params: { emailConfirmationRequired: true }
                  });
                  router.replace('/login');
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('[User Auth] Sign up error:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('For security purposes, you can only request this after')) {
        // Rate limit error - extract the time if possible
        const timeMatch = error.message.match(/after (\d+) seconds/);
        const waitTime = timeMatch ? timeMatch[1] : '30';
        
        setErrors({ 
          general: `Too many signup attempts. Please wait ${waitTime} seconds before trying again.` 
        });
      } else if (error.message && error.message.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Please sign in instead.' });
      } else if (error.message && error.message.includes('invalid email')) {
        setErrors({ email: 'Please enter a valid email address' });
      } else if (error.message && error.message.includes('weak password')) {
        setErrors({ password: 'Password is too weak. Please choose a stronger password.' });
      } else {
        setErrors({ 
          general: error.message || 'An unexpected error occurred. Please try again.' 
        });
      }
    } finally {
      console.log('[Loading] Activity indicator hidden: SignUpScreen - sign up completed');
      setLoading(false);
    }
  };

  const storeOutlookTokens = async (userId: string, authData: OutlookAuthData) => {
    console.log('[User Auth] Storing Outlook tokens for user:', userId);
    try {
      // Store in OAuth tokens table
      const { error: oauthError } = await supabase
        .from('user_oauth_tokens')
        .insert({
          user_id: userId,
          provider: 'microsoft',
          access_token: authData.accessToken,
          refresh_token: authData.refreshToken,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        });

      if (oauthError) {
        console.error('[User Auth] Error storing OAuth tokens:', oauthError);
      }

      // Also store in email accounts table
      const { error: emailError } = await supabase
        .from('user_email_accounts')
        .insert({
          user_id: userId,
          email_address: authData.email,
          access_token: authData.accessToken,
          refresh_token: authData.refreshToken,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(),
          provider: 'microsoft'
        });

      if (emailError) {
        console.error('[User Auth] Error storing email account:', emailError);
      }

      console.log('[User Auth] Outlook tokens stored successfully');
    } catch (error) {
      console.error('[User Auth] Error storing Outlook tokens:', error);
    }
  };

  const navigateToSignIn = () => {
    console.log('[Navigation] Redirecting to login from signup', {
      destination: '/login',
      params: { fromSignup: true }
    });
    router.push('/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Join Vera</Text>
          <Text style={styles.subtitle}>
            Create your account and start your journey with your personal study companion
          </Text>
          {BYPASS_EMAIL_VERIFICATION && (
            <View style={styles.devModeIndicator}>
              <Text style={styles.devModeText}>
                🚧 DEV MODE: Email verification bypassed
              </Text>
            </View>
          )}
        </View>

        {outlookAuthData && (
          <Card style={styles.outlookCard}>
            <View style={styles.outlookHeader}>
              <CheckCircle size={24} color={COLORS.success} />
              <Text style={styles.outlookTitle}>Outlook Connected</Text>
            </View>
            <Text style={styles.outlookText}>
              Your Microsoft account is ready to connect. Complete your Vera account setup below.
            </Text>
          </Card>
        )}

        <Card style={styles.authCard}>
          <Text style={styles.authTitle}>Create Your Account</Text>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            leftIcon={<User size={20} color={COLORS.textMedium} />}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
          />

          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            leftIcon={<User size={20} color={COLORS.textMedium} />}
            autoCapitalize="words"
            error={errors.fullName}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            leftIcon={<Mail size={20} color={COLORS.textMedium} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            editable={!outlookAuthData}
            style={outlookAuthData ? styles.disabledInput : undefined}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            leftIcon={<Lock size={20} color={COLORS.textMedium} />}
            rightIcon={
              <Button
                title=""
                onPress={() => setShowPassword(!showPassword)}
                variant="text"
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.textMedium} />
                ) : (
                  <Eye size={20} color={COLORS.textMedium} />
                )}
              </Button>
            }
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            leftIcon={<Lock size={20} color={COLORS.textMedium} />}
            rightIcon={
              <Button
                title=""
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="text"
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={COLORS.textMedium} />
                ) : (
                  <Eye size={20} color={COLORS.textMedium} />
                )}
              </Button>
            }
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          <Button
            title={loading ? '' : 'Create Account'}
            onPress={handleSignUp}
            disabled={loading}
            style={styles.authButton}
          >
            {loading && (
              <ActivityIndicator size="small" color={COLORS.white} />
            )}
          </Button>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <Button
              title="Sign In"
              onPress={navigateToSignIn}
              variant="text"
              style={styles.switchButton}
            />
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.spacing_20,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_32,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.xxxl,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  subtitle: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SIZES.spacing_16,
  },
  devModeIndicator: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: SIZES.radius_8,
    padding: SIZES.spacing_8,
    marginTop: SIZES.spacing_16,
  },
  devModeText: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.warning,
    textAlign: 'center',
  },
  outlookCard: {
    marginBottom: SIZES.spacing_16,
    backgroundColor: COLORS.pastelGreen,
  },
  outlookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing_8,
  },
  outlookTitle: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginLeft: SIZES.spacing_8,
  },
  outlookText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  authCard: {
    marginBottom: SIZES.spacing_24,
  },
  authTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SIZES.spacing_24,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    borderRadius: 8,
    padding: SIZES.spacing_12,
    marginBottom: SIZES.spacing_16,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  disabledInput: {
    opacity: 0.7,
  },
  authButton: {
    marginTop: SIZES.spacing_16,
    marginBottom: SIZES.spacing_16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  switchButton: {
    marginLeft: SIZES.spacing_4,
  },
  eyeButton: {
    padding: 0,
    minWidth: 'auto',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SIZES.spacing_16,
  },
});