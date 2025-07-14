import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Check, Clock, Calendar } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  category?: string;
  priority: 'low' | 'medium' | 'high';
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onPress: (task: Task) => void;
  isUpdating?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TaskItem({ task, onToggleComplete, onPress, isUpdating }: TaskItemProps) {
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const itemScale = useSharedValue(1);
  const textOpacity = useSharedValue(task.completed ? 0.6 : 1);
  const shake = useSharedValue(0);
  
  const handleToggleComplete = async () => {
    if (isUpdating) return;

    const newCompletedState = !task.completed;
    
    // Animate checkbox
    checkScale.value = withSpring(newCompletedState ? 1 : 0, {
      damping: 10,
      stiffness: 100,
    });
    
    // Animate text opacity
    textOpacity.value = withTiming(newCompletedState ? 0.6 : 1, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    try {
      await onToggleComplete(task.id);
    } catch (error) {
      // Error animation
      shake.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 100 }),
        withTiming(0, { duration: 50 })
      );
      
      // Revert animations
      checkScale.value = withSpring(task.completed ? 1 : 0);
      textOpacity.value = withTiming(task.completed ? 0.6 : 1);
    }
  };
  
  const handlePress = () => {
    itemScale.value = withSpring(0.97, {
      damping: 10, 
      stiffness: 200
    });
    
    setTimeout(() => {
      itemScale.value = withSpring(1, {
        damping: 10, 
        stiffness: 200
      });
      onPress(task);
    }, 100);
  };
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.pastelBlue;
      default:
        return COLORS.pastelBlue;
    }
  };
  
  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString() 
    : '';
  
  const checkboxAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        checkScale.value,
        [0, 1],
        ['transparent', COLORS.pastelGreenDark]
      ),
      borderColor: interpolateColor(
        checkScale.value,
        [0, 1],
        [COLORS.textMedium, COLORS.pastelGreenDark]
      ),
      transform: [{ scale: 1 }],
    };
  });
  
  const checkIconAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: checkScale.value,
      transform: [{ scale: checkScale.value }],
    };
  });
  
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: itemScale.value },
        { translateX: shake.value }
      ],
    };
  });
  
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isUpdating}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleToggleComplete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={isUpdating}
        >
          <Animated.View style={[styles.checkbox, checkboxAnimatedStyle]}>
            <Animated.View style={checkIconAnimatedStyle}>
              <Check size={14} color={COLORS.white} />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
        
        <View style={styles.textContainer}>
          <Animated.Text 
            style={[
              styles.title, 
              textAnimatedStyle,
              task.completed && styles.completedText
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Animated.Text>
          
          {task.description && (
            <Animated.Text 
              style={[styles.description, textAnimatedStyle]}
              numberOfLines={2}
            >
              {task.description}
            </Animated.Text>
          )}
          
          <View style={styles.metaContainer}>
            {task.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>
                  {task.category}
                </Text>
              </View>
            )}
            
            {task.dueDate && (
              <View style={styles.dateContainer}>
                <Calendar size={12} color={COLORS.textMedium} />
                <Text style={styles.date}>{formattedDate}</Text>
              </View>
            )}
            
            <View style={[
              styles.priorityIndicator, 
              { backgroundColor: getPriorityColor() }
            ]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius_12,
    marginBottom: SIZES.spacing_12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: SIZES.spacing_16,
  },
  checkboxContainer: {
    marginRight: SIZES.spacing_12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  description: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
    marginBottom: SIZES.spacing_8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryContainer: {
    backgroundColor: COLORS.pastelGreen,
    paddingHorizontal: SIZES.spacing_8,
    paddingVertical: 2,
    borderRadius: SIZES.radius_8,
    marginRight: SIZES.spacing_8,
  },
  category: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textDark,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.spacing_8,
  },
  date: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.textMedium,
    marginLeft: 4,
  },
  priorityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});