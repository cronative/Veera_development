import { useState, useCallback } from 'react';
import { fetchCourses, fetchCourseAssignments, fetchCourseAnnouncements } from '@/utils/canvas';
import { supabase } from '@/utils/supabase';

export function useCanvas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("useCanvas")

  const syncCourseData = useCallback(async (courseId: string) => {
    console.log("syncCourseData")
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [assignments, announcements] = await Promise.all([
        fetchCourseAssignments(courseId),
        fetchCourseAnnouncements(courseId),
      ]);

      // Update assignments in Supabase
      const { error: assignmentsError } = await supabase
        .from('canvas_assignments')
        .upsert(
          assignments.map((assignment: any) => ({
            id: assignment.id.toString(),
            course_id: courseId,
            name: assignment.name,
            description: assignment.description,
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            submission_types: assignment.submission_types,
            published: assignment.published,
            grading_type: assignment.grading_type,
            allowed_attempts: assignment.allowed_attempts,
            turnitin_enabled: assignment.turnitin_enabled,
            peer_reviews: assignment.peer_reviews,
            automatic_peer_reviews: assignment.automatic_peer_reviews,
            notify_of_update: assignment.notify_of_update,
          }))
        );

      if (assignmentsError) throw assignmentsError;

      // Update announcements in Supabase
      const { error: announcementsError } = await supabase
        .from('canvas_announcements')
        .upsert(
          announcements.map((announcement: any) => ({
            id: announcement.id.toString(),
            course_id: courseId,
            title: announcement.title,
            message: announcement.message,
            posted_at: announcement.posted_at,
            user_id: announcement.user_id,
            published: announcement.published,
            subscribed: announcement.subscribed,
            discussion_type: announcement.discussion_type,
          }))
        );

      if (announcementsError) throw announcementsError;

      // Update sync status
      const { error: syncError } = await supabase
        .from('canvas_sync_status')
        .insert({
          course_id: courseId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (syncError) throw syncError;

    } catch (error) {
      console.error('Error syncing course data:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync course data');

      // Log sync failure
      await supabase
        .from('canvas_sync_status')
        .insert({
          course_id: courseId,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    syncCourseData,
  };
}