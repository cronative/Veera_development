/*
  # Make All Tables User-Specific

  1. Schema Changes
    - Add user_id columns to all Canvas-related tables
    - Update foreign key relationships
    - Add proper indexes for performance

  2. Security
    - Enable RLS on all tables
    - Create comprehensive policies for user data isolation
    - Ensure proper authentication checks

  3. Automation
    - Add triggers to automatically set user_id
    - Update task creation logic
    - Handle existing data appropriately
*/

-- Add user_id to canvas_courses if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canvas_courses' AND column_name = 'user_id') 
  THEN
    ALTER TABLE canvas_courses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to canvas_assignments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canvas_assignments' AND column_name = 'user_id') 
  THEN
    ALTER TABLE canvas_assignments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to canvas_announcements if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canvas_announcements' AND column_name = 'user_id') 
  THEN
    ALTER TABLE canvas_announcements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to canvas_schedules if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canvas_schedules' AND column_name = 'user_id') 
  THEN
    ALTER TABLE canvas_schedules ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update task_status to use proper foreign key relationships
ALTER TABLE task_status 
  DROP CONSTRAINT IF EXISTS task_status_assignment_id_fkey;

-- Add task_id column to task_status if not exists (for user-created tasks)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_status' AND column_name = 'task_id') 
  THEN
    ALTER TABLE task_status ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Convert assignment_id to uuid type if it's currently text
DO $$
BEGIN
  -- Check if assignment_id is text type and convert to uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_status' 
    AND column_name = 'assignment_id' 
    AND data_type = 'text'
  ) THEN
    -- First, update any existing text values to be valid UUIDs or NULL
    UPDATE task_status 
    SET assignment_id = NULL 
    WHERE assignment_id IS NOT NULL 
    AND assignment_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    -- Convert the column type
    ALTER TABLE task_status 
    ALTER COLUMN assignment_id TYPE uuid USING assignment_id::uuid;
  END IF;
END $$;

-- Now add the foreign key constraint
ALTER TABLE task_status 
  ADD CONSTRAINT task_status_assignment_id_fkey
    FOREIGN KEY (assignment_id)
    REFERENCES canvas_assignments(id)
    ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE canvas_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_sync_status ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read course data" ON canvas_courses;
DROP POLICY IF EXISTS "Users can read their course data" ON canvas_courses;
DROP POLICY IF EXISTS "Users can read course announcements" ON canvas_announcements;
DROP POLICY IF EXISTS "Users can read announcements" ON canvas_announcements;
DROP POLICY IF EXISTS "Allow all select" ON canvas_announcements;
DROP POLICY IF EXISTS "Users can read their course announcements" ON canvas_announcements;
DROP POLICY IF EXISTS "Users can read assignments" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can read course assignments" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can read schedules" ON canvas_schedules;
DROP POLICY IF EXISTS "Users can read course schedules" ON canvas_schedules;
DROP POLICY IF EXISTS "Users can access their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can access their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can read their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can update their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can insert their own task status" ON task_status;
DROP POLICY IF EXISTS "Users can access their own sync status" ON canvas_sync_status;
DROP POLICY IF EXISTS "Users can read sync status" ON canvas_sync_status;

-- Create comprehensive RLS policies for canvas_courses
CREATE POLICY "Users can manage their own courses"
  ON canvas_courses
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create comprehensive RLS policies for canvas_assignments
CREATE POLICY "Users can manage their own assignments"
  ON canvas_assignments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create comprehensive RLS policies for canvas_announcements
CREATE POLICY "Users can manage their own announcements"
  ON canvas_announcements
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create comprehensive RLS policies for canvas_schedules
CREATE POLICY "Users can manage their own schedules"
  ON canvas_schedules
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create comprehensive RLS policies for tasks
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create comprehensive RLS policies for task_status
CREATE POLICY "Users can manage their own task status"
  ON task_status
  FOR ALL
  TO authenticated
  USING (
    -- For tasks linked via task_id
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_status.task_id 
      AND tasks.user_id = auth.uid()
    ))
    OR
    -- For assignments linked via assignment_id
    (assignment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM canvas_assignments 
      WHERE canvas_assignments.id = task_status.assignment_id
      AND canvas_assignments.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    -- For tasks linked via task_id
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_status.task_id 
      AND tasks.user_id = auth.uid()
    ))
    OR
    -- For assignments linked via assignment_id
    (assignment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM canvas_assignments 
      WHERE canvas_assignments.id = task_status.assignment_id
      AND canvas_assignments.user_id = auth.uid()
    ))
  );

-- Create comprehensive RLS policies for canvas_sync_status
CREATE POLICY "Users can manage their own sync status"
  ON canvas_sync_status
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_canvas_courses_user_id ON canvas_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_assignments_user_id ON canvas_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_announcements_user_id ON canvas_announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_schedules_user_id ON canvas_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status_task_id ON task_status(task_id);

-- Update the task creation trigger to set user_id
CREATE OR REPLACE FUNCTION create_task_with_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create task status if the assignment has a user_id
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO task_status (
      assignment_id,
      status,
      priority
    ) VALUES (
      NEW.id,
      'pending',
      'medium'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the function to automatically set user_id on inserts
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to current authenticated user if not already set
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_canvas_courses ON canvas_courses;
CREATE TRIGGER set_user_id_canvas_courses
  BEFORE INSERT ON canvas_courses
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_canvas_assignments ON canvas_assignments;
CREATE TRIGGER set_user_id_canvas_assignments
  BEFORE INSERT ON canvas_assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_canvas_announcements ON canvas_announcements;
CREATE TRIGGER set_user_id_canvas_announcements
  BEFORE INSERT ON canvas_announcements
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_canvas_schedules ON canvas_schedules;
CREATE TRIGGER set_user_id_canvas_schedules
  BEFORE INSERT ON canvas_schedules
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_tasks ON tasks;
CREATE TRIGGER set_user_id_tasks
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_user_id_canvas_sync_status ON canvas_sync_status;
CREATE TRIGGER set_user_id_canvas_sync_status
  BEFORE INSERT ON canvas_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Update existing records to have user_id (for development/testing)
-- Note: In production, you would need to properly assign user_ids based on actual ownership

-- For development, we can set a default user_id or leave them null
-- Uncomment and modify these if you have existing data that needs user assignment:

-- UPDATE canvas_courses SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE canvas_assignments SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE canvas_announcements SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE canvas_schedules SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;