import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { parse } from 'npm:date-fns@2.30.0';
import { format } from 'npm:date-fns-tz@2.0.0';
import { syncCourseData } from './canvas-sync/index.ts';
import type { Env } from './canvas-sync/index.ts';       // same Env interface
import { corsHeaders } from './canvas-sync/index.ts';     // your CORS config

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CANVAS_API_TOKEN: string;
  CANVAS_API_URL: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function fetchCanvasAPI(path: string, env: Env) {
  const response = await fetch(`${env.CANVAS_API_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${env.CANVAS_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  console.log("fetchCanvasAPI: "+response)
  
  if (!response.ok) {
    throw new Error(`Canvas API error: ${response.statusText}`);
  }

  return response.json();
}

async function syncCourseData(courseId: string, env: Env, supabase: any) {
  try {
    // Fetch course details
    const course = await fetchCanvasAPI(`/api/v1/courses/${courseId}`, env);
    console.log("try course: "+course)
    // Fetch announcements (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const announcements = await fetchCanvasAPI(
      `/api/v1/courses/${courseId}/announcements?start_date=${thirtyDaysAgo.toISOString()}`,
      env
    );
    console.log("try announcements: "+announcements)

    // Fetch assignments
    const assignments = await fetchCanvasAPI(
      `/api/v1/courses/${courseId}/assignments`,
      env
    );
    console.log("try assignments: "+assignments)

    // Parse syllabus for schedule information
    const scheduleInfo = parseSyllabusSchedule(course.syllabus_body);
    console.log("try scheduleInfo: "+scheduleInfo)
    
    // Update database
    const { data: courseData, error: courseError } = await supabase
      .from('canvas_courses')
      .upsert({
        course_id: course.id,
        name: course.name,
        syllabus_body: course.syllabus_body,
        start_at: course.start_at,
        end_at: course.end_at,
        term_id: course.term?.id,
        term_name: course.term?.name,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // Update announcements
    const { error: announcementError } = await supabase
      .from('canvas_announcements')
      .upsert(
        announcements.map((announcement: any) => ({
          course_id: courseData.id,
          announcement_id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          posted_at: announcement.posted_at,
          author_id: announcement.author.id,
          author_name: announcement.author.display_name,
          attachments: announcement.attachments,
        }))
      );
    console.log("try announcement error: "+announcementError)

    if (announcementError) throw announcementError;

    // Update assignments
    const { error: assignmentError } = await supabase
      .from('canvas_assignments')
      .upsert(
        assignments.map((assignment: any) => ({
          course_id: courseData.id,
          assignment_id: assignment.id,
          name: assignment.name,
          description: assignment.description,
          due_at: assignment.due_at,
          points_possible: assignment.points_possible,
          submission_types: assignment.submission_types,
        }))
      );
    console.log("try assignmentError: "+assignmentError)

    if (assignmentError) throw assignmentError;

    // Update schedules
    const { error: scheduleError } = await supabase
      .from('canvas_schedules')
      .upsert(
        scheduleInfo.map((schedule: any) => ({
          course_id: courseData.id,
          ...schedule,
        }))
      );
console.log("try scheduleError: "+scheduleError)

    if (scheduleError) throw scheduleError;

    return { success: true, courseId: courseData.id };
  } catch (error) {
    console.log("catch: "+error)
    console.error('Error syncing course data:', error);
    throw error;
  }
}

function parseSyllabusSchedule(syllabusHtml: string) {
  // This is a simplified example. In practice, you'd want to use a proper HTML parser
  // and more sophisticated pattern matching based on your specific syllabus format
  const schedules = [];
  
  // Example pattern matching for course times
  const courseTimePattern = /Class meets: ([MTWRF]+) (\d{1,2}:\d{2}(?:AM|PM)) - (\d{1,2}:\d{2}(?:AM|PM)) in ([\w\s]+)/gi;
  let match;
  
  while ((match = courseTimePattern.exec(syllabusHtml)) !== null) {
    schedules.push({
      schedule_type: 'class',
      days: match[1].split(''),
      start_time: parse(match[2], 'h:mmaa', new Date()).toISOString(),
      end_time: parse(match[3], 'h:mmaa', new Date()).toISOString(),
      location: match[4].trim(),
    });
  }
  
  // Example pattern matching for office hours
  const officeHoursPattern = /Office Hours: ([MTWRF]+) (\d{1,2}:\d{2}(?:AM|PM)) - (\d{1,2}:\d{2}(?:AM|PM)) in ([\w\s]+)/gi;
  
  while ((match = officeHoursPattern.exec(syllabusHtml)) !== null) {
    schedules.push({
      schedule_type: 'office_hours',
      days: match[1].split(''),
      start_time: parse(match[2], 'h:mmaa', new Date()).toISOString(),
      end_time: parse(match[3], 'h:mmaa', new Date()).toISOString(),
      location: match[4].trim(),
    });
  }
  
  return schedules;
}

Deno.serve(async (req) => {
  console.log("Received method:", req.method);
  try {
    // 1) CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2) Only allow GET or POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // 3) Grab env and init Supabase with service role key
    const env = Deno.env.toObject() as Env;
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // 4) Read courseId from query or JSON body
    let courseId: string | null = null;
    if (req.method === 'GET') {
      courseId = new URL(req.url).searchParams.get('courseId');
    } else {
      const body = await req.json().catch(() => ({}));
      courseId = body.courseId ?? null;
    }

    if (!courseId) {
      return new Response(JSON.stringify({ error: 'courseId is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // 5) Run the sync logic
    const result = await syncCourseData(courseId, env, supabase);

    // 6) Return JSON
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in canvas-sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});