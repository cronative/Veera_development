import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { useTasks } from '@/hooks/useTasks';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { RefreshCw, Plus } from 'lucide-react-native';

export default function TasksScreen() {
  const { tasks, loading, error, updating, toggleTaskStatus, createTask, refreshTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { pendingTasks, completedTasks } = useMemo(() => {
    const taskArray = tasks || [];
    return {
      pendingTasks: taskArray.filter(task => task.status === 'pending'),
      completedTasks: taskArray.filter(task => task.status === 'completed')
    };
  }, [tasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTasks();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await toggleTaskStatus(taskId);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: Date;
    priorityLevel: 'low' | 'medium' | 'high';
  }) => {
    try {
      await createTask(taskData);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (showForm) {
    return (
      <TaskForm
        onSubmit={handleCreateTask}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Card style={styles.messageCard}>
          <Text style={styles.messageText}>Loading tasks...</Text>
        </Card>
      );
    }

    if (error) {
      return (
        <Card style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Try Again"
            onPress={refreshTasks}
            variant="outline"
            style={styles.retryButton}
          />
        </Card>
      );
    }

    const currentTasks = activeTab === 'pending' ? pendingTasks : completedTasks;

    return (
      <FlatList
        data={currentTasks}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggleComplete={() => handleToggleComplete(item.id)}
            onPress={() => {}} // Implement task details view
            isUpdating={updating === item.id}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>
              {activeTab === 'pending'
                ? 'No pending tasks. Great job!'
                : 'No completed tasks yet.'}
            </Text>
          </Card>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerSubtitle}>Manage your assignments</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsContainer}>
          <Button
            title="New Task"
            onPress={() => setShowForm(true)}
            icon={<Plus size={20} color={COLORS.white} />}
            style={styles.newTaskButton}
          />

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw
              size={20}
              color={COLORS.textMedium}
              style={isRefreshing ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText
            ]}>
              Pending ({pendingTasks?.length ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText
            ]}>
              Completed ({completedTasks?.length ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>
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
    padding: SIZES.spacing_16,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing_16,
  },
  newTaskButton: {
    flex: 1,
    marginRight: SIZES.spacing_12,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius_12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing_16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius_20,
    padding: SIZES.spacing_4,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.spacing_12,
    alignItems: 'center',
    borderRadius: SIZES.radius_16,
  },
  activeTab: {
    backgroundColor: COLORS.pastelGreen,
  },
  tabText: {
    ...FONTS.medium,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
  },
  activeTabText: {
    color: COLORS.textDark,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  taskList: {
    paddingTop: SIZES.spacing_8,
  },
  messageCard: {
    alignItems: 'center',
    padding: SIZES.spacing_24,
  },
  messageText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.spacing_16,
  },
  retryButton: {
    minWidth: 120,
  },
});