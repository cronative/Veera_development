export interface CanvasCourse {
  id: string;
  name: string;
  course_code: string;
  start_at: string | null;
  end_at: string | null;
  calendar_feed_url: string;
}

export interface CanvasAssignment {
  id: string;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number;
  submission_types: string[];
  published: boolean;
  course_id: string;
  grading_type: string;
  allowed_attempts: number;
  turnitin_enabled: boolean;
  peer_reviews: boolean;
  automatic_peer_reviews: boolean;
  notify_of_update: boolean;
}

export interface CanvasAnnouncement {
  id: string;
  title: string;
  message: string;
  posted_at: string;
  user_id: string;
  course_id: string;
  published: boolean;
  subscribed: boolean;
  discussion_type: string;
}

export interface SyncStatus {
  id: string;
  course_id: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  started_at: string;
  completed_at?: string;
  last_error?: string;
}