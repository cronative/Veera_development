import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Card from '@/components/ui/Card';
import { CircleCheck as CheckCircle, Clock, Award } from 'lucide-react-native';
import { Task } from '@/components/tasks/TaskItem';

interface ProgressStats {
  completed: number;
  total: number;
  streak: number;
  mostProductiveDay: string;
  mostProductiveTime: string;
}

export default function ProgressScreen() {
  const [stats, setStats] = useState<ProgressStats>({
    completed: 0,
    total: 0,
    streak: 0,
    mostProductiveDay: 'Monday',
    mostProductiveTime: 'Morning',
  });

  // Calculate progress stats from tasks
  const calculateStats = useCallback((tasks: Task[]) => {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    
    // For demo purposes, we'll use static data
    // In a real app, these would be calculated from actual task completion data
    setStats({
      completed,
      total,
      streak: 5,
      mostProductiveDay: 'Monday',
      mostProductiveTime: 'Morning',
    });
  }, []);

  // Simulate fetching tasks and calculating stats
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Complete Math Assignment',
        completed: true,
        priority: 'high',
      },
      {
        id: '2',
        title: 'Read History Chapter',
        completed: false,
        priority: 'medium',
      },
      {
        id: '3',
        title: 'Study Group Meeting',
        completed: true,
        priority: 'medium',
      },
    ];

    calculateStats(mockTasks);
  }, [calculateStats]);

  const progressPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Track your achievements</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Card style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Productivity Insights</Text>
          
          <View style={styles.insightItem}>
            <View style={styles.insightBadge}>
              <CheckCircle size={16} color={COLORS.textDark} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightHeading}>Most Productive Day</Text>
              <Text style={styles.insightValue}>{stats.mostProductiveDay}</Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightBadge}>
              <Clock size={16} color={COLORS.textDark} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightHeading}>Most Productive Time</Text>
              <Text style={styles.insightValue}>{stats.mostProductiveTime}</Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightBadge}>
              <Award size={16} color={COLORS.textDark} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightHeading}>Current Streak</Text>
              <Text style={styles.insightValue}>{stats.streak} days</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.pastelYellow,
    paddingTop: SIZES.spacing_48,
    paddingBottom: SIZES.spacing_16,
    paddingHorizontal: SIZES.spacing_20,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.spacing_16,
  },
  progressCard: {
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.pastelGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
  },
  progressPercentage: {
    ...FONTS.bold,
    fontSize: SIZES.xxl,
    color: COLORS.textDark,
  },
  progressLabel: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SIZES.spacing_8,
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
    height: '100%',
    backgroundColor: COLORS.divider,
  },
  insightsCard: {
    marginBottom: SIZES.spacing_16,
  },
  insightsTitle: {
    ...FONTS.medium,
    fontSize: SIZES.lg,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
  },
  insightBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pastelGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing_12,
  },
  insightContent: {
    flex: 1,
  },
  insightHeading: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  insightValue: {
    ...FONTS.bold,
    fontSize: SIZES.md,
    color: COLORS.textDark,
    marginTop: 2,
  },
});