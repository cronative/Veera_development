import { supabase } from './supabase';
import { TaskData, AssignmentData, AnnouncementData, TaskRetrievalResult, TaskRetrievalError } from '@/types/tasks';

/**
 * Enhanced task data service with proper foreign key relationships
 * All operations are user-specific using UUID foreign keys
 */
export class TaskDataService {
  private static instance: TaskDataService;
  private rateLimit = 10; // requests per minute
  private requestCount = 0;
  private lastResetTime = Date.now();

  static getInstance(): TaskDataService {
    if (!TaskDataService.instance) {
      TaskDataService.instance = new TaskDataService();
    }
    return TaskDataService.instance;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.requestCount >= this.rateLimit) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requestCount++;
  }

  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Fetch all task-related data using foreign key relationships
   */
  async fetchTaskData(userId?: string): Promise<TaskRetrievalResult> {
    console.log('[TaskDataService] Starting user-specific data fetch with FK relationships...');
    
    try {
      await this.checkRateLimit();
      
      // Get current user if not provided
      const user = userId ? { id: userId } : await this.getCurrentUser();
      const userUuid = user.id;
      
      const now = new Date();
      const nowISO = now.toISOString();
      
      console.log('[TaskDataService] Fetching data for user UUID:', userUuid);
      
      // Fetch user's tasks with their status using JOIN
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_status!left (
            status,
            completed_at
          )
        `)
        .eq('user_id', userUuid)
        .order('priority_level', { ascending: false })
        .order('due_date', { ascending: true })
        .limit(20);

      if (tasksError) {
        console.error('[TaskDataService] Tasks fetch error:', tasksError);
        throw tasksError;
      }

      // Fetch user's assignments with their status using JOIN
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('canvas_assignments')
        .select(`
          *,
          task_status!left (
            status,
            completed_at
          )
        `)
        .eq('user_id', userUuid)
        .gte('due_at', nowISO)
        .order('due_at', { ascending: true })
        .limit(20);

      if (assignmentsError) {
        console.error('[TaskDataService] Assignments fetch error:', assignmentsError);
        throw assignmentsError;
      }

      // Fetch user's announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('canvas_announcements')
        .select('*')
        .eq('user_id', userUuid)
        .order('posted_at', { ascending: false })
        .limit(10);

      if (announcementsError) {
        console.error('[TaskDataService] Announcements fetch error:', announcementsError);
        throw announcementsError;
      }

      // Process tasks with status
      const tasksWithStatus: TaskData[] = (tasksData || []).map(task => ({
        ...task,
        task_status: task.task_status?.[0] || undefined
      }));

      // Process assignments with status
      const assignmentsWithStatus: AssignmentData[] = (assignmentsData || []).map(assignment => ({
        ...assignment,
        task_status: assignment.task_status?.[0] || undefined
      }));

      // Filter for incomplete items
      const incompleteTasks = tasksWithStatus.filter(task => {
        if (!task.due_date) return true;
        const dueDate = new Date(task.due_date);
        const isIncomplete = !task.task_status || task.task_status.status !== 'completed';
        return dueDate > now && isIncomplete;
      });

      const incompleteAssignments = assignmentsWithStatus.filter(assignment => {
        const isIncomplete = !assignment.task_status || assignment.task_status.status !== 'completed';
        return isIncomplete;
      });

      const result: TaskRetrievalResult = {
        tasks: incompleteTasks,
        assignments: incompleteAssignments,
        announcements: announcementsData || [],
        totalCount: incompleteTasks.length + incompleteAssignments.length,
        cached: false,
        timestamp: Date.now()
      };

      console.log('[TaskDataService] User-specific data fetch completed:', {
        userUuid,
        tasks: result.tasks.length,
        assignments: result.assignments.length,
        announcements: result.announcements.length,
        totalCount: result.totalCount
      });

      return result;
    } catch (error) {
      console.error('[TaskDataService] Fetch error:', error);
      throw error;
    }
  }

  /**
   * Create a new task with proper foreign key relationship
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    dueDate?: Date;
    priorityLevel: 'low' | 'medium' | 'high';
    courseId?: string;
  }): Promise<TaskData> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.dueDate?.toISOString(),
          priority_level: taskData.priorityLevel,
          course_id: taskData.courseId,
          user_id: user.id // UUID foreign key
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('[TaskDataService] Task created with FK relationship:', {
        taskId: data.id,
        userId: user.id
      });
      
      return data;
    } catch (error) {
      console.error('[TaskDataService] Error creating task:', error);
      throw error;
    }
  }

  /**
   * Create assignment with proper foreign key relationship
   */
  async createAssignment(assignmentData: {
    name: string;
    description?: string;
    dueAt?: Date;
    pointsPossible?: number;
    courseId?: string;
  }): Promise<AssignmentData> {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('canvas_assignments')
        .insert({
          name: assignmentData.name,
          description: assignmentData.description,
          due_at: assignmentData.dueAt?.toISOString(),
          points_possible: assignmentData.pointsPossible || 0,
          course_id: assignmentData.courseId,
          user_id: user.id, // UUID foreign key
          submission_types: ['online_text_entry'],
          published: true,
          grading_type: 'points',
          allowed_attempts: 1,
          turnitin_enabled: false,
          peer_reviews: false,
          automatic_peer_reviews: false,
          notify_of_update: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('[TaskDataService] Assignment created with FK relationship:', {
        assignmentId: data.id,
        userId: user.id
      });
      
      return data;
    } catch (error) {
      console.error('[TaskDataService] Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Update task status using foreign key relationships
   */
  async updateTaskStatus(taskId: string, status: 'pending' | 'completed'): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      // Verify task belongs to user using FK relationship
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (taskError || !task) {
        throw new Error('Task not found or access denied');
      }

      const { error } = await supabase
        .from('task_status')
        .upsert({
          task_id: taskId,
          user_id: user.id, // Include user_id for RLS
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        });

      if (error) {
        throw error;
      }

      console.log('[TaskDataService] Task status updated with FK validation:', {
        taskId,
        userId: user.id,
        status
      });
    } catch (error) {
      console.error('[TaskDataService] Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Update assignment status using foreign key relationships
   */
  async updateAssignmentStatus(assignmentId: string, status: 'pending' | 'completed'): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      // Verify assignment belongs to user using FK relationship
      const { data: assignment, error: assignmentError } = await supabase
        .from('canvas_assignments')
        .select('id')
        .eq('id', assignmentId)
        .eq('user_id', user.id)
        .single();

      if (assignmentError || !assignment) {
        throw new Error('Assignment not found or access denied');
      }

      const { error } = await supabase
        .from('task_status')
        .upsert({
          assignment_id: assignmentId,
          user_id: user.id, // Include user_id for RLS
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        });

      if (error) {
        throw error;
      }

      console.log('[TaskDataService] Assignment status updated with FK validation:', {
        assignmentId,
        userId: user.id,
        status
      });
    } catch (error) {
      console.error('[TaskDataService] Error updating assignment status:', error);
      throw error;
    }
  }

  /**
   * Get user's tasks with status using JOIN queries
   */
  async getUserTasks(userId?: string): Promise<TaskData[]> {
    try {
      const user = userId ? { id: userId } : await this.getCurrentUser();

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_status!left (
            status,
            completed_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(task => ({
        ...task,
        task_status: task.task_status?.[0] || undefined
      }));
    } catch (error) {
      console.error('[TaskDataService] Error fetching user tasks:', error);
      throw error;
    }
  }

  /**
   * Get user's assignments with status using JOIN queries
   */
  async getUserAssignments(userId?: string): Promise<AssignmentData[]> {
    try {
      const user = userId ? { id: userId } : await this.getCurrentUser();

      const { data, error } = await supabase
        .from('canvas_assignments')
        .select(`
          *,
          task_status!left (
            status,
            completed_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(assignment => ({
        ...assignment,
        task_status: assignment.task_status?.[0] || undefined
      }));
    } catch (error) {
      console.error('[TaskDataService] Error fetching user assignments:', error);
      throw error;
    }
  }

  /**
   * Delete task with cascade handling
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      // Verify ownership using FK relationship
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (taskError || !task) {
        throw new Error('Task not found or access denied');
      }

      // Delete task (task_status will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      console.log('[TaskDataService] Task deleted with CASCADE:', {
        taskId,
        userId: user.id
      });
    } catch (error) {
      console.error('[TaskDataService] Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Format task data for AI prompt context
   */
  formatTasksForPrompt(data: TaskRetrievalResult): string {
    if (data.totalCount === 0) {
      return "No pending tasks or assignments found.";
    }

    const allItems = [
      ...data.tasks.map(task => ({
        title: task.title,
        courseName: 'Personal Task',
        dueDate: task.due_date,
        priority: task.priority_level,
        description: task.description,
        type: 'task'
      })),
      ...data.assignments.map(assignment => ({
        title: assignment.name,
        courseName: 'Course Assignment',
        dueDate: assignment.due_at,
        priority: 'high',
        description: assignment.description,
        type: 'assignment'
      }))
    ].sort((a, b) => {
      // Sort by due date, null dates go last
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return allItems.map(item => `
      ${item.type === 'assignment' ? 'Assignment' : 'Task'}: ${item.title}
      Course: ${item.courseName}
      Priority: ${item.priority}
      Due Date: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
      ${item.description ? `Description: ${item.description}` : ''}
    `).join('\n');
  }
}

// Export singleton instance
export const taskDataService = TaskDataService.getInstance();