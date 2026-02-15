import api from './api';
import type { Room, ApiResponse } from '../types';

interface FavoriteRoom extends Room {
  favoritedAt: string;
}

export const favoritesApi = {
  getAll: async (): Promise<ApiResponse<FavoriteRoom[]>> => {
    const response = await api.get('/favorites');
    return response.data;
  },

  getIds: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/favorites/ids');
    return response.data;
  },

  add: async (roomId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.post(`/favorites/${roomId}`);
    return response.data;
  },

  remove: async (roomId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/favorites/${roomId}`);
    return response.data;
  },
};
