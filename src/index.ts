import { POST as handleChat } from '../api/chat+api';

interface CanvasSyncRequest {
  courseId: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    // Handle AI bot endpoint
    if (url.pathname.endsWith('/chat')) {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      return handleChat(request);
    }
    
    // Handle Canvas sync endpoint
    if (url.pathname.endsWith('/canvas-sync')) {
      if (request.method !== 'POST' && request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        let courseId: string | null = null;

        if (request.method === 'GET') {
          courseId = url.searchParams.get('courseId');
        } else {
          const body: CanvasSyncRequest = await request.json();
          courseId = body.courseId;
        }

        if (!courseId) {
          return new Response(
            JSON.stringify({ error: 'courseId is required' }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        // Call Canvas API to fetch course data
        const courseResponse = await fetch(
          `${env.CANVAS_API_URL}/api/v1/courses/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${env.CANVAS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!courseResponse.ok) {
          throw new Error(`Canvas API error: ${courseResponse.statusText}`);
        }

        const courseData = await courseResponse.json();

        // Call Canvas API to fetch assignments
        const assignmentsResponse = await fetch(
          `${env.CANVAS_API_URL}/api/v1/courses/${courseId}/assignments`,
          {
            headers: {
              'Authorization': `Bearer ${env.CANVAS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error(`Canvas API error: ${assignmentsResponse.statusText}`);
        }

        const assignmentsData = await assignmentsResponse.json();

        // Call Canvas API to fetch announcements
        const announcementsResponse = await fetch(
          `${env.CANVAS_API_URL}/api/v1/courses/${courseId}/discussion_topics?only_announcements=true`,
          {
            headers: {
              'Authorization': `Bearer ${env.CANVAS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!announcementsResponse.ok) {
          throw new Error(`Canvas API error: ${announcementsResponse.statusText}`);
        }

        const announcementsData = await announcementsResponse.json();

        // Update Supabase with the fetched data
        const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/sync_canvas_data`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_data: courseData,
            assignments_data: assignmentsData,
            announcements_data: announcementsData,
          }),
        });

        if (!supabaseResponse.ok) {
          throw new Error(`Supabase API error: ${supabaseResponse.statusText}`);
        }

        return new Response(
          JSON.stringify({ success: true, courseId }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );

      } catch (error) {
        console.error('Canvas sync error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
    }

    // Handle chat endpoint
    if (url.pathname.endsWith('/chat')) {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      return handleChat(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;