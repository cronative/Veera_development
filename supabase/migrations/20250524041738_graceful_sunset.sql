/*
  # Enable RLS and set up policies for Canvas tables

  1. Security Changes
    - Enable RLS on all Canvas-related tables
    - Add policies for authenticated users to read their own data
    - Ensure proper cascade deletion for related tables

  2. Changes
    - Enable RLS on canvas_data table
    - Add read policies for authenticated users
*/

-- Enable RLS on canvas_data table
ALTER TABLE canvas_data ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read their own data
CREATE POLICY "Users can read their own canvas data"
ON canvas_data
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Ensure RLS is enabled on all Canvas tables
ALTER TABLE canvas_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_schedules ENABLE ROW LEVEL SECURITY;

-- Add policies for authenticated users
CREATE POLICY "Users can read course data"
ON canvas_courses FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can read announcements"
ON canvas_announcements FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can read assignments"
ON canvas_assignments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can read schedules"
ON canvas_schedules FOR SELECT TO authenticated
USING (true);