/**
 * Shared task-related keywords for message classification
 * Single source of truth for all task/assignment detection
 */

export const TASK_KEYWORDS = [
  // Direct task queries
  'what\'s due',
  'whats due', 
  'what is due',
  'upcoming tasks',
  'pending tasks',
  'todo',
  'to do',
  'to-do',
  
  // Assignment related
  'assignments',
  'assignment',
  'homework',
  'project',
  'deadlines',
  'deadline',
  'due',
  
  // Academic content
  'exam',
  'quiz',
  'test',
  'study',
  'course',
  'class',
  'schedule',
  
  // Canvas specific
  'announcement',
  'announcements',
  'syllabus',
  'grades',
  'submission',
  
  // Task management
  'task',
  'tasks',
  'pending',
  'completed',
  'priority'
];

/**
 * Check if a message contains task-related keywords
 * @param message - The user message to analyze
 * @returns boolean indicating if task keywords were found
 */
export function containsTaskKeywords(message: string): boolean {
  const lowercaseMessage = message.toLowerCase();
  
  return TASK_KEYWORDS.some(keyword => 
    lowercaseMessage.includes(keyword)
  );
}

/**
 * Get matching task keywords from a message
 * @param message - The user message to analyze
 * @returns Array of matched keywords
 */
export function getMatchingTaskKeywords(message: string): string[] {
  const lowercaseMessage = message.toLowerCase();
  
  return TASK_KEYWORDS.filter(keyword => 
    lowercaseMessage.includes(keyword)
  );
}

/**
 * Calculate confidence score based on keyword matches
 * @param message - The user message to analyze
 * @returns Confidence score between 0 and 1
 */
export function calculateTaskConfidence(message: string): number {
  const words = message.toLowerCase().split(/\s+/);
  const matches = getMatchingTaskKeywords(message);
  
  // Higher confidence for more matches relative to message length
  const baseConfidence = matches.length / Math.min(words.length, 10);
  
  // Boost confidence for direct task queries
  const directQueries = ['what\'s due', 'whats due', 'upcoming tasks', 'pending tasks'];
  const hasDirectQuery = directQueries.some(query => 
    message.toLowerCase().includes(query)
  );
  
  return hasDirectQuery ? Math.min(baseConfidence + 0.3, 1.0) : baseConfidence;
}