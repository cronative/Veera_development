/*
  # Enhance sync status tracking

  1. Changes
    - Add error tracking columns
    - Add retry mechanism
    - Add completion status updates
    - Add monitoring functions

  2. Security
    - Maintain existing RLS policies
*/

-- Add columns for better error tracking
ALTER TABLE canvas_sync_status
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error text,
ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

-- Function to update sync completion status
CREATE OR REPLACE FUNCTION update_sync_status(
  p_sync_id uuid,
  p_status text,
  p_message text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE canvas_sync_status
  SET 
    status = p_status,
    message = COALESCE(p_message, message),
    last_error = CASE 
      WHEN p_status = 'error' THEN p_error 
      ELSE NULL 
    END,
    completed_at = CASE 
      WHEN p_status IN ('completed', 'error') THEN now() 
      ELSE completed_at 
    END,
    retry_count = CASE 
      WHEN p_status = 'error' THEN retry_count + 1 
      ELSE retry_count 
    END,
    next_retry_at = CASE 
      WHEN p_status = 'error' AND retry_count < 3 THEN now() + interval '1 hour' * retry_count
      ELSE next_retry_at 
    END
  WHERE id = p_sync_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get failed syncs for monitoring
CREATE OR REPLACE FUNCTION get_failed_syncs(hours integer DEFAULT 24)
RETURNS TABLE (
  sync_id uuid,
  course_name text,
  error_message text,
  failed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as sync_id,
    c.name as course_name,
    s.last_error as error_message,
    s.completed_at as failed_at
  FROM canvas_sync_status s
  JOIN canvas_courses c ON c.id = s.course_id
  WHERE 
    s.status = 'error'
    AND s.completed_at > now() - (hours || ' hours')::interval
  ORDER BY s.completed_at DESC;
END;
$$ LANGUAGE plpgsql;