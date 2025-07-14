import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
  elevation?: 'none' | 'low' | 'medium' | 'high';
}

export default function Card({ 
  children, 
  style, 
  transparent = false,
  elevation = 'medium' 
}: CardProps) {
  const getElevationStyle = () => {
    switch (elevation) {
      case 'none':
        return {};
      case 'low':
        return styles.elevationLow;
      case 'medium':
        return styles.elevationMedium;
      case 'high':
        return styles.elevationHigh;
    }
  };

  return (
    <View 
      style={[
        styles.card, 
        transparent ? styles.transparent : null,
        getElevationStyle(),
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius_12,
    padding: SIZES.spacing_16,
    marginBottom: SIZES.spacing_16,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  elevationLow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  elevationMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevationHigh: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});