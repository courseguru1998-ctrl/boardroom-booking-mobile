import axios from 'axios';
import { config } from '../constants/config';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250929';

// System prompt that teaches Claude how to handle bookings
const BOOKING_SYSTEM_PROMPT = `You are a helpful boardroom booking assistant for a company. Your job is to help users book meeting rooms.

When a user wants to book a room, you MUST extract and return the following information in JSON format:
- action: "book" | "check_availability" | "cancel" | "list" | "help"
- date: The booking date in YYYY-MM-DD format (e.g., "2024-02-20")
- startTime: The start time in HH:MM format (e.g., "14:00")
- endTime: The end time in HH:MM format (e.g., "15:00")
- duration: Duration in minutes (e.g., 60)
- numberOfPeople: Number of people attending (e.g., 5)
- floor: Preferred floor (e.g., "3rd floor", "floor 3")
- amenities: Array of required amenities (e.g., ["projector", "whiteboard"])
- roomName: Specific room name if mentioned

Available amenities: projector, whiteboard, video-conferencing, audio-system, tv-screen, air-conditioning, wifi, phone, printer, coffee-machine, water-dispenser, natural-light, accessibility, standing-desk, recording-equipment

IMPORTANT:
1. If the user asks to book a room, extract ALL the booking details and respond with the JSON
2. If any required info is missing, ask the user for clarification
3. If the user wants to check availability, list bookings, or cancel, respond with appropriate action
4. Always be friendly and helpful

Respond ONLY with valid JSON, no other text. Example responses:

User: "Book a room for 5 people tomorrow at 2pm for 1 hour"
Response: {"action":"book","date":"2024-02-20","startTime":"14:00","endTime":"15:00","duration":60,"numberOfPeople":5,"amenities":[]}

User: "I need a room with projector for 10 people on Friday"
Response: {"action":"book","date":"2024-02-23","numberOfPeople":10,"amenities":["projector"],"duration":60,"startTime":"09:00","endTime":"10:00"}

User: "What's available tomorrow afternoon?"
Response: {"action":"check_availability","date":"2024-02-20","timeOfDay":"afternoon"}`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ParsedBooking {
  action: 'book' | 'check_availability' | 'cancel' | 'list' | 'help';
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  numberOfPeople?: number;
  floor?: string;
  amenities?: string[];
  roomName?: string;
  timeOfDay?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  parsedData?: ParsedBooking;
  bookingDetails?: {
    roomName: string;
    date: string;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
  };
}

// Store conversation history
let conversationHistory: ChatMessage[] = [];

export const claudeAIService = {
  /**
   * Send a message to Claude AI and get a response
   */
  async sendMessage(
    message: string,
    apiKey: string,
    bookingContext?: {
      availableRooms?: any[];
      existingBookings?: any[];
    }
  ): Promise<AIResponse> {
    try {
      // Add user message to history
      conversationHistory.push({ role: 'user', content: message });

      // Build context from booking data if available
      let contextInfo = '';
      if (bookingContext?.availableRooms) {
        contextInfo = `\n\nAvailable rooms: ${JSON.stringify(
          bookingContext.availableRooms.map(r => ({ name: r.name, capacity: r.capacity, floor: r.floor }))
        )}`;
      }
      if (bookingContext?.existingBookings) {
        contextInfo += `\n\nExisting bookings: ${JSON.stringify(
          bookingContext.existingBookings.map(b => ({ room: b.roomName, date: b.date, startTime: b.startTime, endTime: b.endTime }))
        )}`;
      }

      // Add context to the message if we have booking data
      const enhancedMessage = contextInfo
        ? `${message}\n\nContext: ${contextInfo}`
        : message;

      const response = await axios.post(
        CLAUDE_API_URL,
        {
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: BOOKING_SYSTEM_PROMPT,
          messages: [
            ...conversationHistory.slice(-10), // Last 10 messages for context
            { role: 'user', content: enhancedMessage }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const aiResponse = response.data.content[0].text;

      // Add assistant response to history
      conversationHistory.push({ role: 'assistant', content: aiResponse });

      // Try to parse JSON from response
      try {
        const parsedData = JSON.parse(aiResponse) as ParsedBooking;

        return {
          success: true,
          message: aiResponse,
          parsedData
        };
      } catch {
        // If not valid JSON, return as a message
        return {
          success: true,
          message: aiResponse
        };
      }
    } catch (error: any) {
      console.error('Claude API Error:', error.response?.data || error.message);

      return {
        success: false,
        message: error.response?.data?.error?.message || 'Failed to get response from AI. Please try again.'
      };
    }
  },

  /**
   * Process a booking request through AI
   */
  async processBooking(
    message: string,
    apiKey: string,
    bookingContext?: {
      availableRooms?: any[];
      existingBookings?: any[];
    }
  ): Promise<AIResponse> {
    const response = await this.sendMessage(message, apiKey, bookingContext);

    if (response.parsedData?.action === 'book' && response.parsedData.date) {
      // Return booking details to be processed by the app
      return {
        success: true,
        message: 'Booking details parsed. Ready to book.',
        parsedData: response.parsedData
      };
    }

    return response;
  },

  /**
   * Clear conversation history
   */
  clearHistory() {
    conversationHistory = [];
  },

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return conversationHistory;
  }
};
