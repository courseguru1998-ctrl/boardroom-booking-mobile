import { useQuery } from '@tanstack/react-query';
import { roomsApi, type RoomFilters } from '../services/rooms';

export function useRooms(filters: RoomFilters = {}) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => roomsApi.getAll(filters),
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
}

export function useRoomAvailability(id: string, date: string) {
  return useQuery({
    queryKey: ['rooms', id, 'availability', date],
    queryFn: () => roomsApi.getAvailability(id, date),
    enabled: !!id && !!date,
  });
}
