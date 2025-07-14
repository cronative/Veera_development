export const API_ENDPOINTS = {
  BASE_URL: 'https://vera-app.aadhyakocha.workers.dev',
  CHAT: '/chat',
  AI_MODEL: '/ai/run/@cf/meta/llama-2-8b-instruct',
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || 'An error occurred',
      response.status,
      error
    );
  }
  return response.json();
}