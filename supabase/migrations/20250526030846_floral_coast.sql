/*
  # Database Schema Fixes

  1. Changes
    - Standardize ID generation using UUIDs
    - Add missing constraints and defaults
    - Optimize indexes for common queries
    - Fix foreign key relationships
    - Clean up redundant fields
    
  2. Security
    - Maintain RLS policies
    - Add proper constraints
*/

-- Standardize canvas_assignments
ALTER TABLE canvas_assignments
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

-- Clean up task_status
ALTER TABLE task_status
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN assignment_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN priority SET DEFAULT 'medium',
  ALTER COLUMN completed_at DROP NOT NULL;

-- Add proper constraints
ALTER TABLE task_status
  DROP CONSTRAINT IF EXISTS task_status_status_check,
  ADD CONSTRAINT task_status_status_check 
    CHECK (status IN ('pending', 'completed')),
  DROP CONSTRAINT IF EXISTS task_status_priority_check,
  ADD CONSTRAINT task_status_priority_check 
    CHECK (priority IN ('low', 'medium', 'high'));

-- Optimize indexes
DROP INDEX IF EXISTS idx_task_status_user_id;
DROP INDEX IF EXISTS idx_task_status_assignment_id;
CREATE INDEX IF NOT EXISTS idx_task_status_composite 
  ON task_status(user_id, assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_task_status_priority_status 
  ON task_status(priority, status);

-- Fix foreign key relationships
ALTER TABLE task_status
  DROP CONSTRAINT IF EXISTS task_status_assignment_id_fkey,
  ADD CONSTRAINT task_status_assignment_id_fkey
    FOREIGN KEY (assignment_id)
    REFERENCES canvas_assignments(id)
    ON DELETE CASCADE;

-- Update task creation trigger
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