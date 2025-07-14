import { SYSTEM_PROMPT } from '../constants/prompts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const body: ChatRequest = await request.json();
    if (!body.message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(body.history || []),
      { role: 'user', content: body.message }
    ];

    const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.9,
    });

    return new Response(
      JSON.stringify({ response: aiResponse.response }), 
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }), 
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