import { scaleFont, scaleSize } from "@/utils/responsive";
import { Platform } from "react-native";

export const COLORS = {
  // Primary pastel colors
  pastelYellow: "#FCEEC8",
  pastelYellowDark: "#FFF176",
  pastelGreen: "#BED196",
  pastelGreenDark: "#556F44",

  // Supporting colors
  pastelBlue: "#92AFD7",
  pastelPink: "#F8BBD0",
  pastelPurple: "#E1BEE7",

  // Text colors
  textDark: "#424242",
  textMedium: "#757575",
  textLight: "#9E9E9E",

  // UI colors
  black: "#000000",
  white: "#FFFFFF",
  background: "#FAFAFA",
  divider: "#E0E0E0",
  error: "#E53E3E",
  success: "#66BB6A",
  warning: "#FFCA28",

  // Overlay colors
  overlayLight: "rgba(255, 255, 255, 0.7)",
  overlayDark: "rgba(0, 0, 0, 0.1)",

  // new colors
  veraColor: "#ABA54B",
  pastelBlueDark: "#233667",
};

export const SIZES = {
  // Typography
  xxs: scaleFont(10),
  xs: scaleFont(12),
  sm: scaleFont(14),
  md: scaleFont(16),
  lg: scaleFont(18),
  xl: scaleFont(20),
  xxl: scaleFont(24),
  xxxl: scaleFont(32),
  xxxxl: scaleFont(40),

  // Spacing
  spacing_2: scaleSize(2),
  spacing_4: scaleSize(4),
  spacing_8: scaleSize(8),
  spacing_12: scaleSize(12),
  spacing_16: scaleSize(16),
  spacing_20: scaleSize(20),
  spacing_24: scaleSize(24),
  spacing_32: scaleSize(32),
  spacing_40: scaleSize(40),
  spacing_48: scaleSize(48),

  // Radius (responsive)
  radius_4: scaleSize(4),
  radius_8: scaleSize(8),
  radius_12: scaleSize(12),
  radius_16: scaleSize(16),
  radius_20: scaleSize(20),
  radius_24: scaleSize(24),
  radius_32: scaleSize(32),

  // UI Elements
  inputHeight: 48,
  buttonHeight: 48,

  // Layout
  width_percent_100: "100%",
  height_percent_100: "100%",
};

export const FONTS = {
  regular: {
    fontFamily: Platform.select({
      ios: "-apple-system",
      android: "Roboto",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: "Arial",
    }),
    fontWeight: "400" as const,
  },
  medium: {
    fontFamily: Platform.select({
      ios: "-apple-system",
      android: "Roboto",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: "Arial",
    }),
    fontWeight: "500" as const,
  },
  bold: {
    fontFamily: Platform.select({
      ios: "-apple-system",
      android: "Roboto",
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      default: "Arial",
    }),
    fontWeight: "700" as const,
  },
  calistoga: {
    fontFamily: "Calistoga-Regular",
  },
  darkerGrotesqueRegular: {
    fontFamily: "DarkerGrotesque-Regular",
  },
  darkerGrotesqueMedium: {
    fontFamily: "DarkerGrotesque-Medium",
  },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
