import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // Fetch tasks with course information
    const { data: tasks, error: tasksError } = await supabase
      .from('canvas_assignments')
      .select(`
        id,
        name,
        description,
        due_at,
        canvas_courses (
          id,
          name
        ),
        task_status (
          status,
          completed_at
        )
      `)
      .order('due_at', { ascending: true });

    if (tasksError) throw tasksError;

    return Response.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks' }), 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { courseId, title, description, dueDate } = await request.json();

    // Validate required fields
    if (!courseId || !title) {
      return new Response(
        JSON.stringify({ error: 'Course ID and title are required' }), 
        { status: 400 }
      );
    }

    // Create new assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('canvas_assignments')
      .insert({
        course_id: courseId,
        name: title,
        description,
        due_at: dueDate,
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Create task status
    const { data: taskStatus, error: statusError } = await supabase
      .from('task_status')
      .insert({
        assignment_id: assignment.id,
        status: 'pending',
      })
      .select()
      .single();

    if (statusError) throw statusError;

    return Response.json({
      task: {
        ...assignment,
        status: taskStatus,
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create task' }), 
      { status: 500 }
    );
  }
}