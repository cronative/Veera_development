import Constants from 'expo-constants';

const CANVAS_API_URL = 'https://canvas.instructure.com/api/v1';
const CANVAS_TOKEN = "7~2BBARQ7GCYzW27kHQxn4htYuNnk6hwn68V6e3ffFA9uuKGGry4PAKrYQKrKAhT49"

if (!CANVAS_TOKEN) {
  throw new Error('Canvas API token not configured');
}

const headers = {
  'Authorization': `Bearer ${CANVAS_TOKEN}`,
  'Content-Type': 'application/json',
};

export async function fetchCourses() {
  try {
    const response = await fetch(`${CANVAS_API_URL}/courses`, { headers });
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function fetchCourseAssignments(courseId: string) {
  try {
    const response = await fetch(
      `${CANVAS_API_URL}/courses/${courseId}/assignments`,
      { headers }
    );
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return await response.json();
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}

export async function fetchCourseAnnouncements(courseId: string) {
  try {
    const response = await fetch(
      `${CANVAS_API_URL}/courses/${courseId}/discussion_topics?only_announcements=true`,
      { headers }
    );
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return await response.json();
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
}

export function getCalendarFeedUrl(courseId: string) {
  return `${CANVAS_API_URL}/calendar/feed/${CANVAS_TOKEN}/course_${courseId}.ics`;
}