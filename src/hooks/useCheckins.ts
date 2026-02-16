import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInsApi } from '../services/checkins';
import { Alert } from 'react-native';

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => checkInsApi.checkIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Checked In!', 'You have successfully checked in.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to check in';
      Alert.alert('Error', message);
    },
  });
}

export function useCheckInStatus(bookingId: string) {
  return useQuery({
    queryKey: ['checkins', bookingId],
    queryFn: () => checkInsApi.getCheckInStatus(bookingId),
    enabled: !!bookingId,
  });
}

export function useMyCheckInsToday() {
  return useQuery({
    queryKey: ['checkins', 'my', 'today'],
    queryFn: () => checkInsApi.getMyCheckInsToday(),
  });
}

export function useIsCheckedIn(bookingId: string) {
  return useQuery({
    queryKey: ['checkins', bookingId, 'me'],
    queryFn: () => checkInsApi.isCheckedIn(bookingId),
    enabled: !!bookingId,
  });
}
