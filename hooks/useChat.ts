import { useState, useCallback } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { ChatMessage } from '@/types/chat';
import { retrieveRelevantData } from '@/utils/retriever';
import { enrichPromptWithData } from '@/utils/prompts';
import { SYSTEM_PROMPT } from '@/utils/prompts';

const API_URL = 'https://vera-app.aadhyakocha.workers.dev';

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  text: "Hi! I'm Vera, your personal study buddy and mentor. How can I help you today?",
  sender: 'bot',
  timestamp: Date.now(),
};

export function useChat() {
  console.log('useChat.ts')
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const session = useSession();

  const sendMessage = useCallback(async (text: string) => {
    if (!session?.user?.id) {
      console.error('[useChat] User not authenticated');
      return;
    }

    const messageId = Date.now().toString();
    
    const userMessage: ChatMessage = {
      id: messageId,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Retrieve relevant data if needed
      const relevantData = await retrieveRelevantData(text);
      
      // Enrich prompt with data if available
      const enrichedPrompt = enrichPromptWithData(text, relevantData);
      
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: enrichedPrompt,
          userId: session.user.id,
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || "I'm having trouble understanding. Could you rephrase that?",
        sender: 'bot',
        timestamp: Date.now(),
        enriched: !!relevantData,
        metadata: {
          dataSource: relevantData ? (relevantData.cached ? 'cache' : 'database') : 'none',
          processingTime: Date.now() - parseInt(messageId),
        },
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Could you try again?",
        sender: 'bot',
        timestamp: Date.now(),
        metadata: {
          dataSource: 'none',
          processingTime: Date.now() - parseInt(messageId),
        },
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, session?.user?.id]);

  return {
    messages,
    sendMessage,
    isTyping,
  };
}