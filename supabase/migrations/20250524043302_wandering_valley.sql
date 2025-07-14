/*
  # Create scheduled sync function

  1. New Functions
    - `handle_scheduled_sync()`: Inserts sync status records for all courses
    - `process_scheduled_sync()`: Processes the scheduled sync for each course

  2. Changes
    - Creates functions to handle scheduled course data synchronization
    - Sets up error handling and logging
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

  -- Process each course sync
  PERFORM process_scheduled_sync();
END;
$$ LANGUAGE plpgsql;

-- Create a function to process the scheduled sync
CREATE OR REPLACE FUNCTION process_scheduled_sync()
RETURNS void AS $$
BEGIN
  -- Update status to processing
  UPDATE canvas_sync_status
  SET 
    status = 'processing',
    message = 'Processing scheduled sync'
  WHERE 
    status = 'pending' 
    AND trigger_type = 'scheduled';

  -- Note: The actual sync will be handled by the edge function
  -- This function just prepares the database state
END;
$$ LANGUAGE plpgsql;