import { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus && props.onFocus;
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    props.onBlur && props.onBlur;
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const renderPasswordIcon = () => {
    if (!isPassword) return rightIcon;
    
    return (
      <TouchableOpacity onPress={togglePasswordVisibility}>
        {showPassword ? 
          <EyeOff size={20} color={COLORS.textMedium} /> : 
          <Eye size={20} color={COLORS.textMedium} />
        }
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
        ]}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && { paddingLeft: 8 },
            (rightIcon || isPassword) && { paddingRight: 8 },
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textLight}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        
        {(rightIcon || isPassword) && (
          <View style={styles.iconContainer}>
            {renderPasswordIcon()}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacing_16,
  },
  label: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.radius_8,
    backgroundColor: COLORS.white,
    height: SIZES.inputHeight,
    paddingHorizontal: SIZES.spacing_12,
  },
  input: {
    ...FONTS.regular,
    flex: 1,
    color: COLORS.textDark,
    fontSize: SIZES.md,
    height: '100%',
  },
  iconContainer: {
    paddingHorizontal: SIZES.spacing_8,
  },
  focused: {
    borderColor: COLORS.pastelGreenDark,
  },
  error: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.error,
    marginTop: SIZES.spacing_4,
  },
});