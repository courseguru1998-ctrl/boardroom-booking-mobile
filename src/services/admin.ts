import api from './api';
import type { ApiResponse, Booking, User, Room } from '../types';

export interface AnalyticsData {
  totalBookings: number;
  totalUsers: number;
  totalRooms: number;
  recentBookings: Booking[];
}

export interface UsersResponse {
  users: User[];
  pendingUsers: User[];
}

export interface CreateRoomData {
  name: string;
  capacity: number;
  floor: string;
  building: string;
  amenities: string[];
  campusId: string;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  isActive?: boolean;
}

export const adminApi = {
  getAnalytics: async (): Promise<ApiResponse<AnalyticsData>> => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // User management endpoints
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getPendingUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  approveUser: async (userId: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post(`/admin/users/${userId}/approve`);
    return response.data;
  },

  rejectUser: async (userId: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post(`/admin/users/${userId}/reject`);
    return response.data;
  },

  // Room management endpoints
  getAllRooms: async (): Promise<ApiResponse<Room[]>> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  createRoom: async (data: CreateRoomData): Promise<ApiResponse<Room>> => {
    const response = await api.post('/admin/rooms', data);
    return response.data;
  },

  updateRoom: async (roomId: string, data: UpdateRoomData): Promise<ApiResponse<Room>> => {
    const response = await api.patch(`/admin/rooms/${roomId}`, data);
    return response.data;
  },
};
