import api from './api';
import type { ApiResponse, Campus, CampusStats } from '../types';

export const campusesApi = {
  getActive: async (): Promise<Campus[]> => {
    const response = await api.get<ApiResponse<Campus[]>>('/campuses/active');
    return response.data.data || [];
  },

  getMy: async (): Promise<Campus | null> => {
    const response = await api.get<ApiResponse<Campus>>('/campuses/my');
    return response.data.data || null;
  },

  getById: async (id: string): Promise<Campus> => {
    const response = await api.get<ApiResponse<Campus>>(`/campuses/${id}`);
    return response.data.data!;
  },

  getStats: async (id: string): Promise<CampusStats> => {
    const response = await api.get<ApiResponse<CampusStats>>(`/campuses/${id}/stats`);
    return response.data.data!;
  },
};
