import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../services/favorites';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
  });
}

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: () => favoritesApi.getIds(),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, isFavorited }: { roomId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return favoritesApi.remove(roomId);
      }
      return favoritesApi.add(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
