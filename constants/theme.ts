import { Platform } from 'react-native';

export const COLORS = {
  // Primary pastel colors
  pastelYellow: '#FCEEC8',
  pastelYellowDark: '#FFF176',
  pastelGreen: '#BED196',
  pastelGreenDark: '#556F44',
  
  // Supporting colors
  pastelBlue: '#92AFD7',
  pastelPink: '#F8BBD0',
  pastelPurple: '#E1BEE7',
  
  // Text colors
  textDark: '#424242',
  textMedium: '#757575',
  textLight: '#9E9E9E',
  
  // UI colors
  white: '#FFFFFF',
  background: '#FAFAFA',
  divider: '#E0E0E0',
  error: '#E53E3E',
  success: '#66BB6A',
  warning: '#FFCA28',
  
  // Overlay colors
  overlayLight: 'rgba(255, 255, 255, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.1)',
};

export const SIZES = {
  // Typography
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Spacing
  spacing_2: 2,
  spacing_4: 4,
  spacing_8: 8,
  spacing_12: 12,
  spacing_16: 16,
  spacing_20: 20,
  spacing_24: 24,
  spacing_32: 32,
  spacing_40: 40,
  spacing_48: 48,
  
  // Radius
  radius_4: 4,
  radius_8: 8,
  radius_12: 12,
  radius_16: 16,
  radius_20: 20,
  radius_24: 24,
  radius_32: 32,
  
  // UI Elements
  inputHeight: 48,
  buttonHeight: 48,
  
  // Layout
  width_percent_100: '100%',
  height_percent_100: '100%',
};

export const FONTS = {
  regular: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: 'Arial'
    }),
    fontWeight: '700' as const,
  },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;