import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waitlistApi, type AddToWaitlistData } from '../services/waitlist';
import { Alert } from 'react-native';

export function useMyWaitlist() {
  return useQuery({
    queryKey: ['waitlist', 'my'],
    queryFn: () => waitlistApi.getMyWaitlist(),
  });
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToWaitlistData) => waitlistApi.addToWaitlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      Alert.alert('Added to Waitlist', 'You will be notified when this slot becomes available.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to join waitlist';
      Alert.alert('Error', message);
    },
  });
}

export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => waitlistApi.removeFromWaitlist(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
