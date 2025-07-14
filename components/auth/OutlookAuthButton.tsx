import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Mail, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useOutlookAuth } from '@/hooks/useOutlookAuth';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';

interface OutlookAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OutlookAuthButton({ onSuccess, onError, style }: OutlookAuthButtonProps) {
  const { 
    authenticate, 
    isAuthenticating, 
    isProcessingEmails,
    authResult, 
    error,
    isAuthenticated,
    clearError 
  } = useOutlookAuth();

  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  const handlePress = async () => {
    // Clear any previous errors
    clearError();
    
    // Animate button press
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    try {
      const result = await authenticate();
      
      if (result.success) {
        // Success animation
        backgroundColor.value = withTiming(1, { duration: 300 });
        onSuccess?.();
      } else {
        // Error animation
        backgroundColor.value = withSequence(
          withTiming(0.5, { duration: 150 }),
          withTiming(0, { duration: 150 })
        );
        onError?.(result.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      onError?.(errorMessage);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = backgroundColor.value > 0.5 
      ? COLORS.error 
      : backgroundColor.value > 0 
        ? COLORS.success 
        : COLORS.pastelBlue;
        
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bgColor,
    };
  });

  const getButtonContent = () => {
    if (isAuthenticating) {
      return (
        <>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.buttonText}>Connecting to Outlook...</Text>
        </>
      );
    }

    if (isProcessingEmails) {
      return (
        <>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.buttonText}>Processing Emails...</Text>
        </>
      );
    }

    if (isAuthenticated) {
      return (
        <>
          <CheckCircle size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Outlook Connected</Text>
        </>
      );
    }

    if (error) {
      return (
        <>
          <AlertCircle size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Retry Connection</Text>
        </>
      );
    }

    return (
      <>
        <Mail size={20} color={COLORS.white} />
        <Text style={styles.buttonText}>Connect Outlook</Text>
      </>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <AnimatedTouchable
        style={[styles.button, animatedStyle]}
        onPress={handlePress}
        disabled={isAuthenticating || isProcessingEmails}
        activeOpacity={0.8}
      >
        {getButtonContent()}
      </AnimatedTouchable>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {isAuthenticated && authResult?.userInfo && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            Connected as {authResult.userInfo.email}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.pastelBlue,
    paddingVertical: SIZES.spacing_16,
    paddingHorizontal: SIZES.spacing_24,
    borderRadius: SIZES.radius_12,
    minHeight: 56,
  },
  buttonText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.white,
    marginLeft: SIZES.spacing_8,
  },
  errorContainer: {
    marginTop: SIZES.spacing_8,
    padding: SIZES.spacing_12,
    backgroundColor: COLORS.error + '20',
    borderRadius: SIZES.radius_8,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  successContainer: {
    marginTop: SIZES.spacing_8,
    padding: SIZES.spacing_12,
    backgroundColor: COLORS.success + '20',
    borderRadius: SIZES.radius_8,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  successText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.success,
    textAlign: 'center',
  },
});