import { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    dueDate?: Date;
    priorityLevel: 'low' | 'medium' | 'high';
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priorityLevel?: 'low' | 'medium' | 'high';
  };
}

export default function TaskForm({ onSubmit, onCancel, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(initialData?.dueDate);
  const [priorityLevel, setPriorityLevel] = useState<'low' | 'medium' | 'high'>(
    initialData?.priorityLevel || 'medium'
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    dueDate?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (dueDate && dueDate < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        priorityLevel
      });
      
      // Reset form on success
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setPriorityLevel('medium');
      setErrors({});
      
      Alert.alert('Success', 'Task created successfully!');
    } catch (error) {
      console.error('[TaskForm] Error submitting task:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to create task'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
      // Clear date error if a valid date is selected
      if (errors.dueDate && selectedDate >= new Date()) {
        setErrors(prev => ({ ...prev, dueDate: undefined }));
      }
    }
  };

  const clearDueDate = () => {
    setDueDate(undefined);
    setErrors(prev => ({ ...prev, dueDate: undefined }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Task</Text>
        <Text style={styles.headerSubtitle}>
          Add a personal task with foreign key relationships
        </Text>
      </View>

      <Input
        label="Task Title *"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (errors.title && text.trim().length >= 3) {
            setErrors(prev => ({ ...prev, title: undefined }));
          }
        }}
        placeholder="Enter task title"
        error={errors.title}
        maxLength={100}
      />

      <Input
        label="Description (Optional)"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          if (errors.description && text.length <= 500) {
            setErrors(prev => ({ ...prev, description: undefined }));
          }
        }}
        placeholder="Enter task description"
        multiline
        numberOfLines={3}
        error={errors.description}
        maxLength={500}
      />

      <View style={styles.dateContainer}>
        <Text style={styles.label}>Due Date (Optional)</Text>
        <View style={styles.dateRow}>
          <Button
            title={dueDate ? dueDate.toLocaleDateString() : "Select Due Date"}
            onPress={() => setShowDatePicker(true)}
            variant="outline"
            style={styles.dateButton}
          />
          {dueDate && (
            <Button
              title="Clear"
              onPress={clearDueDate}
              variant="text"
              style={styles.clearButton}
            />
          )}
        </View>
        {errors.dueDate && (
          <Text style={styles.errorText}>{errors.dueDate}</Text>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.priorityContainer}>
        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.priorityButtons}>
          {(['low', 'medium', 'high'] as const).map((level) => (
            <Button
              key={level}
              title={level.charAt(0).toUpperCase() + level.slice(1)}
              onPress={() => setPriorityLevel(level)}
              variant={priorityLevel === level ? 'primary' : 'outline'}
              style={styles.priorityButton}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.actionButton}
          disabled={isSubmitting}
        />
        <Button
          title={isSubmitting ? "Creating..." : "Create Task"}
          onPress={handleSubmit}
          style={styles.actionButton}
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.spacing_16,
  },
  header: {
    marginBottom: SIZES.spacing_24,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_4,
  },
  headerSubtitle: {
    ...FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.textMedium,
  },
  label: {
    ...FONTS.medium,
    fontSize: SIZES.sm,
    color: COLORS.textDark,
    marginBottom: SIZES.spacing_8,
  },
  dateContainer: {
    marginBottom: SIZES.spacing_16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    marginRight: SIZES.spacing_8,
  },
  clearButton: {
    minWidth: 60,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: SIZES.xs,
    color: COLORS.error,
    marginTop: SIZES.spacing_4,
  },
  priorityContainer: {
    marginBottom: SIZES.spacing_24,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.spacing_8,
  },
  priorityButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.spacing_12,
    marginTop: SIZES.spacing_24,
  },
  actionButton: {
    minWidth: 120,
  },
});