/*
  # Create Canvas LMS Integration Tables

  1. New Tables
    - `canvas_courses`
      - Stores course information and syllabus data
    - `canvas_announcements`
      - Stores course announcements
    - `canvas_assignments`
      - Stores assignment information and due dates
    - `canvas_schedules`
      - Stores course schedules and office hours

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their course data
*/

-- Create canvas_courses table
CREATE TABLE IF NOT EXISTS canvas_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id integer NOT NULL,
  name text NOT NULL,
  syllabus_body text,
  start_at timestamptz,
  end_at timestamptz,
  term_id integer,
  term_name text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create canvas_announcements table
CREATE TABLE IF NOT EXISTS canvas_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES canvas_courses(id) ON DELETE CASCADE,
  announcement_id integer NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  posted_at timestamptz NOT NULL,
  author_id integer,
  author_name text,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create canvas_assignments table
CREATE TABLE IF NOT EXISTS canvas_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES canvas_courses(id) ON DELETE CASCADE,
  assignment_id integer NOT NULL,
  name text NOT NULL,
  description text,
  due_at timestamptz,
  points_possible numeric,
  submission_types text[],
  created_at timestamptz DEFAULT now()
);

-- Create canvas_schedules table
CREATE TABLE IF NOT EXISTS canvas_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES canvas_courses(id) ON DELETE CASCADE,
  schedule_type text NOT NULL, -- 'class' or 'office_hours'
  days text[] NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  instructor text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE canvas_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their course data"
  ON canvas_courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read course announcements"
  ON canvas_announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read course assignments"
  ON canvas_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read course schedules"
  ON canvas_schedules
  FOR SELECT
  TO authenticated
  USING (true);