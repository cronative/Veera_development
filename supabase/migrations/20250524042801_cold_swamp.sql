/*
  # Add sync status tracking

  1. New Tables
    - `canvas_sync_status`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references canvas_courses)
      - `status` (text) - success/failed
      - `message` (text) - error message or success details
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `trigger_type` (text) - scheduled/manual
      
  2. Security
    - Enable RLS on sync_status table
    - Add policy for authenticated users to read sync status
*/

CREATE TABLE IF NOT EXISTS canvas_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES canvas_courses(id),
  status text NOT NULL,
  message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  trigger_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE canvas_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read sync status"
ON canvas_sync_status
FOR SELECT
TO authenticated
USING (true);

-- Function to trigger sync for a specific course
CREATE OR REPLACE FUNCTION trigger_canvas_sync(course_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert a new sync status record
  INSERT INTO canvas_sync_status (course_id, status, trigger_type)
  VALUES (course_id, 'pending', 'manual');
  
  -- Call the edge function (this will be handled by the client)
  -- We can't directly call edge functions from PostgreSQL
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger sync for all courses
CREATE OR REPLACE FUNCTION trigger_canvas_sync_all()
RETURNS void AS $$
DECLARE
  course_record RECORD;
BEGIN
  FOR course_record IN SELECT id FROM canvas_courses LOOP
    PERFORM trigger_canvas_sync(course_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;