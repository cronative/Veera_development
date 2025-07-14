/*
  # Add task fields and update policies

  1. New Fields
    - Add priority and category columns to task_status table
    - Add default values and constraints

  2. Security Updates
    - Add INSERT policy for task_status
    - Add INSERT policy for canvas_assignments
    - Update existing policies

  3. Changes
    - Modify task_status table to include priority and category
    - Add necessary indexes for performance
*/

-- Add new columns to task_status if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_status' AND column_name = 'priority') 
  THEN
    ALTER TABLE task_status 
    ADD COLUMN priority text DEFAULT 'medium'::text 
    CHECK (priority IN ('low', 'medium', 'high'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_status' AND column_name = 'category') 
  THEN
    ALTER TABLE task_status 
    ADD COLUMN category text;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can create assignments" ON canvas_assignments;

-- Create new policies for task creation
CREATE POLICY "Users can insert their own task status"
  ON task_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create assignments"
  ON canvas_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for priority field
CREATE INDEX IF NOT EXISTS idx_task_status_priority 
ON task_status(priority);

-- Create index for category field
CREATE INDEX IF NOT EXISTS idx_task_status_category 
ON task_status(category);