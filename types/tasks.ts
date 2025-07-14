export interface TaskData {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority_level: 'low' | 'medium' | 'high';
  course_id?: string;
  canvas_assignment_id?: string;
  task_status?: {
    status: 'pending' | 'completed';
    completed_at?: string;
  };
}

export interface AssignmentData {
  id: string;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  course_id?: string;
  task_status?: {
    status: 'pending' | 'completed';
    completed_at?: string;
  };
}

export interface AnnouncementData {
  id: string;
  title: string;
  message?: string;
  posted_at: string;
  course_id?: string;
}

export interface TaskRetrievalResult {
  tasks: TaskData[];
  assignments: AssignmentData[];
  announcements: AnnouncementData[];
  totalCount: number;
  cached: boolean;
  timestamp: number;
}

export interface TaskRetrievalError {
  message: string;
  code: 'RATE_LIMIT' | 'DATABASE_ERROR' | 'CLASSIFICATION_ERROR' | 'UNKNOWN';
  details?: any;
}