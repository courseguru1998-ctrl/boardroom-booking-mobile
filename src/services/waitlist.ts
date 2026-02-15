import api from './api';
import type { ApiResponse } from '../types';

export interface WaitlistEntry {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: 'WAITING' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED';
  createdAt: string;
  room: {
    id: string;
    name: string;
    capacity: number;
    building: string | null;
    floor: string | null;
  };
}

export interface AddToWaitlistData {
  roomId: string;
  startTime: string;
  endTime: string;
}

export const waitlistApi = {
  addToWaitlist: async (data: AddToWaitlistData): Promise<ApiResponse<WaitlistEntry>> => {
    const response = await api.post('/waitlist', data);
    return response.data;
  },

  getMyWaitlist: async (): Promise<ApiResponse<WaitlistEntry[]>> => {
    const response = await api.get('/waitlist/my');
    return response.data;
  },

  removeFromWaitlist: async (entryId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/waitlist/${entryId}`);
    return response.data;
  },

  isOnWaitlist: async (
    roomId: string,
    startTime: string,
    endTime: string
  ): Promise<ApiResponse<{ isOnWaitlist: boolean }>> => {
    const response = await api.get('/waitlist/check', {
      params: { roomId, startTime, endTime },
    });
    return response.data;
  },
};
