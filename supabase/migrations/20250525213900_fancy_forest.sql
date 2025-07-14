/*
  # Task Management System Tables
  
  1. New Tables
    - user_courses: Tracks user enrollment in courses
    - task_status: Tracks assignment completion status
  
  2. Security
    - RLS enabled on both tables
    - Policies for user-specific access
    
  3. Features
    - Automatic timestamp updates
    - Indexes for performance
    - Cascading deletes
*/

-- Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  course_id uuid NOT NULL REFERENCES canvas_courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create task_status table
CREATE TABLE IF NOT EXISTS task_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  assignment_id uuid NOT NULL REFERENCES canvas_assignments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, assignment_id)
);

-- Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status ENABLE ROW LEVEL SECURITY;

-- Create policies with proper type casting
CREATE POLICY "Users can read their own course enrollments"
  ON user_courses
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can read their own task status"
  ON task_status
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own task status"
  ON task_status
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_user_id ON task_status(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_assignment_id ON task_status(assignment_id);

-- Create function to update task status
CREATE OR REPLACE FUNCTION update_task_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_task_status_timestamp
  BEFORE UPDATE ON task_status
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status_timestamp();