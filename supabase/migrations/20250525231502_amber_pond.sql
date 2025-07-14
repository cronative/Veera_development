/*
  # Task Management Schema Updates
  
  1. Changes
    - Add NOT NULL constraint to canvas_assignments.name
    - Add indexes for improved query performance
    - Add constraints and defaults for task_status
    - Temporarily disable RLS for development
    - Update task creation trigger
  
  2. Security
    - Temporarily disables RLS for development purposes
    - Will need to be re-enabled before production
*/

-- Ensure canvas_assignments has proper constraints
ALTER TABLE canvas_assignments
  ALTER COLUMN name SET NOT NULL;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_canvas_assignments_course_id 
  ON canvas_assignments(course_id);

-- Ensure task_status has proper constraints
ALTER TABLE task_status
  ALTER COLUMN assignment_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN priority SET DEFAULT 'medium';

-- Add constraint for valid status values if not exists
DO $$ 
BEGIN
  ALTER TABLE task_status 
    ADD CONSTRAINT task_status_status_check 
    CHECK (status IN ('pending', 'completed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add constraint for valid priority values if not exists
DO $$ 
BEGIN
  ALTER TABLE task_status 
    ADD CONSTRAINT task_status_priority_check 
    CHECK (priority IN ('low', 'medium', 'high'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Temporarily disable RLS for development
ALTER TABLE canvas_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_status DISABLE ROW LEVEL SECURITY;

-- Update or create the task creation trigger
CREATE OR REPLACE FUNCTION create_task_with_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_status (
    assignment_id,
    user_id,
    status,
    priority
  ) VALUES (
    NEW.id,
    COALESCE(auth.uid()::text, 'public'),
    'pending',
    'medium'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS create_task_status_trigger ON canvas_assignments;
CREATE TRIGGER create_task_status_trigger
  AFTER INSERT ON canvas_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_task_with_status();