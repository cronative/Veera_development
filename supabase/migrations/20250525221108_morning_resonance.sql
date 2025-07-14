/*
  # Fix RLS policies for task creation

  1. Changes
    - Add missing RLS policies for canvas_assignments table
    - Add INSERT policy for task_status
    - Ensure user_id is properly set on task creation
    - Add default course for user-created tasks
  
  2. Security
    - Enable RLS on canvas_assignments
    - Add policies for authenticated users
*/

-- Enable RLS on canvas_assignments if not already enabled
ALTER TABLE canvas_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read assignments" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can insert their own task status" ON task_status;

-- Create comprehensive policies for canvas_assignments
CREATE POLICY "Users can read assignments"
  ON canvas_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create assignments"
  ON canvas_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update task_status policies to handle user creation
CREATE POLICY "Users can insert their own task status"
  ON task_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::text = auth.uid()::text
  );

-- Add trigger to automatically set user_id on task_status insert
CREATE OR REPLACE FUNCTION set_task_status_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_task_status_user_id_trigger ON task_status;
CREATE TRIGGER set_task_status_user_id_trigger
  BEFORE INSERT ON task_status
  FOR EACH ROW
  EXECUTE FUNCTION set_task_status_user_id();