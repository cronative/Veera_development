/*
  # Task Status and User Courses Schema

  1. New Tables
    - `user_courses`
      - Links users to their enrolled courses
      - Tracks enrollment status and access times
    - `task_status`
      - Tracks assignment completion status
      - Records completion dates and feedback
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read their own course enrollments
      - Read and update their own task status
  
  3. Indexes
    - Add indexes for user_id and assignment_id for better query performance
*/

-- Check if tables don't exist before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_courses') THEN
    CREATE TABLE user_courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      course_id uuid NOT NULL REFERENCES canvas_courses(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'active',
      enrolled_at timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      UNIQUE(user_id, course_id)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'task_status') THEN
    CREATE TABLE task_status (
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
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own course enrollments" ON user_courses;
DROP POLICY IF EXISTS "Users can read their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can update their own task status" ON task_status;

-- Create new policies
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_user_id ON task_status(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_assignment_id ON task_status(assignment_id);

-- Create or replace function and trigger for updating timestamp
CREATE OR REPLACE FUNCTION update_task_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_task_status_timestamp ON task_status;
CREATE TRIGGER update_task_status_timestamp
  BEFORE UPDATE ON task_status
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status_timestamp();