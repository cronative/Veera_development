// utils/responsive.ts
import { Dimensions, PixelRatio } from "react-native";

const { width } = Dimensions.get("window");

// Base screen width (used for scaling) — e.g., iPhone 11
const guidelineBaseWidth = 375;

export const scaleFont = (size: number) => {
  const scale = width / guidelineBaseWidth;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const scaleSize = (size: number) => {
  const scale = width / guidelineBaseWidth;
  return Math.round(size * scale); // spacing doesn't need PixelRatio
};
