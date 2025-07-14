/*
  # Assignment and Task Status Optimization

  1. Changes
    - Add NOT NULL constraints
    - Create additional indexes
    - Update foreign key constraints
    
  2. Improvements
    - Better query performance
    - Data integrity
    - Proper relationship enforcement
*/

-- Ensure proper constraints on canvas_assignments
ALTER TABLE canvas_assignments
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN name SET NOT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_canvas_assignments_name 
  ON canvas_assignments(name);

-- Ensure proper constraints on task_status
ALTER TABLE task_status
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN assignment_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN priority SET DEFAULT 'medium';

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_task_status_user_assignment_status
  ON task_status(user_id, assignment_id, status);

-- Ensure foreign key constraint with proper deletion behavior
ALTER TABLE task_status
  DROP CONSTRAINT IF EXISTS task_status_assignment_id_fkey,
  ADD CONSTRAINT task_status_assignment_id_fkey
    FOREIGN KEY (assignment_id)
    REFERENCES canvas_assignments(id)
    ON DELETE CASCADE;