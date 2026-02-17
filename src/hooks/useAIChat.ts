import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { claudeAIService, ParsedBooking, AIResponse } from '../services/claudeAI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsedData?: ParsedBooking;
  isBooking?: boolean;
}

interface UseAIChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearChat: () => void;
  getBookingDetails: () => ParsedBooking | null;
}

export const useAIChat = (): UseAIChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBookingData, setLastBookingData] = useState<ParsedBooking | null>(null);

  const sendMessage = useCallback(async (content: string, context?: any) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get API key from secure storage
      const apiKey = await SecureStore.getItemAsync('claude_api_key');

      if (!apiKey) {
        throw new Error('Claude API key not configured. Please add your API key in settings.');
      }

      const response: AIResponse = await claudeAIService.sendMessage(
        content,
        apiKey,
        context
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        parsedData: response.parsedData,
        isBooking: response.parsedData?.action === 'book'
      };

      if (response.parsedData) {
        setLastBookingData(response.parsedData);
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err.message || 'Something went wrong. Please try again.'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastBookingData(null);
    claudeAIService.clearHistory();
  }, []);

  const getBookingDetails = useCallback(() => {
    return lastBookingData;
  }, [lastBookingData]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    getBookingDetails
  };
};
