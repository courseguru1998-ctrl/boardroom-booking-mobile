import api from './api';
import type { ApiResponse } from '../types';

export interface CheckIn {
  id: string;
  checkedInAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CheckInStatus {
  bookingId: string;
  totalExpected: number;
  totalCheckedIn: number;
  checkIns: CheckIn[];
}

export interface MyCheckIn {
  id: string;
  checkedInAt: string;
  booking: {
    id: string;
    title: string;
    roomName: string;
    startTime: string;
    endTime: string;
  };
}

export const checkInsApi = {
  checkIn: async (bookingId: string): Promise<ApiResponse<CheckIn>> => {
    const response = await api.post('/checkins', { bookingId });
    return response.data;
  },

  getCheckInStatus: async (bookingId: string): Promise<ApiResponse<CheckInStatus>> => {
    const response = await api.get(`/checkins/booking/${bookingId}`);
    return response.data;
  },

  isCheckedIn: async (bookingId: string): Promise<ApiResponse<{ isCheckedIn: boolean }>> => {
    const response = await api.get(`/checkins/booking/${bookingId}/me`);
    return response.data;
  },

  getMyCheckInsToday: async (): Promise<ApiResponse<MyCheckIn[]>> => {
    const response = await api.get('/checkins/my/today');
    return response.data;
  },
};
