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
import { supabase } from '@/utils/supabase';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

// DEVELOPMENT ONLY: Set to true to bypass email verification during sign-in
const BYPASS_EMAIL_VERIFICATION = true;

export default function LoginScreen() {
  console.log('[App Initialization] LoginScreen component starting');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  
  const { session } = useSessionContext();
  const router = useRouter();

  console.log('[Session State] LoginScreen - current session:', { 
    sessionExists: !!session, 
    sessionValue: session 
  });

  // Redirect if already authenticated
  useEffect(() => {
    console.log('[User Auth] LoginScreen useEffect - session change detected:', session);
    if (session) {
      console.log('[Navigation] Redirecting to drawer - already authenticated', {
        destination: '/(drawer)/',
        params: { fromLogin: true }
      });
      router.replace('/(drawer)/');
    }
  }, [session, router]);

  const validateForm = () => {
    console.log('[User Auth] LoginScreen validateForm called');
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('[User Auth] Form validation result:', { isValid, errors: newErrors });
    return isValid;
  };

  const handleSignIn = async () => {
    console.log('[User Auth] LoginScreen handleSignIn initiated');
    
    if (!validateForm()) {
      console.log('[User Auth] Form validation failed, aborting sign in');
      return;
    }

    setLoading(true);
    setErrors({});
    console.log('[Loading] Activity indicator visible: LoginScreen - signing in');

    try {
      console.log('[User Auth] Attempting Supabase signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[User Auth] Supabase signIn error:', error);
        
        // DEVELOPMENT ONLY: Handle email not confirmed error
        if (BYPASS_EMAIL_VERIFICATION && error.message.includes('Email not confirmed')) {
          console.log('[DEV MODE] Email not confirmed error detected, attempting to confirm user automatically');
          
          try {
            // In development, we'll try to manually confirm the user
            // This is a workaround for development only
            const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const matchingUser = usersList.users.find(u => u.email === email);
    if (!matchingUser) throw new Error('User not found by email');

    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      matchingUser.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('[DEV MODE] Failed to auto-confirm user:', confirmError);
      setErrors({
        general: 'Development mode: Please contact admin to confirm your email address.',
      });
      return;
    }

    console.log('[DEV MODE] User auto-confirmed, attempting sign in again');

            // Try signing in again after confirmation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (retryError) {
              throw retryError;
            }
            
            if (retryData.session) {
              console.log('[DEV MODE] Auto-confirmation and sign in successful');
              router.replace('/(drawer)/');
              return;
            }
          } catch (confirmError) {
            console.error('[DEV MODE] Auto-confirmation failed:', confirmError);
            setErrors({ 
              general: 'Development mode: Email confirmation issue. Please try creating a new account.' 
            });
            return;
          }
        }
        
        throw error;
      }

      console.log('[User Auth] Supabase signIn successful:', { hasSession: !!data.session });

      if (data.session) {
        // Successful login
        console.log('[Navigation] Redirecting to drawer - login successful', {
          destination: '/(drawer)/',
          params: { loginSuccess: true }
        });
        router.replace('/(drawer)/');
      }
    } catch (error: any) {
      console.error('[User Auth] Sign in error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        setErrors({ 
          general: 'Invalid email or password. Please check your credentials and try again.' 
        });
      } else if (error.message.includes('Email not confirmed')) {
        setErrors({ 
          general: BYPASS_EMAIL_VERIFICATION 
            ? 'Development mode: Email confirmation issue. Please try creating a new account.'
            : 'Please check your email and click the confirmation link before signing in.' 
        });
      } else if (error.message.includes('Too many requests')) {
        setErrors({ 
          general: 'Too many login attempts. Please wait a moment before trying again.' 
        });
      } else {
        setErrors({ 
          general: error.message || 'An unexpected error occurred. Please try again.' 
        });
      }
    } finally {
      console.log('[Loading] Activity indicator hidden: LoginScreen - sign in completed');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log('[User Auth] LoginScreen handleForgotPassword called');
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Reset Link Sent',
        'We sent you a password reset link. Please check your email and follow the instructions to reset your password.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const navigateToSignUp = () => {
    console.log('[Navigation] Redirecting to signup from login', {
      destination: '/signup',
      params: { fromLogin: true }
    });
    router.push('/signup');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your journey with Vera
          </Text>
          {BYPASS_EMAIL_VERIFICATION && (
            <View style={styles.devModeIndicator}>
              <Text style={styles.devModeText}>
                🚧 DEV MODE: Email verification bypassed
              </Text>
            </View>
          )}
        </View>

        <Card style={styles.authCard}>
          <Text style={styles.authTitle}>Sign In</Text>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

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
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
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

          <View style={styles.optionsContainer}>
            <Button
              title="Forgot Password?"
              onPress={handleForgotPassword}
              variant="text"
              style={styles.forgotButton}
            />
          </View>

          <Button
            title={loading ? '' : 'Sign In'}
            onPress={handleSignIn}
            disabled={loading}
            style={styles.authButton}
          >
            {loading && (
              <ActivityIndicator size="small" color={COLORS.white} />
            )}
          </Button>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Don't have an account?</Text>
            <Button
              title="Sign Up"
              onPress={navigateToSignUp}
              variant="text"
              style={styles.switchButton}
            />
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
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
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: SIZES.radius_8,
    padding: SIZES.spacing_12,
    marginBottom: SIZES.spacing_16,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  optionsContainer: {
    alignItems: 'flex-end',
    marginBottom: SIZES.spacing_8,
  },
  forgotButton: {
    padding: 0,
    minWidth: 'auto',
  },
  authButton: {
    marginTop: SIZES.spacing_8,
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
  },
});