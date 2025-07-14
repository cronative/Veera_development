import { SYSTEM_PROMPT } from '@/constants/prompts';
import { containsTaskKeywords } from '@/utils/taskKeywords';
import { getTaskData, formatTaskDataForPrompt } from '@/utils/retriever';
import { supabase } from '@/utils/supabase';

const API_URL = 'https://vera-app.aadhyakocha.workers.dev';
console.log('[Chat API] Loaded');

export async function POST(request: Request) {
  try {
    const { message, history, userId } = await request.json();
    
    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    if (!userId) {
      return new Response('User ID is required', { status: 401 });
    }

    console.log('[Chat API] Processing message for user:', userId);

    let taskPrompt = '';
    let taskData = null;

    // Check if message contains task-related keywords
    if (containsTaskKeywords(message)) {
      console.log('[Chat API] Task keywords detected, fetching user-specific data...');
      
      try {
        // Verify user authentication
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.id !== userId) {
          return new Response('Unauthorized', { status: 403 });
        }

        // Fetch user-specific task data
        taskData = await getTaskData();
        console.log('[Chat API] Raw taskData:', taskData);
        
        if (taskData && taskData.totalCount > 0) {
          const formattedTasks = formatTaskDataForPrompt(taskData);
          
          taskPrompt = `
            Here are your current pending tasks and assignments, sorted by priority and due date:
            ${formattedTasks}
            
            Please summarize these items in a clear, organized way. For anything due within 48 hours, 
            add an urgency note. After listing the items, suggest helping with the shortest or 
            most urgent task by asking "Would you like help breaking down [task name]?"
            
            Remember to:
            1. Group items by course when possible
            2. Highlight any overlapping deadlines
            3. Note which items are Canvas assignments vs personal tasks
            4. Suggest time management strategies if multiple items are due soon
            
            Note: All data shown is specific to this user and their enrolled courses.
          `;
          
          console.log('[Chat API] User-specific task data retrieved:', {
            userId,
            totalCount: taskData.totalCount,
            tasks: taskData.tasks.length,
            assignments: taskData.assignments.length
          });
        } else {
          taskPrompt = `
            I checked your personal task list and you currently have no pending assignments or tasks. 
            Great job staying on top of everything! Is there anything else I can help you with 
            regarding your studies or planning ahead?
          `;
          console.log('[Chat API] No pending tasks found for user:', userId);
        }
      } catch (error) {
        console.error('[Chat API] Error fetching user-specific task data:', error);
        taskPrompt = `
          I'm having trouble accessing your personal task list right now. Let me help you in other ways - 
          you can tell me about any specific assignments or deadlines you're working on, and I'll 
          help you create a plan to tackle them.
        `;
      }
    }

    // Build messages array for AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      ...(taskPrompt ? [{ role: 'user', content: taskPrompt }] : []),
      { role: 'user', content: message }
    ];

    console.log('[Chat API] Sending request to AI with', messages.length, 'messages');

    // Call AI service
    const response = await fetch(`${API_URL}/ai/run/@cf/meta/llama-2-8b-instruct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      console.error('[Chat API] AI service error:', response.statusText);
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const result = await response.json();
    const assistantResponse = result.result?.response;

    if (!assistantResponse) {
      console.error('[Chat API] Invalid AI response format:', result);
      throw new Error('Invalid response format from AI API');
    }

    console.log('[Chat API] AI response received successfully for user:', userId);

    return Response.json({ 
      response: assistantResponse,
      metadata: {
        hasTaskData: !!taskData,
        taskCount: taskData?.totalCount || 0,
        cached: taskData?.cached || false,
        userId: userId
      }
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Rate limit')) {
      return Response.json({ 
        response: "I'm getting a lot of requests right now. Please try again in a moment!" 
      });
    }
    
    if (errorMessage.includes('AI request failed')) {
      return Response.json({ 
        response: "I'm having trouble thinking right now. Could you try rephrasing your question?" 
      });
    }
    
    return Response.json({ 
      response: "I'm having some technical difficulties. Let me know what you need help with and I'll do my best to assist you!" 
    });
  }
}