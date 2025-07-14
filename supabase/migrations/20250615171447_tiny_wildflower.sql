-- Create user_oauth_tokens table for storing OAuth credentials
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add user_id to tasks table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id') 
  THEN
    ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to canvas_sync_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canvas_sync_status' AND column_name = 'user_id') 
  THEN
    ALTER TABLE canvas_sync_status ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on all user-specific tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow all inserts" ON task_status;
DROP POLICY IF EXISTS "Public user insert" ON task_status;
DROP POLICY IF EXISTS "Allow all inserts" ON canvas_assignments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON canvas_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON canvas_assignments;
DROP POLICY IF EXISTS "Users can create assignments" ON canvas_assignments;

-- Create RLS policies for tasks
CREATE POLICY "Users can access their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for task_status
-- Note: We need to handle both task_id (uuid) and assignment_id (text) properly
CREATE POLICY "Users can access their own task status"
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
    -- For assignments linked via assignment_id (text type)
    (assignment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM canvas_assignments 
      WHERE canvas_assignments.id::text = task_status.assignment_id
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
    -- For assignments linked via assignment_id (text type)
    (assignment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM canvas_assignments 
      WHERE canvas_assignments.id::text = task_status.assignment_id
    ))
  );

-- Create RLS policies for canvas_sync_status
CREATE POLICY "Users can access their own sync status"
  ON canvas_sync_status
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_oauth_tokens
CREATE POLICY "Users can manage their own OAuth tokens"
  ON user_oauth_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update existing functions to include user_id
CREATE OR REPLACE FUNCTION create_task_with_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_status (
    assignment_id,
    status,
    priority
  ) VALUES (
    NEW.id::text,  -- Ensure proper type casting
    'pending',
    'medium'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating user_oauth_tokens timestamp
CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_sync_status_user_id ON canvas_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_id ON user_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_provider ON user_oauth_tokens(provider);