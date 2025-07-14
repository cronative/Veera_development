/*
  # Add Foreign Key Relationships for User-Specific Data

  1. Foreign Key Constraints
    - Link user_id columns to auth.users table
    - Link task_id in task_status to tasks table
    - Add proper CASCADE behaviors for data integrity

  2. Data Integrity
    - Ensure all user_id references are valid
    - Clean up orphaned records before adding constraints
    - Add indexes for performance

  3. Security Updates
    - Update RLS policies to use proper UUID relationships
    - Ensure user isolation is maintained
*/

-- First, clean up any orphaned records that might prevent foreign key creation
DELETE FROM tasks WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM canvas_assignments WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM task_status WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM canvas_sync_status WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM user_oauth_tokens WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM user_email_accounts WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

DELETE FROM extracted_email_data WHERE user_id IS NOT NULL AND user_id NOT IN (
  SELECT id FROM auth.users
);

-- Clean up task_status records that reference non-existent tasks or assignments
DELETE FROM task_status WHERE task_id IS NOT NULL AND task_id NOT IN (
  SELECT id FROM tasks
);

DELETE FROM task_status WHERE assignment_id IS NOT NULL AND assignment_id NOT IN (
  SELECT id FROM canvas_assignments
);

-- Add foreign key constraints for user relationships
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE canvas_assignments 
ADD CONSTRAINT fk_canvas_assignments_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE canvas_sync_status 
ADD CONSTRAINT fk_canvas_sync_status_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_oauth_tokens 
ADD CONSTRAINT fk_user_oauth_tokens_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_email_accounts 
ADD CONSTRAINT fk_user_email_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE extracted_email_data 
ADD CONSTRAINT fk_extracted_email_data_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for task_status to tasks relationship
ALTER TABLE task_status 
ADD CONSTRAINT fk_task_status_task_id 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Add foreign key constraint for task_status to assignments relationship
-- Note: assignment_id should reference canvas_assignments.id
ALTER TABLE task_status 
ADD CONSTRAINT fk_task_status_assignment_id 
FOREIGN KEY (assignment_id) REFERENCES canvas_assignments(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_assignments_user_id ON canvas_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_task_id ON task_status(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_assignment_id ON task_status(assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_status_user_id ON task_status(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_sync_status_user_id ON canvas_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_id ON user_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_email_data_user_id ON extracted_email_data(user_id);

-- Update RLS policies to ensure proper user isolation
DROP POLICY IF EXISTS "Users can access their own tasks" ON tasks;
CREATE POLICY "Users can access their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access their own assignments" ON canvas_assignments;
CREATE POLICY "Users can access their own assignments" ON canvas_assignments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access their own task status" ON task_status;
CREATE POLICY "Users can access their own task status" ON task_status
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on all tables if not already enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_email_data ENABLE ROW LEVEL SECURITY;