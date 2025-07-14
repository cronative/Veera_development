/*
  # Set up Canvas sync scheduling

  1. Changes
    - Create function to handle scheduled sync
    - Add trigger for daily sync
    - Set up sync status tracking
  
  2. Security
    - Function is executed with invoker security
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
    started_at
  )
  SELECT 
    id,
    'pending',
    'scheduled',
    now()
  FROM canvas_courses;
END;
$$ LANGUAGE plpgsql;

-- Create a function to process pending syncs
CREATE OR REPLACE FUNCTION process_pending_syncs()
RETURNS void AS $$
BEGIN
  UPDATE canvas_sync_status
  SET 
    status = 'processing',
    message = 'Processing scheduled sync'
  WHERE 
    status = 'pending' 
    AND trigger_type = 'scheduled';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically process syncs
CREATE OR REPLACE FUNCTION auto_process_sync()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    -- Update the status to processing
    UPDATE canvas_sync_status
    SET 
      status = 'processing',
      message = 'Auto-processing sync'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically process new sync records
CREATE TRIGGER sync_status_auto_process
  AFTER INSERT ON canvas_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_sync();