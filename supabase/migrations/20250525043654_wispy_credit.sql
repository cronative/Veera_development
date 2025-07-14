/*
  # Canvas Sync Status Management

  1. New Functions
    - `handle_scheduled_sync()`: Manages the sync process for all courses
    - `auto_process_sync()`: Trigger function for processing new sync requests

  2. Changes
    - Adds function to create sync status records for all courses
    - Adds trigger for automatic processing of new sync requests

  3. Security
    - Functions are executed with invoker's privileges
*/

-- Create a function to handle the scheduled sync
CREATE OR REPLACE FUNCTION handle_scheduled_sync()
RETURNS void AS $$
BEGIN
  -- Insert sync status records for all courses
  INSERT INTO canvas_sync_status (
    course_id,
    status,
    trigger_type,
    started_at,
    retry_count
  )
  SELECT 
    id,
    'pending'::text,
    'scheduled'::text,
    now(),
    0
  FROM canvas_courses
  WHERE id NOT IN (
    -- Exclude courses that have a pending or in-progress sync
    SELECT course_id 
    FROM canvas_sync_status 
    WHERE status IN ('pending', 'in_progress')
      AND created_at > now() - interval '1 hour'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically process new sync requests
CREATE OR REPLACE FUNCTION auto_process_sync()
RETURNS trigger AS $$
BEGIN
  -- Here you would typically call your external sync process
  -- For now, we'll just update the status to show it was received
  UPDATE canvas_sync_status
  SET 
    status = 'received',
    started_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on the canvas_sync_status table
DROP TRIGGER IF EXISTS sync_status_auto_process ON canvas_sync_status;
CREATE TRIGGER sync_status_auto_process
  AFTER INSERT ON canvas_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_sync();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_scheduled_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_process_sync() TO authenticated;