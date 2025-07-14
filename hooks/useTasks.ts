import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { taskDataService } from '@/utils/taskDataService';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priorityLevel: 'low' | 'medium' | 'high';
  courseId?: string;
  canvasAssignmentId?: string;
  status: 'pending' | 'completed';
  completedAt?: Date;
  userId: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const session = useSession();

  const fetchTasks = async () => {
    if (!session?.user?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useTasks] Fetching tasks with FK relationships for user:', session.user.id);
      
      // Use the enhanced task data service with foreign key relationships
      const taskData = await taskDataService.fetchTaskData(session.user.id);
      
      // Convert to the format expected by the hook
      const allTasks: Task[] = [
        // Convert user tasks
        ...taskData.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          priorityLevel: task.priority_level,
          courseId: task.course_id,
          canvasAssignmentId: task.canvas_assignment_id,
          status: task.task_status?.status || 'pending',
          completedAt: task.task_status?.completed_at ? 
            new Date(task.task_status.completed_at) : undefined,
          userId: session.user.id,
        })),
        // Convert assignments to tasks
        ...taskData.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.name,
          description: assignment.description,
          dueDate: assignment.due_at ? new Date(assignment.due_at) : undefined,
          priorityLevel: 'high' as const, // Canvas assignments default to high priority
          courseId: assignment.course_id,
          canvasAssignmentId: assignment.id,
          status: assignment.task_status?.status || 'pending',
          completedAt: assignment.task_status?.completed_at ? 
            new Date(assignment.task_status.completed_at) : undefined,
          userId: session.user.id,
        }))
      ];

      setTasks(allTasks);
      console.log('[useTasks] Tasks loaded with FK relationships:', {
        totalTasks: allTasks.length,
        userTasks: taskData.tasks.length,
        assignments: taskData.assignments.length,
        userId: session.user.id
      });
    } catch (err) {
      console.error('[useTasks] Error fetching tasks with FK relationships:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    if (!session?.user?.id) return;

    try {
      setUpdating(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';

      // Optimistically update the UI
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date() : undefined,
              }
            : t
        )
      );

      // Update via the task data service with FK validation
      if (task.canvasAssignmentId && task.canvasAssignmentId !== task.id) {
        // This is a Canvas assignment
        await taskDataService.updateAssignmentStatus(task.canvasAssignmentId, newStatus);
      } else {
        // This is a user-created task
        await taskDataService.updateTaskStatus(taskId, newStatus);
      }

      console.log('[useTasks] Task status updated with FK validation:', { 
        taskId, 
        newStatus,
        userId: session.user.id 
      });

    } catch (err) {
      console.error('[useTasks] Error toggling task status:', err);
      
      // Revert optimistic update on error
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  status: task.status,
                  completedAt: task.completedAt,
                }
              : t
          )
        );
      }
      throw err;
    } finally {
      setUpdating(null);
    }
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: Date;
    priorityLevel: 'low' | 'medium' | 'high';
  }) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[useTasks] Creating new task with FK relationship:', taskData.title);
      
      const newTask = await taskDataService.createTask(taskData);
      
      // Refresh tasks to get the latest data with FK relationships
      await fetchTasks();
      
      console.log('[useTasks] Task created with FK relationship:', {
        taskId: newTask.id,
        userId: session.user.id
      });
      return newTask;
    } catch (err) {
      console.error('[useTasks] Error creating task:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[useTasks] Deleting task with CASCADE:', taskId);
      
      // Optimistically remove from UI
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      await taskDataService.deleteTask(taskId);
      
      console.log('[useTasks] Task deleted with CASCADE:', {
        taskId,
        userId: session.user.id
      });
    } catch (err) {
      console.error('[useTasks] Error deleting task:', err);
      // Refresh tasks to restore UI state on error
      await fetchTasks();
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [session?.user?.id]);

  return {
    tasks,
    loading,
    error,
    updating,
    createTask,
    toggleTaskStatus,
    deleteTask,
    refreshTasks: fetchTasks
  };
}