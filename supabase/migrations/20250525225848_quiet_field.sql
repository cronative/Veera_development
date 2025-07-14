/*
  # Temporary Public Access for Task Management
  
  1. Changes
    - Add temporary public access policies for development
    - Ensure proper column constraints and defaults
    - Add indexes for performance
  
  2. Security Notes
    - These policies are FOR DEVELOPMENT ONLY
    - Must be replaced with proper authentication before production
*/

-- Temporarily disable RLS for development
ALTER TABLE task_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_assignments DISABLE ROW LEVEL SECURITY;

-- Add status constraints if not exists
DO $$ 
BEGIN
  ALTER TABLE task_status 
    ADD CONSTRAINT task_status_status_check 
    CHECK (status IN ('pending', 'completed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add default values for priority if not exists
ALTER TABLE task_status 
  ALTER COLUMN priority SET DEFAULT 'medium';

-- Create composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_task_status_user_assignment 
ON task_status(user_id, assignment_id);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_task_status_status 
ON task_status(status);

-- Add function to handle task creation
CREATE OR REPLACE FUNCTION create_task_with_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_status (
    assignment_id,
    user_id,
    status,
    priority,
    category
  ) VALUES (
    NEW.id,
    COALESCE(auth.uid()::text, 'public'),
    'pending',
    'medium',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic task status creation
DROP TRIGGER IF EXISTS create_task_status_trigger ON canvas_assignments;
CREATE TRIGGER create_task_status_trigger
  AFTER INSERT ON canvas_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_task_with_status();