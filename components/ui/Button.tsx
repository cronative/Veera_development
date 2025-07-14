import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const scale = useSharedValue(1);
  
  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? COLORS.textLight : COLORS.pastelGreenDark,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? COLORS.divider : COLORS.pastelYellow,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? COLORS.textLight : COLORS.pastelGreenDark,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingHorizontal: 0,
        };
    }
  };
  
  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return {
          color: COLORS.white,
        };
      case 'secondary':
        return {
          color: COLORS.textDark,
        };
      case 'outline':
        return {
          color: disabled ? COLORS.textLight : COLORS.pastelGreenDark,
        };
      case 'text':
        return {
          color: disabled ? COLORS.textLight : COLORS.pastelGreenDark,
        };
    }
  };
  
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: SIZES.radius_8,
        };
      case 'medium':
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: SIZES.radius_8,
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: SIZES.radius_12,
        };
    }
  };
  
  const getTextSizeStyles = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: SIZES.sm,
        };
      case 'medium':
        return {
          fontSize: SIZES.md,
        };
      case 'large':
        return {
          fontSize: SIZES.lg,
        };
    }
  };
  
  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 200 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  return (
    <AnimatedTouchable
      style={[
        styles.button,
        getButtonStyles(),
        getSizeStyles(),
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? COLORS.white : COLORS.pastelGreenDark} 
        />
      ) : (
        <>
          {icon && icon}
          <Text 
            style={[
              styles.buttonText,
              getTextStyles(),
              getTextSizeStyles(),
              icon ? { marginLeft: 8 } : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...FONTS.medium,
    textAlign: 'center',
  },
});