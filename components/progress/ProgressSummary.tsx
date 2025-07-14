import { StyleSheet, View, Text } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { CircleCheck as CheckCircle } from 'lucide-react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressSummaryProps {
  completed: number;
  total: number;
  title: string;
}

export default function ProgressSummary({ completed, total, title }: ProgressSummaryProps) {
  const progress = useSharedValue(0);
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  useEffect(() => {
    const percentage = total > 0 ? completed / total : 0;
    progress.value = 0;
    
    progress.value = withTiming(percentage, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [completed, total]);
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * progress.value);
    
    return {
      strokeDashoffset,
    };
  });
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.progressContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.divider}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.pastelGreenDark}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        
        <View style={styles.percentageContainer}>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
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
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
  },
  title: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_16,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.spacing_8,
  },
  percentageContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SIZES.spacing_16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
  },
  statLabel: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
  },
});