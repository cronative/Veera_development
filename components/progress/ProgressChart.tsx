import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  Easing,
  runOnJS 
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

interface ChartData {
  value: number;
  total: number;
  label: string;
}

interface ProgressChartProps {
  data: ChartData[];
  title?: string;
}

export default function ProgressChart({ data, title }: ProgressChartProps) {
  // Create shared values for each possible bar upfront
  const barHeights = useRef(Array(5).fill(0).map(() => useSharedValue(0))).current;
  
  useEffect(() => {
    // Reset and animate only the bars we need based on data length
    data.forEach((item, index) => {
      if (index < barHeights.length) {
        const percentage = item.total > 0 ? (item.value / item.total) : 0;
        barHeights[index].value = 0;
        
        barHeights[index].value = withDelay(
          index * 100, 
          withTiming(percentage, {
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        );
      }
    });

    // Reset unused bars
    for (let i = data.length; i < barHeights.length; i++) {
      barHeights[i].value = withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [data]);
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
          
          const barStyle = useAnimatedStyle(() => {
            return {
              height: `${barHeights[index].value * 100}%`,
              transformOrigin: 'bottom',
            };
          });
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <Animated.View
                  style={[styles.bar, barStyle]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValue}>{percentage.toFixed(0)}%</Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.pastelGreenDark }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius_12,
    padding: SIZES.spacing_16,
    marginBottom: SIZES.spacing_16,
  },
  title: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    height: 180,
    paddingBottom: SIZES.spacing_8,
  },
  barContainer: {
    alignItems: 'center',
    width: '20%',
  },
  barWrapper: {
    width: 30,
    height: 140,
    backgroundColor: COLORS.divider,
    borderRadius: SIZES.radius_8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: COLORS.pastelGreenDark,
    borderRadius: SIZES.radius_8,
  },
  barLabel: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textDark,
    marginTop: SIZES.spacing_8,
    textAlign: 'center',
  },
  barValue: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.spacing_16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.spacing_16,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: SIZES.spacing_8,
  },
  legendText: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
});