import { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolateColor
} from 'react-native-reanimated';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Checkbox({ 
  checked, 
  onPress, 
  label, 
  disabled = false,
  style 
}: CheckboxProps) {
  const scale = useSharedValue(checked ? 1 : 0);
  const checkboxScale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    
    checkboxScale.value = withSpring(0.9, { damping: 10, stiffness: 200 }, () => {
      checkboxScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    
    scale.value = withSpring(checked ? 0 : 1, {
      damping: 10,
      stiffness: 200,
    });
    
    onPress();
  };

  const checkboxAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        scale.value,
        [0, 1],
        ['transparent', COLORS.pastelGreenDark]
      ),
      borderColor: interpolateColor(
        scale.value,
        [0, 1],
        [COLORS.textMedium, COLORS.pastelGreenDark]
      ),
      transform: [{ scale: checkboxScale.value }],
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: scale.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchable
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.checkbox, checkboxAnimatedStyle]}>
        <Animated.View style={checkAnimatedStyle}>
          <Check size={16} color={COLORS.white} />
        </Animated.View>
      </Animated.View>
      
      {label && (
        <Text style={[
          styles.label,
          disabled && styles.disabledLabel
        ]}>
          {label}
        </Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing_8,
  },
  label: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textDark,
    flex: 1,
  },
  disabledLabel: {
    color: COLORS.textLight,
  },
});